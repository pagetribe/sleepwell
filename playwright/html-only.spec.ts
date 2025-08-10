import { test, expect } from '@playwright/test';

test('should load html file', async ({ page }) => {
  await page.goto('file://' + __dirname + '/test.html');
  const heading = await page.textContent('h1');
  await page.pause(); // Pause to inspect the page if needed
  expect(heading).toBe('Hello, world!');
});
