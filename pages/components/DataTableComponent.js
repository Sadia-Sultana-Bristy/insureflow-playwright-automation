/**
 * Generic wrapper for the application's data tables.
 * Rows and cells are addressed by data-testid so the same component serves policies and claims.
 */
class DataTableComponent {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} tableTestId
   * @param {string} rowTestId
   */
  constructor(page, tableTestId, rowTestId) {
    this.page = page;
    this.root = page.getByTestId(tableTestId);
    this.rows = this.root.getByTestId(rowTestId);
  }

  /** All visible values of one column, in display order. */
  async columnValues(cellTestId) {
    return this.rows.getByTestId(cellTestId).allInnerTexts();
  }

  /** First row whose text contains `text` (e.g. a policy number or claim id). */
  rowContaining(text) {
    return this.rows.filter({ hasText: text });
  }

  /** Reads one row into a plain object keyed by cell test ids (minus the "cell-" prefix). */
  async rowAsObject(row) {
    const cells = row.locator('[data-testid^="cell-"]');
    const count = await cells.count();
    const result = {};
    for (let i = 0; i < count; i += 1) {
      const cell = cells.nth(i);
      const key = (await cell.getAttribute('data-testid')).replace(/^cell-/, '');
      result[key] = (await cell.innerText()).trim();
    }
    return result;
  }
}

module.exports = { DataTableComponent };
