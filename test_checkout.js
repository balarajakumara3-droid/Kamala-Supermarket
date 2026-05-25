// test_checkout.js
// Automated UI test for Kamala Supermarket checkout flow (desktop & mobile)
// Uses Playwright. Run with: node test_checkout.js

const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function runTest(viewport, label) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const baseUrl = 'http://localhost:8000';

  // Navigate to site
  await page.goto(baseUrl);

  // Inject a sample cart item via localStorage
  await page.evaluate(() => {
    const sample = [{
      id: 'test123',
      name: 'Test Product',
      price: 250,
      mrp: 280,
      image: '',
      weight: '1kg',
      category: 'Test',
      qty: 1,
    }];
    localStorage.setItem('kamala_cart', JSON.stringify(sample));
  });

  // Reload to pick up cart
  await page.reload();

  // Open cart sidebar
  await page.click('.nav-cart-btn');
  await page.waitForSelector('.cart-sidebar.active', { timeout: 3000 });

  // Click Order via WhatsApp button
  await page.click('.cart-sidebar-footer .btn-whatsapp');
  await page.waitForSelector('#checkout-overlay.active', { timeout: 5000 });

  // Fill delivery info (Step 1)
  await page.fill('#co-name', 'John Doe');
  await page.fill('#co-phone', '9998887777');
  await page.selectOption('#co-area', 'town');
  await page.fill('#co-address', '123 Sample St, Nagercoil');

  // Proceed to Step 2
  await page.click('#checkout-next-btn');
  await page.waitForTimeout(500); // allow UI transition

  // Verify the full payment gateway option is selectable and visible
  await page.click('#pay-tab-razorpay');
  await page.waitForSelector('#pay-panel-razorpay.active', { timeout: 3000 });
  assert.equal(await page.isVisible('#pay-tab-razorpay.active'), true);
  const gatewayText = await page.textContent('#pay-panel-razorpay');
  assert.match(gatewayText, /UPI/);
  assert.match(gatewayText, /Net Banking/);
  assert.match(gatewayText, /EMI/);
  assert.match(gatewayText, /Pay Later/);

  // Switch back to COD and complete order
  await page.click('#pay-tab-cod');

  // Select COD (already default) and complete order
  await page.click('#checkout-next-btn');

  // Wait for processing animation to finish
  await page.waitForSelector('#checkout-processing.active', { state: 'hidden', timeout: 5000 });

  // Capture final state screenshot
  await page.screenshot({ path: `checkout_${label}.png`, fullPage: true });

  await browser.close();
}

(async () => {
  // Desktop view
  await runTest({ width: 1200, height: 800 }, 'desktop');
  // Mobile view (iPhone X size)
  await runTest({ width: 375, height: 667 }, 'mobile');
  console.log('✅ Screenshots generated: checkout_desktop.png, checkout_mobile.png');
})();
