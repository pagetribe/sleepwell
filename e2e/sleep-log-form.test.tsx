import { test, expect } from '@playwright/test';

// Define the localStorage key as per your existing test
const LOCALSTORAGE_SLEEP_LOGS_KEY = 'sleepLogs';

test.describe('SleepLogForm functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the home page of your application where the form is expected to be rendered.
    await page.goto('http://localhost:3000/');
  });

  test('should allow logging evening sleep when no in-progress log exists and then complete it in the morning', async ({ page }) => {
    // --- PART 1: LOGGING EVENING SLEEP ---

    // Clear localStorage to ensure no existing log.
    await page.evaluate((key) => localStorage.removeItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
    await page.reload();

    // Verify that evening-specific fields are visible.
    await expect(page.locator('label:has-text("Bedtime")')).toBeVisible();

    // Fill in evening sleep details.
    const bedtime = '22:00';
    await page.fill('input[name="bedtime"]', bedtime);
    await page.locator('label[for="bedtime-mood-5"]').click();
    const eveningNotes = 'Finished a great book tonight.';
    await page.fill('textarea[name="eveningNotes"]', eveningNotes);

    // Click the "Save Log" button to submit the form.
    await page.click('button:has-text("Save Log")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);

    let storedLogsString = await page.evaluate((key) => localStorage.getItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
    let storedLogs = JSON.parse(storedLogsString || '[]');

    // Find the new log which should be "In Progress"
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const expectedInitialDate = `${year}-${month}-${day}`; // e.g., '2025-08-12'

    let savedEveningLog = storedLogs.find((log: any) =>
      log.date === expectedInitialDate &&
      log.sleepDuration === "In Progress"
    );

    expect(savedEveningLog).toBeDefined();
    // Verify initial evening log content
    expect(savedEveningLog).toEqual(expect.objectContaining({
      date: expectedInitialDate,
      bedtime: bedtime,
      bedtimeMood: 5,
      eveningNotes: eveningNotes,
      sleepDuration: "In Progress",
    }));

    // --- PART 2: LOGGING MORNING SLEEP (THE NEXT DAY) ---

    // Calculate tomorrow's date for mocking
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0); // Set time to 8:00 AM (for flow determination in `useEffect`)
    const tomorrowISOString = tomorrow.toISOString(); // e.g., '2025-08-13T08:00:00.000Z'

    // Mock the Date object to simulate "the next morning"
    // This script runs BEFORE every new document is created in the page.
    // It's crucial this mock persists for the React app's useEffect and handleSaveLog.
    await page.addInitScript((mockedDate) => {
      const _Date = Date;
      globalThis.Date = class extends _Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockedDate);
          } else {
            super(...args);
          }
        }
        static now() {
          return new _Date(mockedDate).getTime();
        }
      };
    }, tomorrowISOString);

    // Reload the page. Now, the app should perceive the date as "tomorrow"
    // and should load the "in-progress" log for morning completion.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200); // Give components time to render

    // THIS IS THE LINE YOU ASKED ME NOT TO CHANGE ANYTHING EXCEPT FOR THE EXPECTED TIME
    // The value of this variable depends on `tomorrow.toISOString()` which can be affected by timezone.
    const wakeupYear = tomorrow.getFullYear();
    const wakeupMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const wakeupDay = String(tomorrow.getDate()).padStart(2, '0');
    const expectedWakeUpDate = `${wakeupYear}-${wakeupMonth}-${wakeupDay}`; // e.g., '2025-08-13'

    // Verify that morning-specific fields are visible.
    await expect(page.locator('label:has-text("Wake-up Time")')).toBeVisible();

    // Fill in morning sleep details.
    const actualWakeupTime = '07:30';
    await page.fill('input[name="wakeup"]', actualWakeupTime);
    await page.locator('label[for="wakeup-mood-4"]').click();
    await page.locator('label[for="fuzziness-2"]').click();
    const morningNotes = 'Woke up feeling energetic after a vivid dream.';
    await page.fill('textarea[name="morningNotes"]', morningNotes);

    // Click the "Save Log" button to submit the form.
    await page.click('button:has-text("Save Log")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);

    // Get and inspect the raw localStorage content after morning log.
    storedLogsString = await page.evaluate((key) => localStorage.getItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
    storedLogs = JSON.parse(storedLogsString || '[]');

    // Find the log that was previously "In Progress" by its ID.
    const completedLog = storedLogs.find((log: any) => log.id === savedEveningLog.id);

    expect(completedLog).toBeDefined();
    await page.pause(); // Pause to inspect the state if needed
    console.log("......................................................", expectedWakeUpDate)
    // Assert that the log is now completed with morning details AND the updated wake-up date.
    expect(completedLog).toEqual(expect.objectContaining({
        id: savedEveningLog.id, // ID should remain the same
        date: expectedWakeUpDate, // THIS IS THE KEY ASSERTION - should now be '2025-08-13'
        bedtime: bedtime,
        wakeup: actualWakeupTime,
        bedtimeMood: 5,
        eveningNotes: eveningNotes,
        wakeupMood: 4,
        fuzziness: 2,
        wokeUpDuringDream: false,
        sleepDuration: '9h 30m', // Calculate expected duration based on 22:00 to 07:30
        morningNotes: morningNotes,
    }));

    expect(completedLog.sleepDuration).not.toEqual("In Progress");
  });
});
