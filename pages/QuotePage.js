const { BasePage } = require('./BasePage');
const { FormComponent } = require('./components/FormComponent');

const PRODUCT_LABELS = { auto: 'Auto', home: 'Home', travel: 'Travel', health: 'Health' };
const TIER_LABELS = { basic: 'Basic', standard: 'Standard', premium: 'Premium' };

/** Multi-step quote & buy wizard: cover selection -> details -> review & purchase. */
class QuotePage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/quote.html');
    this.form = new FormComponent(page.locator('#quote-form'));
    this.stepIndicator = page.getByTestId('quote-step-indicator');
    this.steps = {
      cover: page.getByTestId('quote-step-1'),
      details: page.getByTestId('quote-step-2'),
      review: page.getByTestId('quote-step-3'),
    };

    // Step 1
    this.productGroup = page.getByRole('group', { name: 'Product' });
    this.tierGroup = page.getByRole('group', { name: 'Coverage tier' });
    this.continueButton = page.getByTestId('step-1-next');

    // Step 2
    this.insuredItemInput = page.getByLabel('What are you insuring?');
    this.coverageInput = page.getByLabel('Coverage amount (USD)');
    this.startDateInput = page.getByLabel('Cover start date');
    this.detailsBackButton = page.getByTestId('step-2-back');
    this.calculateButton = page.getByRole('button', { name: 'Calculate premium' });

    // Step 3
    this.review = {
      product: page.getByTestId('review-product'),
      tier: page.getByTestId('review-tier'),
      insuredItem: page.getByTestId('review-insured-item'),
      coverage: page.getByTestId('review-coverage'),
      startDate: page.getByTestId('review-start-date'),
    };
    this.annualPremium = page.getByTestId('quote-annual-premium');
    this.monthlyPremium = page.getByTestId('quote-monthly-premium');
    this.acceptTermsCheckbox = page.getByLabel(/accept the policy terms/);
    this.reviewBackButton = page.getByTestId('step-3-back');
    this.purchaseButton = page.getByRole('button', { name: 'Purchase policy' });

    // Confirmation
    this.confirmation = page.getByTestId('quote-confirmation');
    this.confirmationPolicyNumber = page.getByTestId('confirmation-policy-number');
    this.confirmationStatus = page.getByTestId('confirmation-status');
    this.viewPolicyLink = page.getByRole('link', { name: 'View policy' });
  }

  async selectCover(productType, tier) {
    await this.productGroup.getByLabel(PRODUCT_LABELS[productType], { exact: true }).check();
    await this.tierGroup.getByLabel(TIER_LABELS[tier], { exact: true }).check();
    await this.continueButton.click();
  }

  async fillDetails({ insuredItem, coverage, startDate }) {
    await this.insuredItemInput.fill(String(insuredItem));
    await this.coverageInput.fill(String(coverage));
    await this.startDateInput.fill(startDate);
    await this.calculateButton.click();
  }

  async purchase({ acceptTerms = true } = {}) {
    if (acceptTerms) await this.acceptTermsCheckbox.check();
    await this.purchaseButton.click();
  }

  /** Runs the whole wizard up to the review step. */
  async getQuote(quote) {
    await this.selectCover(quote.productType, quote.tier);
    await this.fillDetails(quote);
  }

  /** Runs the whole wizard and returns the issued policy number. */
  async buyPolicy(quote) {
    await this.getQuote(quote);
    await this.purchase();
    await this.confirmation.waitFor();
    return (await this.confirmationPolicyNumber.innerText()).trim();
  }
}

module.exports = { QuotePage };
