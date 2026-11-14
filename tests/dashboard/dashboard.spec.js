const { test, expect, GUEST_STATE } = require('../../fixtures/test-fixtures');
const { formatCurrency } = require('../../utils/currency');
const portfolio = require('../../test-data/policies.json');

test.describe('Dashboard', () => {
  test('summary cards reflect the customer portfolio', { tag: ['@smoke', '@regression'] }, async ({ dashboardPage }) => {
    const active = portfolio.policies.filter((p) => p.status === 'Active');
    const expectedPremium = active.reduce((sum, p) => sum + p.premium, 0);

    await dashboardPage.goto();

    await expect(dashboardPage.activePoliciesCount).toHaveText(String(active.length));
    await expect(dashboardPage.openClaimsCount).toHaveText(String(portfolio.seededOpenClaims));
    await expect(dashboardPage.annualPremiumTotal).toHaveText(formatCurrency(expectedPremium));
    await expect(dashboardPage.activePolicyItems).toHaveCount(active.length);
  });

  test('header navigation reaches every section', { tag: ['@regression'] }, async ({ page, dashboardPage }) => {
    const sections = [
      { key: 'policies', url: /policies\.html$/, heading: 'My Policies' },
      { key: 'quote', url: /quote\.html$/, heading: 'Get a Quote' },
      { key: 'claims', url: /claims\.html$/, heading: 'Claims' },
      { key: 'dashboard', url: /dashboard\.html$/, heading: /^Welcome back/ },
    ];

    await dashboardPage.goto();

    for (const section of sections) {
      await test.step(`navigate to ${section.key}`, async () => {
        await dashboardPage.header.navigateTo(section.key);
        await expect(page).toHaveURL(section.url);
        await expect(dashboardPage.heading).toHaveText(section.heading);
        await expect(dashboardPage.header.activeLink()).toHaveCount(1);
        await expect(dashboardPage.header.links[section.key]).toHaveAttribute('aria-current', 'page');
      });
    }
  });

  test.describe('new customer', () => {
    test.use({ storageState: GUEST_STATE });

    test('customer without policies sees empty states and a call to action', { tag: ['@regression'] }, async ({ page, loginAs, dashboardPage, claimsPage, messages }) => {
      const user = await loginAs('newCustomer');

      await expect(dashboardPage.welcomeMessage).toHaveText(`Welcome back, ${user.firstName}`);
      await expect(dashboardPage.activePoliciesCount).toHaveText('0');
      await expect(dashboardPage.annualPremiumTotal).toHaveText('$0.00');
      await expect(dashboardPage.emptyState).toContainText(messages.dashboard.noPolicies);

      await test.step('claims cannot be filed without an active policy', async () => {
        await claimsPage.goto();
        await expect(claimsPage.noPoliciesMessage).toHaveText(messages.claims.noActivePolicies);
        await expect(claimsPage.formRoot).toBeHidden();
        await expect(claimsPage.emptyState).toBeVisible();
      });

      await test.step('call to action starts a quote', async () => {
        await dashboardPage.goto();
        await dashboardPage.firstQuoteButton.click();
        await expect(page).toHaveURL(/quote\.html$/);
      });
    });
  });
});
