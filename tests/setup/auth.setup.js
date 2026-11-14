const { test: setup, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { env } = require('../../utils/env');
const users = require('../../test-data/users.json');

/**
 * Signs in once through the UI and saves the browser storage (session) to .auth/customer.json.
 * Every browser project reuses it, so feature tests start authenticated without repeating the login flow.
 */
setup('authenticate as default customer', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL || users.customer.email;
  const password = process.env.TEST_USER_PASSWORD || users.customer.password;

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);

  await expect(page).toHaveURL(/dashboard\.html/);
  await expect(page.getByTestId('user-name')).toBeVisible();

  await page.context().storageState({ path: env.storageStatePath });
});
