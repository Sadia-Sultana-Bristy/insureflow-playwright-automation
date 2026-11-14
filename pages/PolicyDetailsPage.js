const { BasePage } = require('./BasePage');

class PolicyDetailsPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/policy.html');
    this.details = page.getByTestId('policy-details');
    this.notFound = page.getByTestId('policy-not-found');
    this.fileClaimButton = page.getByRole('link', { name: 'File a claim' });
    this.backLink = page.getByTestId('back-to-policies');
    this.fields = {
      policyNumber: page.getByTestId('policy-number'),
      type: page.getByTestId('policy-type'),
      tier: page.getByTestId('policy-tier'),
      insuredItem: page.getByTestId('policy-insured-item'),
      status: page.getByTestId('policy-status'),
      coverage: page.getByTestId('policy-coverage'),
      premium: page.getByTestId('policy-premium'),
      startDate: page.getByTestId('policy-start-date'),
      renewalDate: page.getByTestId('policy-renewal-date'),
    };
  }

  async open(policyNumber) {
    await this.goto(`?id=${encodeURIComponent(policyNumber)}`);
  }
}

module.exports = { PolicyDetailsPage };
