const { test, expect } = require('../../fixtures/test-fixtures');
const { daysFromToday } = require('../../utils/dateUtils');
const { buildQuote } = require('../../utils/dataFactory');
const { invalidCoverage } = require('../../test-data/quotes.json');

test.describe('Quote - validation and navigation', () => {
  test.beforeEach(async ({ quotePage }) => {
    await quotePage.goto();
  });

  test('cover selection is mandatory before continuing', { tag: ['@validation', '@regression'] }, async ({ quotePage, messages }) => {
    await quotePage.continueButton.click();

    await expect(quotePage.form.errorFor('productType')).toHaveText(messages.quote.productRequired);
    await expect(quotePage.form.errorFor('tier')).toHaveText(messages.quote.tierRequired);
    await expect(quotePage.stepIndicator).toHaveText('Step 1 of 3');
  });

  test('details step enforces required fields, amount and date rules', { tag: ['@validation', '@negative', '@regression'] }, async ({ quotePage, messages }) => {
    await quotePage.selectCover('home', 'standard');
    await expect(quotePage.steps.details).toBeVisible();

    await test.step('all fields are required', async () => {
      await quotePage.calculateButton.click();
      await expect(quotePage.form.errorFor('insuredItem')).toHaveText(messages.quote.insuredItemRequired);
      await expect(quotePage.form.errorFor('coverage')).toHaveText(messages.quote.coverageRequired);
      await expect(quotePage.form.errorFor('startDate')).toHaveText(messages.quote.startDateRequired);
    });

    for (const { value, error } of invalidCoverage) {
      await test.step(`coverage "${value}" is rejected`, async () => {
        await quotePage.fillDetails({ insuredItem: 'Family home', coverage: value, startDate: daysFromToday(1) });
        await expect(quotePage.form.errorFor('coverage')).toHaveText(error);
        await expect(quotePage.form.visibleErrors()).toHaveCount(1);
      });
    }

    await test.step('start date in the past is rejected', async () => {
      await quotePage.fillDetails({ insuredItem: 'Family home', coverage: 250000, startDate: daysFromToday(-1) });
      await expect(quotePage.form.errorFor('startDate')).toHaveText(messages.quote.startDateInPast);
    });

    await test.step('start date beyond 90 days is rejected', async () => {
      await quotePage.fillDetails({ insuredItem: 'Family home', coverage: 250000, startDate: daysFromToday(91) });
      await expect(quotePage.form.errorFor('startDate')).toHaveText(messages.quote.startDateTooFar);
    });

    await test.step('boundary value: exactly 90 days ahead is accepted', async () => {
      await quotePage.fillDetails({ insuredItem: 'Family home', coverage: 250000, startDate: daysFromToday(90) });
      await expect(quotePage.steps.review).toBeVisible();
    });
  });

  test('purchase requires accepted terms and review allows editing', { tag: ['@validation', '@regression'] }, async ({ quotePage, messages }) => {
    const quote = buildQuote({ productType: 'auto', tier: 'basic', coverage: 30000 });
    await quotePage.getQuote(quote);

    await test.step('purchase is blocked until terms are accepted', async () => {
      await quotePage.purchase({ acceptTerms: false });
      await expect(quotePage.form.errorFor('acceptTerms')).toHaveText(messages.quote.termsRequired);
      await expect(quotePage.confirmation).toBeHidden();
    });

    await test.step('going back keeps the entered details', async () => {
      await quotePage.reviewBackButton.click();
      await expect(quotePage.stepIndicator).toHaveText('Step 2 of 3');
      await expect(quotePage.insuredItemInput).toHaveValue(quote.insuredItem);
      await expect(quotePage.coverageInput).toHaveValue(String(quote.coverage));
      await expect(quotePage.startDateInput).toHaveValue(quote.startDate);
    });

    await test.step('edited coverage is re-priced on the review step', async () => {
      await quotePage.fillDetails({ ...quote, coverage: 40000 });
      // auto 4% x basic 0.8 = 3.2% of 40,000
      await expect(quotePage.annualPremium).toHaveText('$1,280.00');
    });
  });
});
