/**
 * Global application header: primary navigation, signed-in user and sign out.
 * Shared by every authenticated page object via BasePage.
 */
class HeaderComponent {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.root = page.getByTestId('app-header');
    this.nav = this.root.getByRole('navigation', { name: 'Main' });
    this.userName = this.root.getByTestId('user-name');
    this.signOutButton = this.root.getByRole('button', { name: 'Sign out' });
    this.links = {
      dashboard: this.nav.getByRole('link', { name: 'Dashboard' }),
      policies: this.nav.getByRole('link', { name: 'My Policies' }),
      quote: this.nav.getByRole('link', { name: 'Get a Quote' }),
      claims: this.nav.getByRole('link', { name: 'Claims' }),
    };
  }

  /** @param {'dashboard'|'policies'|'quote'|'claims'} section */
  async navigateTo(section) {
    const link = this.links[section];
    if (!link) throw new Error(`Unknown navigation section: ${section}`);
    await link.click();
  }

  activeLink() {
    return this.nav.locator('[aria-current="page"]');
  }

  async signOut() {
    await this.signOutButton.click();
  }
}

module.exports = { HeaderComponent };
