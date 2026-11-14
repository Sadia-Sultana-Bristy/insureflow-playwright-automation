const { BasePage } = require('./BasePage');

class DashboardPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/dashboard.html');
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.activePoliciesCount = page.getByTestId('active-policies-count');
    this.openClaimsCount = page.getByTestId('open-claims-count');
    this.annualPremiumTotal = page.getByTestId('annual-premium-total');
    this.activePolicyItems = page.getByTestId('active-policy-item');
    this.emptyState = page.getByTestId('dashboard-empty-state');
    this.firstQuoteButton = page.getByTestId('first-quote-cta');
    this.getQuoteButton = page.getByTestId('quick-get-quote');
    this.fileClaimButton = page.getByTestId('quick-file-claim');
  }
}

module.exports = { DashboardPage };
