const { BasePage } = require('./BasePage');
const { DataTableComponent } = require('./components/DataTableComponent');

class PoliciesPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/policies.html');
    this.searchInput = page.getByTestId('policy-search');
    this.productFilter = page.getByLabel('Product');
    this.statusFilter = page.getByLabel('Status');
    this.sortSelect = page.getByLabel('Sort by');
    this.clearFiltersButton = page.getByRole('button', { name: 'Clear filters' });
    this.resultsCount = page.getByTestId('results-count');
    this.emptyState = page.getByTestId('policies-empty-state');
    this.table = new DataTableComponent(page, 'policies-table', 'policy-row');
  }

  async search(term) {
    await this.searchInput.fill(term);
  }

  /** @param {{ product?: string, status?: string }} filters visible option labels */
  async filterBy({ product, status } = {}) {
    if (product) await this.productFilter.selectOption({ label: product });
    if (status) await this.statusFilter.selectOption({ label: status });
  }

  async sortBy(optionLabel) {
    await this.sortSelect.selectOption({ label: optionLabel });
  }

  async clearFilters() {
    await this.clearFiltersButton.click();
  }

  async openPolicy(policyNumber) {
    await this.table.rowContaining(policyNumber).getByRole('link', { name: policyNumber }).click();
  }

  async policyNumbers() {
    return this.table.columnValues('cell-policy-number');
  }
}

module.exports = { PoliciesPage };
