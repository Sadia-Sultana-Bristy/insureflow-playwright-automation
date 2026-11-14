const { test, expect } = require('../../fixtures/test-fixtures');
const { parseCurrency, formatCurrency } = require('../../utils/currency');
const portfolio = require('../../test-data/policies.json');

const TOTAL = portfolio.policies.length;

test.describe('Policies - search, filter and sort', () => {
  test.beforeEach(async ({ policiesPage }) => {
    await policiesPage.goto();
    await expect(policiesPage.resultsCount).toHaveText(`Showing ${TOTAL} of ${TOTAL} policies`);
  });

  test('search by policy number returns the exact policy', { tag: ['@smoke', '@regression'] }, async ({ policiesPage }) => {
    const target = portfolio.policies.find((p) => p.policyNumber === 'IF-HLT-400118');

    await policiesPage.search(target.policyNumber.toLowerCase());

    await expect(policiesPage.table.rows).toHaveCount(1);
    const row = await policiesPage.table.rowAsObject(policiesPage.table.rows.first());
    expect(row).toEqual({
      'policy-number': target.policyNumber,
      type: target.type,
      'insured-item': target.insuredItem,
      status: target.status,
      premium: formatCurrency(target.premium),
      'renewal-date': target.renewalDate,
    });
  });

  test('product and status filters combine with search', { tag: ['@regression'] }, async ({ policiesPage }) => {
    const expectedActiveHome = portfolio.policies
      .filter((p) => p.type === 'Home' && p.status === 'Active')
      .map((p) => p.policyNumber)
      .sort();

    await policiesPage.filterBy({ product: 'Home', status: 'Active' });

    await expect(policiesPage.resultsCount).toHaveText(`Showing ${expectedActiveHome.length} of ${TOTAL} policies`);
    expect(await policiesPage.policyNumbers()).toEqual(expectedActiveHome);
    expect(new Set(await policiesPage.table.columnValues('cell-type'))).toEqual(new Set(['Home']));

    await test.step('free-text search narrows the filtered results', async () => {
      await policiesPage.search('chiang mai');
      await expect(policiesPage.table.rows).toHaveCount(1);
      await expect(policiesPage.table.rows.first()).toContainText('IF-HOM-200455');
    });
  });

  test('sorting by premium orders policies numerically', { tag: ['@regression'] }, async ({ policiesPage }) => {
    await policiesPage.sortBy('Premium: high to low');
    const descending = (await policiesPage.table.columnValues('cell-premium')).map(parseCurrency);
    expect(descending).toHaveLength(TOTAL);
    expect(descending).toEqual([...descending].sort((a, b) => b - a));

    await policiesPage.sortBy('Premium: low to high');
    const ascending = (await policiesPage.table.columnValues('cell-premium')).map(parseCurrency);
    expect(ascending).toEqual([...ascending].sort((a, b) => a - b));
    expect(ascending[0]).toBe(Math.min(...portfolio.policies.map((p) => p.premium)));
  });

  test('search without matches shows empty state and clear filters restores the list', { tag: ['@negative', '@regression'] }, async ({ policiesPage, messages }) => {
    await policiesPage.filterBy({ status: 'Expired' });
    await policiesPage.search('Toyota');

    await expect(policiesPage.emptyState).toHaveText(messages.policies.noResults);
    await expect(policiesPage.table.root).toBeHidden();
    await expect(policiesPage.resultsCount).toHaveText(`Showing 0 of ${TOTAL} policies`);

    await policiesPage.clearFilters();

    await expect(policiesPage.table.rows).toHaveCount(TOTAL);
    await expect(policiesPage.searchInput).toHaveValue('');
    await expect(policiesPage.statusFilter).toHaveValue('');
    await expect(policiesPage.emptyState).toBeHidden();
  });
});

test.describe('Policies - details', () => {
  test('policy details match the policy record', { tag: ['@regression'] }, async ({ page, policiesPage, policyDetailsPage }) => {
    const policy = portfolio.policies.find((p) => p.policyNumber === 'IF-AUT-100245');

    await policiesPage.goto();
    await policiesPage.openPolicy(policy.policyNumber);

    await expect(page).toHaveURL(new RegExp(`id=${policy.policyNumber}$`));
    const { fields } = policyDetailsPage;
    await expect(fields.policyNumber).toHaveText(policy.policyNumber);
    await expect(fields.type).toHaveText(policy.type);
    await expect(fields.tier).toHaveText(policy.tier);
    await expect(fields.insuredItem).toHaveText(policy.insuredItem);
    await expect(fields.status).toHaveText(policy.status);
    await expect(fields.coverage).toHaveText(formatCurrency(policy.coverage));
    await expect(fields.premium).toHaveText(formatCurrency(policy.premium));
    await expect(fields.startDate).toHaveText(policy.startDate);
    await expect(fields.renewalDate).toHaveText(policy.renewalDate);
    await expect(policyDetailsPage.fileClaimButton).toBeVisible();
  });

  test('non-active policies do not offer claim filing', { tag: ['@negative', '@regression'] }, async ({ policyDetailsPage }) => {
    for (const status of ['Expired', 'Pending']) {
      const policy = portfolio.policies.find((p) => p.status === status);
      await test.step(`${status} policy ${policy.policyNumber}`, async () => {
        await policyDetailsPage.open(policy.policyNumber);
        await expect(policyDetailsPage.fields.status).toHaveText(status);
        await expect(policyDetailsPage.fileClaimButton).toBeHidden();
      });
    }
  });

  test('unknown policy number shows a not-found state', { tag: ['@negative', '@regression'] }, async ({ policyDetailsPage, messages }) => {
    await policyDetailsPage.open(portfolio.unknownPolicyNumber);

    await expect(policyDetailsPage.notFound).toBeVisible();
    await expect(policyDetailsPage.notFound.getByRole('heading')).toHaveText(messages.policies.notFound);
    await expect(policyDetailsPage.details).toBeHidden();
  });
});
