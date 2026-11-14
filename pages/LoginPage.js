const { BasePage } = require('./BasePage');
const { FormComponent } = require('./components/FormComponent');

class LoginPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/login.html');
    this.emailInput = page.getByLabel('Email address');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByTestId('login-button');
    this.errorAlert = page.getByTestId('login-alert');
    this.infoMessage = page.getByTestId('login-info');
    this.form = new FormComponent(page.locator('#login-form'));
    this.emailError = this.form.errorFor('email');
    this.passwordError = this.form.errorFor('password');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async submitEmpty() {
    await this.emailInput.clear();
    await this.passwordInput.clear();
    await this.signInButton.click();
  }
}

module.exports = { LoginPage };
