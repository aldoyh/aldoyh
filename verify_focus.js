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
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  // Test T keyboard shortcut
  console.log('Testing Theme Toggle keyboard shortcut (T)...');
  await page.keyboard.press('t');
  await page.waitForTimeout(500);

  // Take a screenshot of light mode
  await page.screenshot({ path: 'light-mode-theme.png' });
  console.log('Screenshot saved to light-mode-theme.png');

  // Verify theme changed
  const isLightMode = await page.evaluate(() => {
    return document.body.classList.contains('light-theme');
  });

  if (isLightMode) {
    console.log('SUCCESS: Light mode activated via keyboard shortcut!');
  } else {
    console.log('ERROR: Light mode was NOT activated.');
  }

  // Open mobile menu
  console.log('Testing mobile menu Escape key...');
  await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
  await page.click('#mobile-menu-btn');
  await page.waitForTimeout(500);

  const isMenuOpenBefore = await page.evaluate(() => {
    return document.getElementById('nav-links').classList.contains('active');
  });

  if (isMenuOpenBefore) {
    console.log('SUCCESS: Mobile menu opened.');
  } else {
    console.log('ERROR: Mobile menu did not open.');
  }

  // Press Escape to close
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const isMenuOpenAfter = await page.evaluate(() => {
    return document.getElementById('nav-links').classList.contains('active');
  });

  if (!isMenuOpenAfter) {
    console.log('SUCCESS: Mobile menu closed via Escape key!');
  } else {
    console.log('ERROR: Mobile menu did NOT close via Escape key.');
  }

  await browser.close();
})();
