const { test, expect, GUEST_STATE } = require('../../fixtures/test-fixtures');

// Authentication tests must start without the shared session.
test.use({ storageState: GUEST_STATE });

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('customer can sign in with valid credentials', { tag: ['@smoke', '@regression'] }, async ({ loginPage, dashboardPage, users, page }) => {
    const { customer } = users;

    await loginPage.login(customer.email, customer.password);

    await expect(page).toHaveURL(/dashboard\.html$/);
    await expect(dashboardPage.welcomeMessage).toHaveText(`Welcome back, ${customer.firstName}`);
    await expect(dashboardPage.header.userName).toHaveText(`${customer.firstName} ${customer.lastName}`);
  });

  test('sign in is rejected with an incorrect password', { tag: ['@negative', '@regression'] }, async ({ loginPage, users, messages, page }) => {
    const { email, password } = users.invalidCredentials;

    await loginPage.login(email, password);

    await expect(loginPage.errorAlert).toHaveText(messages.login.invalidCredentials);
    await expect(loginPage.passwordInput).toBeEmpty();
    await expect(page).toHaveURL(/login\.html/);
  });

  test('locked account cannot sign in', { tag: ['@negative', '@regression'] }, async ({ loginPage, users, messages, page }) => {
    const { email, password } = users.lockedCustomer;

    await loginPage.login(email, password);

    await expect(loginPage.errorAlert).toHaveText(messages.login.accountLocked);
    await expect(page).toHaveURL(/login\.html/);
  });

  test('login form validates required fields and email format', { tag: ['@validation', '@regression'] }, async ({ loginPage, messages }) => {
    await test.step('empty submission shows both required-field errors', async () => {
      await loginPage.submitEmpty();
      await expect(loginPage.emailError).toHaveText(messages.login.emailRequired);
      await expect(loginPage.passwordError).toHaveText(messages.login.passwordRequired);
      await expect(loginPage.emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    for (const invalidEmail of ['alex.morgan', 'alex@', 'alex morgan@insureflow.test']) {
      await test.step(`"${invalidEmail}" is rejected as an invalid email`, async () => {
        await loginPage.login(invalidEmail, 'AnyPassword1');
        await expect(loginPage.emailError).toHaveText(messages.login.emailInvalid);
        await expect(loginPage.passwordError).toBeHidden();
        await expect(loginPage.errorAlert).toBeHidden();
      });
    }
  });

  test('deep link to a protected page redirects to login and returns after sign in', { tag: ['@regression'] }, async ({ page, loginPage, policyDetailsPage, users, messages }) => {
    const policyNumber = 'IF-HOM-200871';

    await policyDetailsPage.open(policyNumber);

    await expect(page).toHaveURL(/login\.html\?redirect=/);
    await expect(loginPage.infoMessage).toHaveText(messages.login.signInRequired);

    await loginPage.login(users.customer.email, users.customer.password);

    await expect(page).toHaveURL(new RegExp(`policy\\.html\\?id=${policyNumber}$`));
    await expect(policyDetailsPage.fields.policyNumber).toHaveText(policyNumber);
  });
});
