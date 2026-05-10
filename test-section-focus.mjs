import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const filePath = `file://${path.resolve('index.html')}`;
  await page.goto(filePath);

  // Click on "Water" link
  await page.click('a[href="#water"]');
  await page.waitForTimeout(500);

  // Check active element
  const activeId = await page.evaluate(() => document.activeElement ? document.activeElement.id : null);
  const activeTagName = await page.evaluate(() => document.activeElement ? document.activeElement.tagName : null);

  console.log(`Active element id: ${activeId}, tag: ${activeTagName}`);
  await browser.close();
})();
