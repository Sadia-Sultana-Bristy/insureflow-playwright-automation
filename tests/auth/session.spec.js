const { test, expect } = require('../../fixtures/test-fixtures');

test.describe('Authentication - Session', () => {
  test('sign out ends the session and protects authenticated pages', { tag: ['@smoke', '@regression'] }, async ({ page, dashboardPage, loginPage, messages }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.header.userName).toBeVisible();

    await dashboardPage.header.signOut();

    await expect(page).toHaveURL(/login\.html\?loggedOut=1/);
    await expect(loginPage.infoMessage).toHaveText(messages.login.signedOut);

    await test.step('browser back / direct URL does not restore the session', async () => {
      await dashboardPage.goto();
      await expect(page).toHaveURL(/login\.html\?redirect=dashboard\.html/);
      await expect(loginPage.signInButton).toBeVisible();
    });
  });
});
