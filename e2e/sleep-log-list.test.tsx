import { test, expect } from '@playwright/test';

// Define your mock data, as before
const mockSleepLogs = [
   {
    id: 'log1',
    date: new Date().toISOString().slice(0, 10), // Set date to today for "In Progress" test
    bedtime: '23:00',
    wakeup: '06:30', // Proposed wakeup
    bedtimeMood: 3,
    // wakeupMood: 0, // 0 or undefined/null for in-progress log
    // wokeUpDuringDream: false,
    // additionalInfo: 'Feeling good|',
    // fuzziness: 0, // 0 for in-progress log
    // sleepDuration: '', // Will be calculated by the component for "in progress"
  },
  // {
  //   id: 'log1',
  //   date: '2025-08-09',
  //   bedtime: '22:30',
  //   wakeup: '07:00',
  //   bedtimeMood: 3,
  //   wakeupMood: 4,
  //   wokeUpDuringDream: false,
  //   additionalInfo: 'Felt tired before bed|Woke up feeling refreshed',
  //   fuzziness: 2,
  //   sleepDuration: '8h 30m',
  // },
  // {
  //   id: 'log2',
  //   date: '2025-08-08',
  //   bedtime: '23:00',
  //   wakeup: '06:30',
  //   bedtimeMood: 4,
  //   wakeupMood: 3,
  //   wokeUpDuringDream: true,
  //   additionalInfo: 'Read a book before sleep|Dreamt about flying',
  //   fuzziness: 3,
  //   sleepDuration: '7h 30m',
  // },
  // {
  //   id: 'log3',
  //   date: '2025-08-07',
  //   bedtime: '22:00',
  //   wakeup: '05:00',
  //   bedtimeMood: 2,
  //   wakeupMood: 2,
  //   wokeUpDuringDream: false,
  //   additionalInfo: 'A bit stressed before bed|Still tired after waking',
  //   fuzziness: 4,
  //   sleepDuration: '7h 0m',
  // },
  // {
  //   id: 'log4',
  //   date: new Date().toISOString().slice(0, 10), // Set date to today for "In Progress" test
  //   bedtime: '23:00',
  //   wakeup: '07:00', // Proposed wakeup
  //   bedtimeMood: 4,
  //   wakeupMood: 0, // 0 or undefined/null for in-progress log
  //   wokeUpDuringDream: false,
  //   additionalInfo: 'Feeling good|',
  //   fuzziness: 0, // 0 for in-progress log
  //   sleepDuration: '', // Will be calculated by the component for "in progress"
  // },
];

// Confirmed from your image!
const LOCALSTORAGE_SLEEP_LOGS_KEY = 'sleepLogs'; 

test('should allow logging evening sleep and display it in history', async ({ page }) => { // Changed test name to reflect new action
    // Clear localStorage to ensure no existing log, which should trigger the 'evening' flow.
    await page.evaluate((key) => localStorage.removeItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
    await page.reload();

    // ... (rest of your form filling and submission code) ...
    await page.fill('input[name="bedtime"]', '22:00');
    await page.fill('input[name="wakeupTime"]', '07:30');
    await page.locator('label[for="bedtime-mood-5"]').click();
    await page.fill('textarea[name="additionalInfo"]', 'Finished a great book tonight.');
    await page.click('button:has-text("Save Log")');

    // --- NEW STEPS TO HIT THE BREAKPOINT ---

    // 1. Wait for the save action to complete and potentially for the page to update
    //    (e.g., if it navigates or re-renders). A simple wait for network idle or a specific element to appear can help.
    await page.waitForLoadState('networkidle'); // Wait for network activity to cease

    // 2. Click the History tab/button to navigate to the Sleep History view
    //    (Assuming your app has such a navigation, similar to your sleep-log-list.test.tsx)
    const historyTabButton = page.locator('button[aria-controls*="history"]'); // Adjust locator if needed
    await historyTabButton.click();

    // 3. Wait for the Sleep History content to load and be visible
    await expect(page.locator('h2', { hasText: 'Sleep History' })).toBeVisible();

    // 4. Optionally, add a page.pause() here if you want to inspect before the breakpoint is hit,
    //    or if you're still having trouble and want to confirm the SleepLogList is rendered.
    // await page.pause();

    // Now, when the SleepLogList component renders with the new log from localStorage,
    // the code at line 124 should be executed, and your breakpoint should be hit.

    // ... (rest of your assertions, e.g., checking localStorage) ...
    const storedLogsString = await page.evaluate((key) => localStorage.getItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
    const storedLogs = JSON.parse(storedLogsString || '[]');
    expect(storedLogs.length).toBeGreaterThan(0);
    // ... continue with your assertions about the saved log
  });

// test('should display sleep history with mocked data from localStorage', async ({ page, context }) => {
//   // Use context.addInitScript to inject the data into localStorage
//   // This script runs BEFORE any page content loads for every page in the context.
//   await context.addInitScript(({ key, data }) => {
//     localStorage.setItem(key, JSON.stringify(data));
//     console.log(`[Playwright Init Script] Injected ${data.length} sleep logs into localStorage under key: ${key}`);
//   }, { key: LOCALSTORAGE_SLEEP_LOGS_KEY, data: mockSleepLogs });

//   // Now, navigate to the page. localStorage will already be populated when the app loads.
//   await page.goto('http://localhost:3000/');

//   // Click the History tab
//   const historyTabButton = page.locator('button[aria-controls*="history"]');
//   await historyTabButton.click();

//   // Wait for the DOM to be fully loaded and for the expected elements to appear.
//   await expect(page.locator('h2')).toContainText('Sleep History');

//   // Use page.pause() here to inspect the page manually
//   // Open DevTools (F12) -> Application -> Local Storage
//   // Confirm your data is present under 'sleepLogs' key.
//   // Then, visually confirm if the sleep logs are rendered in the UI.
//   // await page.pause(); // Uncomment if you need to debug again

//   // Calculate the expected title for today's log based on the current date
//   const today = new Date();
//   const titleDateOptions: Intl.DateTimeFormatOptions = {
//     weekday: 'long',
//     month: 'long',
//     day: 'numeric',
//   };
//   const expectedTodayTitle = today.toLocaleDateString('en-US', titleDateOptions);

//   // Assertions for the displayed sleep logs
//  await page.pause(); // Uncomment if you need to debug again
//   // Check for the "In Progress" log entry based on the current date
//   await expect(page.locator('.AccordionTrigger', { hasText: expectedTodayTitle })).toBeVisible();
//   await expect(page.locator('.AccordionTrigger', { hasText: expectedTodayTitle }).locator('span.font-bold')).toContainText('In Progress');
//   // For log4 (today), bedtime 23:00, wakeup 07:00 -> 8 hours
//   await expect(page.locator('.AccordionTrigger', { hasText: expectedTodayTitle }).locator('span.text-xs')).toContainText('proposed duration: 8h 0m');

//   // Check for the first completed log (log1 - August 9th)
//   // For log1 (Aug 9), the component calculates duration using previousLog (log2, bedtime 23:00) and log1 wakeup (07:00).
//   // 23:00 to 07:00 is 8 hours.
//   await expect(page.locator('.AccordionTrigger', { hasText: 'August 9' })).toBeVisible();
//   await expect(page.locator('.AccordionTrigger', { hasText: 'August 9' }).locator('span.font-bold')).toContainText('8h 0m');
//   await expect(page.locator('.AccordionTrigger', { hasText: 'August 9' }).locator('span.text-xs')).toContainText('bed: 11:00 pm, woke at 7:00 am');

//   // Check for the second completed log (log2 - August 8th)
//   // For log2 (Aug 8), uses previousLog (log3, bedtime 22:00) and log2 wakeup (06:30).
//   // 22:00 to 06:30 is 8h 30m.
//   await expect(page.locator('.AccordionTrigger', { hasText: 'August 8' })).toBeVisible();
//   await expect(page.locator('.AccordionTrigger', { hasText: 'August 8' }).locator('span.font-bold')).toContainText('8h 30m');
//   await expect(page.locator('.AccordionTrigger', { hasText: 'August 8' }).locator('span.text-xs')).toContainText('bed: 10:00 pm, woke at 6:30 am');

//   // Check for the oldest completed log (log3 - August 7th)
//   // For log3 (Aug 7), there's no previousLog, so it uses its own bedtime (22:00) and wakeup (05:00).
//   // 22:00 to 05:00 is 7 hours.
//   await expect(page.locator('.AccordionTrigger', { hasText: 'August 7' })).toBeVisible();
//   await expect(page.locator('.AccordionTrigger', { hasText: 'August 7' }).locator('span.font-bold')).toContainText('7h 0m');
//   await expect(page.locator('.AccordionTrigger', { hasText: 'August 7' }).locator('span.text-xs')).toContainText('bed: 10:00 pm, woke at 5:00 am');
// });