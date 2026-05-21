// snapshot.js - capture landing page screenshot using Playwright with increased timeout
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  // Wait for the splash element to be visible before proceeding
  await page.goto('http://localhost:3001', { waitUntil: 'load', timeout: 60000 });
  // Ensure splash is present
  await page.waitForSelector('#splash', { state: 'visible', timeout: 10000 }).catch(() => {});
  // Capture full page screenshot including splash
  await page.screenshot({ path: 'splash_screenshot.png', fullPage: true });
  await browser.close();
})();
