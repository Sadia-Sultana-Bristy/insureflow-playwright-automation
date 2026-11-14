const path = require('path');
require('dotenv').config({ quiet: true });

const port = Number(process.env.PORT) || 3000;
const externalBaseURL = process.env.BASE_URL && process.env.BASE_URL.replace(/\/$/, '');

/**
 * Single source of truth for environment configuration.
 * Everything that can differ between laptop, CI and a remote environment is resolved here.
 */
const env = {
  isCI: Boolean(process.env.CI),
  baseURL: externalBaseURL || `http://localhost:${port}`,
  useExternalServer: Boolean(externalBaseURL),
  storageStatePath: path.join(__dirname, '..', '.auth', 'customer.json'),
  screenshotDir: path.join(__dirname, '..', 'screenshots'),
};

module.exports = { env };
