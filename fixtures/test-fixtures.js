const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { PoliciesPage } = require('../pages/PoliciesPage');
const { PolicyDetailsPage } = require('../pages/PolicyDetailsPage');
const { QuotePage } = require('../pages/QuotePage');
const { ClaimsPage } = require('../pages/ClaimsPage');
const users = require('../test-data/users.json');
const messages = require('../test-data/messages.json');

/** Storage state with no session — use for tests that must start signed out. */
const GUEST_STATE = { cookies: [], origins: [] };

/**
 * Custom test object.
 * - Page object fixtures: each test receives ready-to-use page objects, no `new` in specs.
 * - Data fixtures: users and expected UI messages are injected instead of imported in every file.
 * - `loginAs`: signs in as any user from users.json inside the current test (for non-default personas).
 */
const test = base.test.extend({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  policiesPage: async ({ page }, use) => use(new PoliciesPage(page)),
  policyDetailsPage: async ({ page }, use) => use(new PolicyDetailsPage(page)),
  quotePage: async ({ page }, use) => use(new QuotePage(page)),
  claimsPage: async ({ page }, use) => use(new ClaimsPage(page)),

  users: async ({}, use) => use(users),
  messages: async ({}, use) => use(messages),

  // Requires a signed-out context: pair with `test.use({ storageState: GUEST_STATE })`.
  loginAs: async ({ page }, use) => {
    await use(async (userKey) => {
      const user = users[userKey];
      if (!user) throw new Error(`Unknown user "${userKey}" in test-data/users.json`);
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(user.email, user.password);
      await page.waitForURL('**/dashboard.html');
      return user;
    });
  },
});

module.exports = { test, expect: base.expect, GUEST_STATE };
