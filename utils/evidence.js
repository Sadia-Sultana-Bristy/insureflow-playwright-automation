const path = require('path');
const { env } = require('./env');

/**
 * Captures a named full-page screenshot into /screenshots and attaches it to the HTML report.
 * Use at key business checkpoints (e.g. policy issued) to keep test evidence for audits / bug reports.
 */
async function captureEvidence(page, testInfo, name) {
  const safeTitle = testInfo.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60);
  const fileName = `${safeTitle}--${name}--${testInfo.project.name}.png`;
  const filePath = path.join(env.screenshotDir, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  await testInfo.attach(name, { path: filePath, contentType: 'image/png' });
  return filePath;
}

module.exports = { captureEvidence };
