const { HeaderComponent } = require('./components/HeaderComponent');

/**
 * Parent of all page objects. Holds the page, the shared header and common navigation.
 * Page objects expose locators + intent-revealing actions; assertions stay in the tests.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} path relative URL of the page
   */
  constructor(page, path) {
    this.page = page;
    this.path = path;
    this.header = new HeaderComponent(page);
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async goto(query = '') {
    await this.page.goto(`${this.path}${query}`);
  }
}

module.exports = { BasePage };
