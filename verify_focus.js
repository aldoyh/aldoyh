const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const filePath = `file://${path.resolve('/app/index.html')}`;
  console.log(`Navigating to ${filePath}`);
  await page.goto(filePath);

  // Press tab to focus the first focusable element (skip-link)
  await page.keyboard.press('Tab');

  // Verify z-index and positions
  const skipLinkInfo = await page.evaluate(() => {
    const el = document.querySelector('.skip-link');
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return { zIndex: style.zIndex, top: rect.top, height: rect.height, visible: el.offsetParent !== null };
  });

  console.log('Skip link:', skipLinkInfo);

  // Press Enter to click the focused skip-link
  console.log('Pressing Enter on skip link...');
  await page.keyboard.press('Enter');

  // Wait a bit for smooth scrolling/focus to complete
  await page.waitForTimeout(500);

  // Verify that active element is now main-content
  const activeElementId = await page.evaluate(() => {
    return document.activeElement ? document.activeElement.id : null;
  });

  console.log('Active element ID after clicking skip link:', activeElementId);

  // Take screenshot
  await page.screenshot({ path: '/home/jules/verification/verification.png' });

  if (activeElementId === 'main-content') {
    console.log('SUCCESS: #main-content received focus!');
  } else {
    console.log(`ERROR: #main-content did NOT receive focus. Active element is ${activeElementId}`);
  }

  await browser.close();
})();
