// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { env } = require('./utils/env');

/**
 * InsureFlow Playwright configuration.
 * - `setup` project signs in once and stores the session for all browser projects.
 * - When BASE_URL is not provided, the bundled demo app is started automatically.
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.isCI ? 2 : 0,
  workers: env.isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    ...(env.isCI ? [['github']] : []),
  ],

  use: {
    baseURL: env.baseURL,
    testIdAttribute: 'data-testid',
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: env.storageStatePath },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: env.storageStatePath },
      dependencies: ['setup'],
    },
  ],

  webServer: env.useExternalServer
    ? undefined
    : {
        command: 'npm run start:app',
        url: `${env.baseURL}/login.html`,
        reuseExistingServer: !env.isCI,
        timeout: 30_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
