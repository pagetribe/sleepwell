import { test, expect } from '@playwright/test';

// Define the localStorage key as per your existing test
const LOCALSTORAGE_SLEEP_LOGS_KEY = 'sleepLogs';

test.describe('SleepLogForm functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the home page of your application where the form is expected to be rendered.
    // The component will read localStorage to determine its initial state.
    await page.goto('http://localhost:3000/');
  });

  // test('should allow logging evening sleep when no in-progress log exists and save to localStorage', async ({ page }) => {
  //   // Clear localStorage to ensure no existing log, which should trigger the 'evening' flow.
  //   await page.evaluate((key) => localStorage.removeItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
  //   await page.reload(); // Reload the page for changes to localStorage to take effect and for the component to re-render.

  //   // Verify that evening-specific fields are visible.
  //   await expect(page.locator('label:has-text("Bedtime")')).toBeVisible();
  //   await expect(page.locator('label:has-text("Wake-up Time (planned)")')).toBeVisible();
  //   await expect(page.locator('label:has-text("End of Day Mood")')).toBeVisible();

  //   // Fill in evening sleep details.
  //   const bedtime = '22:00';
  //   await page.fill('input[name="bedtime"]', bedtime);

  //   // Select the 'Happy' mood (value '5') for bedtimeMood by clicking its associated label.
  //   await page.locator('label[for="bedtime-mood-5"]').click();

  //   // Fill in additional notes.
  //   const notes = 'Finished a great book tonight.';
  //   await page.fill('textarea[name="eveningNotes"]', notes); // Assuming the input field's name is "eveningNotes"

  //   // Click the "Save Log" button to submit the form.
  //   await page.click('button:has-text("Save Log")');

  //   // --- ASSERTION AND DEBUGGING ---

  //   // 1. Wait for the page to settle after the save action.
  //   await page.waitForLoadState('networkidle');
  //   await page.waitForTimeout(200); // Small pause to ensure async operations complete

  //   // 2. Get and inspect the raw localStorage content.
  //   const storedLogsString = await page.evaluate((key) => localStorage.getItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
  //   console.log("--- DEBUGGING LOCALSTORAGE CONTENT ---");
  //   console.log("Raw localStorage content:", storedLogsString);

  //   // 3. Parse the content and inspect the array.
  //   const storedLogs = JSON.parse(storedLogsString || '[]');
  //   console.log("Parsed storedLogs array:", storedLogs);

  //   // Check if any log was saved at all. If this fails, the save action itself might be problematic.
  //   expect(storedLogs.length).toBeGreaterThan(0);

  //   // 4. Calculate the expected date. The app should now save *today's* date for evening logs.
  //   const today = new Date();

  //   // Format today's date in YYYY-MM-DD format to match what the application now saves.
  //   const year = today.getFullYear();
  //   const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  //   const day = String(today.getDate()).padStart(2, '0');
  //   const expectedDate = `${year}-${month}-${day}`;

  //   console.log("Expected Date for current log (matching app format):", expectedDate);

  //   // Find the new log for this expected date, which should have "In Progress" for sleepDuration.
  //   const savedLog = storedLogs.find((log: any) =>
  //     log.date === expectedDate &&
  //     log.sleepDuration === "In Progress"
  //   );

  //   // If you need to manually inspect the browser state before the assertion:
  //   // await page.pause();

  //   // This assertion should now pass, as `savedLog` should be found.
  //   expect(savedLog).toBeDefined();

  //   // Assert that the saved log contains the expected data matching the localStorage image.
  //   expect(savedLog).toEqual(expect.objectContaining({
  //     id: expect.any(String), // The ID is dynamically generated
  //     date: expectedDate,     // Now correctly matches 'YYYY-MM-DD' of the current day
  //     bedtime: bedtime,
  //     // Based on your previous debug output, 'wakeup' is saved as '06:30' even if not explicitly filled in form
  //     wakeup: '06:30',
  //     bedtimeMood: 5,         // The selected mood
  //     // --- FIX: Change 'additionalInfo' to 'eveningNotes' ---
  //     eveningNotes: notes,    // Corrected to match the actual key in localStorage
  //     // These fields default to 0/undefined for an "In Progress" log,
  //     // as they are typically filled during the morning log completion.
  //     wakeupMood: 0,
  //     fuzziness: 0,
  //     wokeUpDuringDream: null, // Should now be explicitly null for new logs
  //     sleepDuration: "In Progress", // Crucial identifier for an incomplete log
  //   }));

  //   // Optionally, verify that some of the logged content is displayed on the page if applicable
  //   // (e.g., if it navigates to a history view)
  //   // await expect(page.locator('text=' + bedtime)).toBeVisible();
  //   // await expect(page.locator('text=' + notes)).toBeVisible();

  //   // You can uncomment this to keep the browser open at the end of the test for manual inspection.
  //   // await page.pause();
  // });


  test('should allow logging evening sleep when no in-progress log exists and then complete it in the morning', async ({ page }) => {
    // --- PART 1: LOGGING EVENING SLEEP ---

    // Clear localStorage to ensure no existing log, which should trigger the 'evening' flow.
    await page.evaluate((key) => localStorage.removeItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
    await page.reload(); // Reload the page for changes to localStorage to take effect and for the component to re-render.

    // Verify that evening-specific fields are visible.
    await expect(page.locator('label:has-text("Bedtime")')).toBeVisible();
    await expect(page.locator('label:has-text("Wake-up Time (planned)")')).toBeVisible();
    await expect(page.locator('label:has-text("End of Day Mood")')).toBeVisible();

    // Fill in evening sleep details.
    const bedtime = '22:00';
    await page.fill('input[name="bedtime"]', bedtime);

    // Select the 'Happy' mood (value '5') for bedtimeMood by clicking its associated label.
    await page.locator('label[for="bedtime-mood-5"]').click();

    // Fill in additional notes.
    const eveningNotes = 'Finished a great book tonight.';
    await page.fill('textarea[name="eveningNotes"]', eveningNotes);

    // Click the "Save Log" button to submit the form.
    await page.click('button:has-text("Save Log")');

    // await page.pause(); // Pause here to inspect the mocked date in the browser console if needed

    // Wait for the page to settle after the save action.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200); // Small pause to ensure async operations complete

    // Get and inspect the raw localStorage content.
    let storedLogsString = await page.evaluate((key) => localStorage.getItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
    console.log("--- DEBUGGING LOCALSTORAGE CONTENT (After Evening Log) ---");
    console.log("Raw localStorage content:", storedLogsString);

    let storedLogs = JSON.parse(storedLogsString || '[]');
    console.log("Parsed storedLogs array:", storedLogs);

    // Check if any log was saved at all.
    expect(storedLogs.length).toBeGreaterThan(0);

    // Calculate the expected date. The app should now save *today's* date for evening logs.
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    const expectedDate = `${year}-${month}-${day}`; // This is the date for the "in progress" log

    console.log("Expected Date for current log (matching app format):", expectedDate);

    // Find the new log for this expected date, which should have "In Progress" for sleepDuration.
    let savedEveningLog = storedLogs.find((log: any) =>
      log.date === expectedDate &&
      log.sleepDuration === "In Progress"
    );

    expect(savedEveningLog).toBeDefined();

    expect(savedEveningLog).toEqual(expect.objectContaining({
      id: expect.any(String), // The ID is dynamically generated
      date: expectedDate,     // Now correctly matches 'YYYY-MM-DD' of the current day
      bedtime: bedtime,
      // Based on your previous debug output, 'wakeup' is saved as '06:30' even if not explicitly filled in form
      wakeup: '06:30', // This is likely the planned wakeup time or default
      bedtimeMood: 5,
      eveningNotes: eveningNotes,
      wakeupMood: 0,
      fuzziness: 0,
      wokeUpDuringDream: null,
      sleepDuration: "In Progress",
    }));

    console.log("Evening log successfully saved and verified.");

    // --- PART 2: LOGGING MORNING SLEEP (THE NEXT DAY) ---

    // Calculate tomorrow's date
    // Calculate tomorrow's date and set it to a "morning" time in the local timezone
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0); // Set time to 8:00 AM in the runner's local timezone
    // Convert this local time to an ISO string. The browser will correctly interpret this back to its local time.
    const tomorrowISOString = tomorrow.toISOString();

    console.log(`Simulating tomorrow's date for the browser: ${tomorrowISOString}`);

    // Mock the Date object to simulate "the next morning"
    // This script runs BEFORE every new document is created in the page, effectively setting the date for the page.
    await page.addInitScript((mockedDate) => {
      const _Date = Date;

      // A more robust mock that preserves the original constructor's behavior
      // for calls with arguments, while mocking the no-argument call.
      // @ts-ignore
      globalThis.Date = class extends _Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            // `new Date()`
            super(mockedDate);
          } else {
            // `new Date(anythingElse)`
            super(...args);
          }
        }

        static now() {
          // `Date.now()`
          return new _Date(mockedDate).getTime();
        }
      };
    }, tomorrowISOString);
    // Reload the page. Now, the app should perceive the date as "tomorrow".
    // It should ideally pick up the "In Progress" log from 'expectedDate' (which is 'today' from the app's perspective
    // before the date mock) and present the morning completion form.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200); // Give components time to render after reload
    
    // Verify that morning-specific fields are visible.
    await expect(page.locator('label:has-text("Wake-up Time")')).toBeVisible();
    await expect(page.locator('label:has-text("Wake-up Mood")')).toBeVisible();
    await expect(page.locator('label:has-text("Mental Fuzziness")')).toBeVisible();
    await expect(page.locator('label:has-text("Woke up mid-dream?")')).toBeVisible();
    
    // Fill in morning sleep details.
    const actualWakeupTime = '07:30'; // Different from planned
    await page.fill('input[name="wakeup"]', actualWakeupTime); // Assuming 'wakeup' is the name for actual wake-up time
    
    // Select the 'Refreshed' mood (value '4') for wakeupMood by clicking its associated label.
    await page.locator('label[for="wakeup-mood-4"]').click();
    
    // Select fuzziness level (e.g., '2' for slightly fuzzy)
    await page.locator('label[for="fuzziness-2"]').click();
    
    // Select 'Yes' for wokeUpDuringDream (value 'true')
    // await page.locator('div:has-text("Woke up mid-dream?") button[role="switch"]').click();
  
    
    // Fill in morning notes.
    const morningNotes = 'Woke up feeling energetic after a vivid dream.';
    await page.fill('textarea[name="morningNotes"]', morningNotes); // Assuming the input field's name is "morningNotes"
    
    // Click the "Save Log" button to submit the form.
    await page.click('button:has-text("Save Log")');
    
    await page.pause(); // Pause here to inspect the mocked date in the browser console if needed
    // Wait for the page to settle after the save action.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);

    // Get and inspect the raw localStorage content after morning log.
    storedLogsString = await page.evaluate((key) => localStorage.getItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
    console.log("--- DEBUGGING LOCALSTORAGE CONTENT (After Morning Log) ---");
    console.log("Raw localStorage content:", storedLogsString);

    storedLogs = JSON.parse(storedLogsString || '[]');
    console.log("Parsed storedLogs array:", storedLogs);

    // Find the log that was previously "In Progress" for 'expectedDate'.
    // This log should now be completed.
    const completedLog = storedLogs.find((log: any) => log.date === expectedDate);

    expect(completedLog).toBeDefined();

    // Assert that the log for 'expectedDate' is now completed with morning details.
    expect(completedLog).toEqual(expect.objectContaining({
        id: expect.any(String),
        date: expectedDate,
        bedtime: bedtime,
        wakeup: actualWakeupTime, // Should be updated to actual wake-up time
        bedtimeMood: 5,
        eveningNotes: eveningNotes,
        wakeupMood: 4,          // The selected morning mood
        fuzziness: 2,           // The selected fuzziness
        wokeUpDuringDream: false, // The switch defaults to 'No' (false) and was not clicked
        sleepDuration: expect.any(String), // Should now be a calculated duration (e.g., "7h 30m"), not "In Progress"
        morningNotes: morningNotes, // New field for morning notes
    }));

    // Optionally, verify that the sleepDuration is no longer "In Progress"
    expect(completedLog.sleepDuration).not.toEqual("In Progress");
    // You could add a more specific regex or format check for sleepDuration if its format is known.

    console.log("Morning log successfully completed and verified for previous day.");

    // You can uncomment this to keep the browser open at the end of the test for manual inspection.
    // await page.pause();
});


});
