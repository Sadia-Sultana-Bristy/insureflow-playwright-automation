const { BasePage } = require('./BasePage');
const { DataTableComponent } = require('./components/DataTableComponent');
const { FormComponent } = require('./components/FormComponent');

class ClaimsPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/claims.html');
    this.formRoot = page.getByTestId('claim-form');
    this.form = new FormComponent(this.formRoot);
    this.policySelect = page.getByLabel('Policy', { exact: true });
    this.incidentTypeSelect = page.getByLabel('Incident type');
    this.incidentDateInput = page.getByLabel('Incident date');
    this.amountInput = page.getByLabel('Claim amount (USD)');
    this.descriptionInput = page.getByLabel('What happened?');
    this.descriptionCounter = page.getByTestId('description-counter');
    this.submitButton = page.getByRole('button', { name: 'Submit claim' });
    this.successMessage = page.getByTestId('claim-success');
    this.claimReference = page.getByTestId('claim-reference');
    this.noPoliciesMessage = page.getByTestId('claim-no-policies');
    this.emptyState = page.getByTestId('claims-empty-state');
    this.table = new DataTableComponent(page, 'claims-table', 'claim-row');
  }

  async openForPolicy(policyNumber) {
    await this.goto(`?policy=${encodeURIComponent(policyNumber)}`);
  }

  /** Fills only the provided fields, so the same method serves positive and negative tests. */
  async fillClaim({ policyNumber, incidentType, incidentDate, amount, description }) {
    if (policyNumber !== undefined) await this.policySelect.selectOption(policyNumber);
    if (incidentType !== undefined) await this.incidentTypeSelect.selectOption(incidentType);
    if (incidentDate !== undefined) await this.incidentDateInput.fill(incidentDate);
    if (amount !== undefined) await this.amountInput.fill(String(amount));
    if (description !== undefined) await this.descriptionInput.fill(description);
  }

  async submitClaim(claim) {
    await this.fillClaim(claim);
    await this.submitButton.click();
  }
}

module.exports = { ClaimsPage };
