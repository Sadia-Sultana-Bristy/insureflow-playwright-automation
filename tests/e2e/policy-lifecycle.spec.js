const { test, expect } = require('../../fixtures/test-fixtures');
const { buildQuote, buildClaim } = require('../../utils/dataFactory');
const { formatCurrency, parseCurrency } = require('../../utils/currency');
const { addYears } = require('../../utils/dateUtils');
const { calculateAnnualPremium } = require('../../utils/premiumCalculator');
const { captureEvidence } = require('../../utils/evidence');

/**
 * Business workflow: quote -> buy -> policy visible in portfolio -> file claim -> dashboard KPIs updated.
 * Crosses every major module, so it is the highest-value regression check before a release.
 */
test.describe('E2E - Policy lifecycle', () => {
  test('customer buys a policy, files a claim on it and sees updated account totals', { tag: ['@e2e', '@smoke', '@regression'] }, async ({ page, dashboardPage, quotePage, policiesPage, policyDetailsPage, claimsPage }, testInfo) => {
    const quote = buildQuote({ productType: 'auto', tier: 'premium', coverage: 32000 });
    const expectedPremium = calculateAnnualPremium(quote);

    const baseline = await test.step('capture dashboard baseline', async () => {
      await dashboardPage.goto();
      return {
        activePolicies: Number(await dashboardPage.activePoliciesCount.innerText()),
        openClaims: Number(await dashboardPage.openClaimsCount.innerText()),
        annualPremium: parseCurrency(await dashboardPage.annualPremiumTotal.innerText()),
      };
    });

    const issuedPolicyNumber = await test.step('get a quote and buy the policy', async () => {
      await dashboardPage.getQuoteButton.click();
      await quotePage.getQuote(quote);
      await expect(quotePage.annualPremium).toHaveText(formatCurrency(expectedPremium));

      await quotePage.purchase();
      await expect(quotePage.confirmation).toBeVisible();
      await expect(quotePage.confirmationStatus).toHaveText('Active');
      await captureEvidence(page, testInfo, 'policy-issued');
      return (await quotePage.confirmationPolicyNumber.innerText()).trim();
    });

    await test.step('new policy appears in My Policies with correct data', async () => {
      await quotePage.header.navigateTo('policies');
      await policiesPage.search(quote.insuredItem);
      await expect(policiesPage.table.rows).toHaveCount(1);
      const row = await policiesPage.table.rowAsObject(policiesPage.table.rows.first());
      expect(row).toMatchObject({
        'policy-number': issuedPolicyNumber,
        type: 'Auto',
        status: 'Active',
        premium: formatCurrency(expectedPremium),
        'renewal-date': addYears(quote.startDate, 1),
      });
    });

    const claimId = await test.step('file a claim against the new policy', async () => {
      await policiesPage.openPolicy(issuedPolicyNumber);
      await expect(policyDetailsPage.fields.coverage).toHaveText(formatCurrency(quote.coverage));
      await policyDetailsPage.fileClaimButton.click();

      const claim = buildClaim({ amount: 2750 });
      await claimsPage.submitClaim({ ...claim, policyNumber: undefined });
      await expect(claimsPage.successMessage).toBeVisible();
      const id = (await claimsPage.claimReference.innerText()).trim();
      await expect(claimsPage.table.rowContaining(id)).toContainText(issuedPolicyNumber);
      await captureEvidence(page, testInfo, 'claim-submitted');
      return id;
    });

    await test.step('dashboard KPIs reflect the new policy and open claim', async () => {
      await claimsPage.header.navigateTo('dashboard');
      await expect(dashboardPage.activePoliciesCount).toHaveText(String(baseline.activePolicies + 1));
      await expect(dashboardPage.openClaimsCount).toHaveText(String(baseline.openClaims + 1));
      await expect(dashboardPage.annualPremiumTotal).toHaveText(formatCurrency(baseline.annualPremium + expectedPremium));
      await expect(dashboardPage.activePolicyItems.filter({ hasText: issuedPolicyNumber })).toHaveCount(1);
    });

    testInfo.annotations.push({ type: 'policy', description: issuedPolicyNumber }, { type: 'claim', description: claimId });
  });
});
