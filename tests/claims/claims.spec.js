const { test, expect } = require('../../fixtures/test-fixtures');
const { daysFromToday } = require('../../utils/dateUtils');
const { formatCurrency } = require('../../utils/currency');
const claimsData = require('../../test-data/claims.json');
const portfolio = require('../../test-data/policies.json');

test.describe('Claims', () => {
  test('claim form enforces business validation rules', { tag: ['@validation', '@negative', '@regression'] }, async ({ claimsPage, messages }) => {
    const policy = portfolio.policies.find((p) => p.policyNumber === claimsData.validClaim.policyNumber);
    await claimsPage.goto();
    const initialRows = await claimsPage.table.rows.count();

    await test.step('empty form lists every required field', async () => {
      await claimsPage.submitButton.click();
      await expect(claimsPage.form.errorFor('policyNumber')).toHaveText(messages.claims.policyRequired);
      await expect(claimsPage.form.errorFor('incidentType')).toHaveText(messages.claims.typeRequired);
      await expect(claimsPage.form.errorFor('incidentDate')).toHaveText(messages.claims.dateRequired);
      await expect(claimsPage.form.errorFor('amount')).toHaveText(messages.claims.amountRequired);
      await expect(claimsPage.form.errorFor('description')).toHaveText(messages.claims.descriptionTooShort);
    });

    await test.step('incident date cannot be in the future', async () => {
      await claimsPage.submitClaim({ ...claimsData.validClaim, incidentDate: daysFromToday(1) });
      await expect(claimsPage.form.errorFor('incidentDate')).toHaveText(messages.claims.dateInFuture);
    });

    for (const { value, errorKey } of claimsData.invalidAmounts) {
      await test.step(`amount "${value}" is rejected`, async () => {
        await claimsPage.submitClaim({ ...claimsData.validClaim, incidentDate: daysFromToday(-2), amount: value });
        const expected = messages.claims[errorKey].replace('{coverage}', formatCurrency(policy.coverage));
        await expect(claimsPage.form.errorFor('amount')).toHaveText(expected);
      });
    }

    await test.step('description below 20 characters is rejected', async () => {
      await claimsPage.submitClaim({ ...claimsData.validClaim, incidentDate: daysFromToday(-2), description: 'Mirror stolen.' });
      await expect(claimsPage.form.errorFor('description')).toHaveText(messages.claims.descriptionTooShort);
      await expect(claimsPage.descriptionCounter).toHaveText('14 / 500');
    });

    await expect(claimsPage.successMessage).toBeHidden();
    await expect(claimsPage.table.rows).toHaveCount(initialRows);
  });

  test('claim filed from policy details is pre-selected and added to history', { tag: ['@smoke', '@regression'] }, async ({ page, policyDetailsPage, claimsPage }) => {
    const claim = { ...claimsData.validClaim, incidentDate: daysFromToday(-3) };

    await policyDetailsPage.open(claim.policyNumber);
    await policyDetailsPage.fileClaimButton.click();

    await expect(page).toHaveURL(new RegExp(`claims\\.html\\?policy=${claim.policyNumber}$`));
    await expect(claimsPage.policySelect).toHaveValue(claim.policyNumber);

    const { policyNumber, ...rest } = claim;
    await claimsPage.submitClaim(rest);

    await expect(claimsPage.successMessage).toBeVisible();
    const claimId = (await claimsPage.claimReference.innerText()).trim();
    expect(claimId).toMatch(/^CLM-\d{5}$/);

    const row = await claimsPage.table.rowAsObject(claimsPage.table.rowContaining(claimId));
    expect(row).toEqual({
      'claim-id': claimId,
      'claim-policy': claim.policyNumber,
      'claim-type': claim.incidentType,
      'claim-date': claim.incidentDate,
      'claim-amount': formatCurrency(claim.amount),
      'claim-status': 'Submitted',
    });

    await test.step('form is reset for the next claim', async () => {
      await expect(claimsPage.policySelect).toHaveValue('');
      await expect(claimsPage.amountInput).toHaveValue('');
      await expect(claimsPage.descriptionCounter).toHaveText('0 / 500');
    });
  });
});
