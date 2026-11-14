const { test, expect } = require('../../fixtures/test-fixtures');
const { daysFromToday } = require('../../utils/dateUtils');
const { formatCurrency } = require('../../utils/currency');
const { calculateAnnualPremium, calculateMonthlyPremium } = require('../../utils/premiumCalculator');
const { premiumScenarios } = require('../../test-data/quotes.json');

/**
 * Data-driven: one test per scenario in test-data/quotes.json.
 * Adding a pricing scenario requires no code change.
 */
test.describe('Quote - premium calculation', () => {
  for (const scenario of premiumScenarios) {
    test(`${scenario.id}: ${scenario.title}`, { tag: ['@regression'] }, async ({ quotePage }) => {
      const quote = { ...scenario, startDate: daysFromToday(scenario.startDateOffsetDays) };

      await quotePage.goto();
      await quotePage.getQuote(quote);

      await test.step('review step echoes the customer input', async () => {
        await expect(quotePage.stepIndicator).toHaveText('Step 3 of 3');
        await expect(quotePage.review.insuredItem).toHaveText(quote.insuredItem);
        await expect(quotePage.review.coverage).toHaveText(formatCurrency(quote.coverage));
        await expect(quotePage.review.startDate).toHaveText(quote.startDate);
      });

      await test.step('premium matches pricing rules and expected value', async () => {
        const annual = calculateAnnualPremium(quote);
        // Oracle and documented expectation must agree; guards against stale test data.
        expect(formatCurrency(annual)).toBe(scenario.expected.annualPremium);
        await expect(quotePage.annualPremium).toHaveText(scenario.expected.annualPremium);
        await expect(quotePage.monthlyPremium).toHaveText(formatCurrency(calculateMonthlyPremium(annual)));
        await expect(quotePage.monthlyPremium).toHaveText(scenario.expected.monthlyPremium);
      });

      await test.step('purchased policy status depends on the start date', async () => {
        await quotePage.purchase();
        await expect(quotePage.confirmation).toBeVisible();
        await expect(quotePage.confirmationPolicyNumber).toHaveText(/^IF-(AUT|HOM|TRV|HLT)-\d{6}$/);
        await expect(quotePage.confirmationStatus).toHaveText(scenario.expected.status);
      });
    });
  }
});
