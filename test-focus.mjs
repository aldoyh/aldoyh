import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const filePath = `file://${path.resolve('index.html')}`;
  console.log(`Navigating to ${filePath}`);
  await page.goto(filePath);

  // Press tab to focus the first focusable element (skip-link)
  await page.keyboard.press('Tab');

  // Take a screenshot
  await page.screenshot({ path: 'focus-skip-link.png' });
  console.log('Screenshot saved to focus-skip-link.png');

  // Verify z-index and positions
  const skipLinkInfo = await page.evaluate(() => {
    const el = document.querySelector('.skip-link');
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return { zIndex: style.zIndex, top: rect.top, height: rect.height, visible: el.offsetParent !== null };
  });

  const headerInfo = await page.evaluate(() => {
    const el = document.querySelector('header');
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return { zIndex: style.zIndex, bottom: rect.bottom };
  });

  console.log('Skip link:', skipLinkInfo);
  console.log('Header:', headerInfo);

  await browser.close();
})();
