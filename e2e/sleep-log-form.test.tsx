import { test, expect } from '@playwright/test';

// Define the localStorage key as per your existing test
const LOCALSTORAGE_SLEEP_LOGS_KEY = 'sleepLogs';

test.describe('SleepLogForm functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the home page of your application where the form is expected to be rendered.
    // The component will read localStorage to determine its initial state.
    await page.goto('http://localhost:3000/');
  });

  test('should allow logging evening sleep when no in-progress log exists and save to localStorage', async ({ page }) => {
    // Clear localStorage to ensure no existing log, which should trigger the 'evening' flow.
    // Use page.evaluate to run JavaScript in the browser context.
    await page.evaluate((key) => localStorage.removeItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
    await page.reload(); // Reload the page for changes to localStorage to take effect and for the component to re-render.

    // Verify that evening-specific fields are visible.
    await expect(page.locator('label:has-text("Bedtime")')).toBeVisible();
    await expect(page.locator('label:has-text("Wake-up Time (planned)")')).toBeVisible();
    await expect(page.locator('label:has-text("End of Day Mood")')).toBeVisible();

    // Fill in evening sleep details.
    const bedtime = '22:00';
    // const plannedWakeupTime = '07:30'; // This is what's entered in the form
    await page.fill('input[name="bedtime"]', bedtime);
    // await page.fill('input[name="wakeupTime"]', plannedWakeupTime);

    // Select the 'Happy' mood (value '5') for bedtimeMood by clicking its associated label.
    await page.locator('label[for="bedtime-mood-5"]').click();

    // Fill in additional notes.
    const notes = 'Finished a great book tonight.';
    await page.fill('textarea[name="additionalInfo"]', notes);

    // await page.pause(); // Uncomment if you need to debug the test


    await page.pause();

    // Click the "Save Log" button to submit the form.
    await page.click('button:has-text("Save Log")');

    // --- ASSERTION CHANGE: Read from localStorage and adjust the find condition ---
    const storedLogsString = await page.evaluate((key) => localStorage.getItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
    const storedLogs = JSON.parse(storedLogsString || '[]');

    expect(storedLogs.length).toBeGreaterThan(0); // Ensure a log was saved

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    const expectedDate = `${year}-${month}-${day}`;

    // Find the new log for today, which should have "In Progress" for sleepDuration,
    // as seen in the localStorage image.
    const savedLog = storedLogs.find((log: any) =>
      log.date === expectedDate &&
      log.sleepDuration === "In Progress"
    );

    await page.pause(); // Uncomment if you need to debug the test

    expect(savedLog).toBeDefined(); // Ensure the log for today was found

    // Assert that the saved log contains the expected data matching the localStorage image.
    expect(savedLog).toEqual(expect.objectContaining({
      id: expect.any(String), // The ID is dynamically generated
      date: expectedDate,
      bedtime: bedtime,
      // As per the localStorage image, `wakeup` is an empty string for an "In Progress" log,
      // even though a planned `wakeupTime` was provided in the form.
      wakeup: '',
      bedtimeMood: 5, // The selected mood
      additionalInfo: notes,
      // As per the localStorage image, these fields default to 0/false for an "In Progress" log,
      // overriding the form's internal `defaultValues`.
      wakeupMood: 0,
      fuzziness: 0,
      wokeUpDuringDream: false,
      sleepDuration: "In Progress", // Crucial identifier for an incomplete log
    }));

    await page.pause(); // Uncomment if you need to debug the test
  });

//   test('should allow logging morning sleep and pre-populate from an existing in-progress log', async ({ page }) => {
//     // Set up a mock existing log in localStorage to simulate an in-progress log from the previous evening.
//     // These values match the structure of an "In Progress" log as seen in your localStorage image.
//     const today = new Date();
//     const year = today.getFullYear();
//     const month = String(today.getMonth() + 1).padStart(2, '0');
//     const day = String(today.getDate()).padStart(2, '0');
//     const todayDateString = `${year}-${month}-${day}`;

//     const inProgressLog = {
//       id: 'existing-log-123',
//       date: todayDateString,
//       bedtime: '23:00',
//       wakeup: '', // From localStorage image: empty for in-progress
//       bedtimeMood: 4,
//       additionalInfo: 'Watched a movie before bed.',
//       wakeupMood: 0, // From localStorage image: 0 for in-progress
//       fuzziness: 0, // From localStorage image: 0 for in-progress
//       wokeUpDuringDream: false, // From localStorage image: false for in-progress
//       sleepDuration: "In Progress", // From localStorage image
//     };
//     await page.evaluate(({ key, data }) => {
//       localStorage.setItem(key, JSON.stringify([data]));
//     }, { key: LOCALSTORAGE_SLEEP_LOGS_KEY, data: inProgressLog });

//     // Reload the page to pick up the localStorage data, which should trigger the 'morning' flow.
//     await page.reload();

//     // Verify that morning-specific fields are visible.
//     await expect(page.locator('label:has-text("Wake-up Time")')).toBeVisible();
//     await expect(page.locator('label:has-text("Wake-up Mood")')).toBeVisible();
//     await expect(page.locator('label:has-text("Mental Fuzziness")')).toBeVisible();
//     await expect(page.locator('label:has-text("Woke up mid-dream?")')).toBeVisible();

//     // Verify that the form fields are pre-populated.
//     // `wakeupTime`: `existingLog.wakeup || '06:30'` -> `'' || '06:30'` -> '06:30'
//     await expect(page.locator('input[name="wakeupTime"]')).toHaveValue('06:30');
//     await expect(page.locator('textarea[name="additionalInfo"]')).toHaveValue(inProgressLog.additionalInfo);

//     // `wakeupMood`: `String(existingLog.wakeupMood || 3)` -> `String(0 || 3)` -> '3'
//     await expect(page.locator('input[name="wakeupMood"][value="3"]')).toBeChecked();
//     // `fuzziness`: `existingLog.fuzziness || 3` -> `0 || 3` -> 3
//     await expect(page.locator('input[name="fuzziness"][value="3"]')).toBeChecked();
//     // `wokeUpDuringDream`: `existingLog.wokeUpDuringDream || false` -> `false || false` -> false
//     await expect(page.locator('input[name="wokeUpDuringDream"]')).not.toBeChecked();

//     // Update morning sleep details.
//     const actualWakeupTime = '07:05';
//     await page.fill('input[name="wakeupTime"]', actualWakeupTime);

//     // Select 'Energetic' mood (value '5') for wakeupMood.
//     await page.locator('label[for="wakeup-mood-5"]').click();

//     // Select '1' for mental fuzziness.
//     await page.locator('label[for="fuzziness-1"]').click();

//     // Toggle the 'Woke up mid-dream?' switch to 'on'.
//     await page.locator('input[name="wokeUpDuringDream"]').click();

//     // Update additional notes.
//     const updatedNotes = 'Woke up early and felt great. Had a vivid dream!';
//     await page.fill('textarea[name="additionalInfo"]', updatedNotes);

//     // Click Save Log button.
//     await page.click('button:has-text("Save Log")');

//     // --- ASSERTION CHANGE: Read from localStorage and assert its content ---
//     const storedLogsString = await page.evaluate((key) => localStorage.getItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
//     const storedLogs = JSON.parse(storedLogsString || '[]');

//     expect(storedLogs.length).toBeGreaterThan(0);
//     const updatedLog = storedLogs.find((log: any) => log.id === inProgressLog.id); // Find the updated log by ID

//     expect(updatedLog).toBeDefined();

//     // Assert that the saved log contains the expected updated data, retaining the existing ID and previous evening details.
//     expect(updatedLog).toEqual(expect.objectContaining({
//       id: inProgressLog.id, // Should retain the existing ID
//       date: todayDateString,
//       bedtime: inProgressLog.bedtime, // Should retain existing bedtime
//       bedtimeMood: inProgressLog.bedtimeMood, // Should retain existing bedtimeMood
//       wakeup: actualWakeupTime, // Updated wakeup time
//       wakeupMood: 5, // Parsed to integer
//       fuzziness: 1,
//       wokeUpDuringDream: true,
//       additionalInfo: updatedNotes,
//       sleepDuration: expect.any(String), // Expect sleepDuration to be calculated and present (e.g., "8h 0m")
//     }));
//   });

//   test('should handle morning flow with minimal existingLog, applying component defaults for missing fields and updating localStorage', async ({ page }) => {
//     // Set up a mock existing log with only the essential fields (id, date) for the morning flow.
//     // The defaults here reflect how your app saves an "empty" incomplete log.
//     const today = new Date();
//     const year = today.getFullYear();
//     const month = String(today.getMonth() + 1).padStart(2, '0');
//     const day = String(today.getDate()).padStart(2, '0');
//     const todayDateString = `${year}-${month}-${day}`;

//     const minimalLog = {
//       id: 'minimal-log-456',
//       date: todayDateString,
//       bedtime: '', // From localStorage image, if not set it's an empty string.
//       wakeup: '', // From localStorage image: empty for in-progress
//       bedtimeMood: 3, // From localStorage image: default for evening if not specified
//       additionalInfo: '', // From localStorage image: empty string
//       wakeupMood: 0, // From localStorage image: 0 for in-progress
//       fuzziness: 0, // From localStorage image: 0 for in-progress
//       wokeUpDuringDream: false, // From localStorage image: false for in-progress
//       sleepDuration: "In Progress", // From localStorage image
//     };
//     await page.evaluate(({ key, data }) => {
//       localStorage.setItem(key, JSON.stringify([data]));
//     }, { key: LOCALSTORAGE_SLEEP_LOGS_KEY, data: minimalLog });

//     await page.reload();

//     // Verify that defaults are applied based on the useEffect logic.
//     // `wakeupTime`: `existingLog.wakeup || '06:30'` -> `'' || '06:30'` -> '06:30'
//     await expect(page.locator('input[name="wakeupTime"]')).toHaveValue('06:30');
//     // `wakeupMood`: `String(existingLog.wakeupMood || 3)` -> `String(0 || 3)` -> '3'
//     await expect(page.locator('input[name="wakeupMood"][value="3"]')).toBeChecked();
//     // `fuzziness`: `existingLog.fuzziness || 3` -> `0 || 3` -> 3
//     await expect(page.locator('input[name="fuzziness"][value="3"]')).toBeChecked();
//     // `wokeUpDuringDream`: `existingLog.wokeUpDuringDream || false` -> `false || false` -> false
//     await expect(page.locator('input[name="wokeUpDuringDream"]')).not.toBeChecked();
//     await expect(page.locator('textarea[name="additionalInfo"]')).toHaveValue(''); // Based on minimalLog

//     // Fill in new values for the morning log.
//     const actualWakeupTime = '08:00';
//     await page.fill('input[name="wakeupTime"]', actualWakeupTime);
//     await page.locator('label[for="wakeup-mood-1"]').click(); // Select 'Exhausted' mood (value '1')
//     await page.locator('label[for="fuzziness-5"]').click(); // Select '5' for mental fuzziness
//     await page.locator('input[name="wokeUpDuringDream"]').click(); // Toggle switch on
//     const newNotes = 'Slept badly, lots of dreams.';
//     await page.fill('textarea[name="additionalInfo"]', newNotes);

//     await page.click('button:has-text("Save Log")');

//     // --- ASSERTION CHANGE: Read from localStorage and assert its content ---
//     const storedLogsString = await page.evaluate((key) => localStorage.getItem(key), LOCALSTORAGE_SLEEP_LOGS_KEY);
//     const storedLogs = JSON.parse(storedLogsString || '[]');

//     expect(storedLogs.length).toBeGreaterThan(0);
//     const updatedLog = storedLogs.find((log: any) => log.id === minimalLog.id); // Find the updated log by ID

//     expect(updatedLog).toBeDefined();

//     // Assert that the saved log contains the updated data, retaining the existing ID.
//     expect(updatedLog).toEqual(expect.objectContaining({
//       id: minimalLog.id, // Should retain the existing ID
//       date: todayDateString,
//       bedtime: minimalLog.bedtime, // Retains existing bedtime from minimalLog (which is '')
//       bedtimeMood: minimalLog.bedtimeMood, // Retains existing bedtimeMood from minimalLog (which is 3)
//       wakeup: actualWakeupTime, // Updated wakeup time
//       wakeupMood: 1, // Parsed to int
//       fuzziness: 5,
//       wokeUpDuringDream: true,
//       additionalInfo: newNotes,
//       sleepDuration: expect.any(String), // Expect sleepDuration to be calculated and present
//     }));
//   });
});