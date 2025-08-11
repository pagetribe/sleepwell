Sleep Tracker Application Logic Overview
This document describes the core data model and how data is handled and displayed in the Sleep Tracker application.
1. System Overview
The application tracks a user's sleep by recording data related to a single sleep cycle, which typically spans from an evening bedtime to the subsequent morning's wake-up. While a single sleep cycle is the atomic unit for data storage and statistics, the user interface (specifically the "History" tab) presents data aggregated by calendar day.
2. Data Model: SleepLog (Core Storage Unit)
The foundational data structure for a single sleep record is SleepLog. Each SleepLog object represents one complete sleep cycle (or an "in-progress" one).
code
TypeScript
type SleepLog = {
  id: string;             // Unique identifier for this sleep cycle
  date: string;           // YYYY-MM-DD format. CRITICAL: This is the **WAKE-UP DATE**.
                          // (e.g., if you go to bed on Aug 11th and wake up on Aug 12th, date = "2025-08-12").
  bedtime: string;        // HH:MM (Time you went to bed)
  wakeup: string;         // HH:MM (Time you woke up)
  bedtimeMood: number;    // 1-5 (Mood at the end of the previous day/before bed)
  wakeupMood: number;     // 1-5 (Mood upon waking up)
  fuzziness: number;      // 1-5 (Mental clarity upon waking)
  wokeUpDuringDream: boolean | null; // Whether the user woke up mid-dream
  morningNotes?: string;  // Notes taken in the morning
  eveningNotes?: string;  // Notes taken in the evening before bed
  sleepDuration: string;  // "Xh Ym" format, calculated. "In Progress" for incomplete logs.
}
Key Principle: A single SleepLog object encompasses all data for a specific night's sleep (bedtime and morning details), and its date property always refers to the calendar day of wake-up.
3. Application Flow & Data Handling (Home.tsx)
The Home component manages the primary application state and data persistence (via useLocalStorage).
Flow Determination (useEffect):
Determines if the user should see a 'morning' or 'evening' form based on the current local hour (e.g., 6 AM - 5:59 PM is 'morning', otherwise 'evening').
Crucially:
If it's 'morning' time AND there's an "in-progress" SleepLog (identified by wakeupMood: 0 or undefined), this existing SleepLog is passed to the form for completion.
If it's 'morning' time but NO "in-progress" SleepLog is found, the flow is forced to 'evening'. This prompts the user to log their bedtime first, preventing the creation of isolated "morning-only" sleep logs.
If it's 'evening' time, the flow is always 'evening', and a new SleepLog is prepared.
Data Saving (handleSaveLog):
When the form is submitted:
If logData.id exists: It means an existing SleepLog is being updated (typically completing a morning entry for a log started the previous evening).
The log.date is re-calculated and set to the wake-up date based on the bedtime and wakeup times, ensuring log.date always reflects the day the sleep ended.
sleepDuration is calculated and stored.
If logData.id does NOT exist: It means a new SleepLog is being created (typically an evening entry).
The log.date is set to the current calendar day (which is the bedtime date).
wakeupMood, fuzziness, wokeUpDuringDream, sleepDuration are initialized to 0 or "In Progress" to mark it as incomplete.
Key Principle: Home.tsx ensures that each SleepLog object ultimately represents a full sleep cycle, with its date property pointing to the wake-up day. It manages the "in-progress" state for a single night's sleep.
4. Display Logic (SleepLogList.tsx)
The SleepLogList component is responsible for displaying the SleepLog data in a calendar-day-centric format, as shown in the example image (e.g., a card for Aug 12 showing Morning data for Aug 12 and Evening data for Aug 12, and a separate card for Aug 11 showing Morning data for Aug 11 and Evening data for Aug 11).
Data Transformation (dailyEntriesMap):
It iterates through all raw SleepLog objects provided.
For each SleepLog (log):
Morning Data Assignment: The log is assigned as the morningLog for the DailyLogEntry corresponding to its log.date (which is the wake-up date).
Evening Data Assignment: The actual calendar date of the bedtime for this log is calculated. The log is then assigned as the eveningLog for the DailyLogEntry corresponding to this calculated bedtime date.
This process effectively creates DailyLogEntry objects for each calendar day, where each object can contain:
morningLog: A SleepLog whose sleep ended on this DailyLogEntry.date.
eveningLog: A SleepLog whose sleep started on this DailyLogEntry.date.
Note: A single underlying SleepLog object can be referenced by two different DailyLogEntry objects (one as its morningLog, another as its eveningLog on the previous day).
Rendering:
Each DailyLogEntry object is rendered as a separate AccordionItem (card).
The card's main title and its "Morning" section header display the DailyLogEntry.date.
The "Evening" section header also displays the DailyLogEntry.date (as this represents the evening of that specific calendar day).
Data points within each section (e.g., Woke, Bed, Notes) are conditionally displayed using data from dailyEntry.morningLog or dailyEntry.eveningLog respectively.
Edit/Delete Actions: When "Edit" or "Delete" are triggered, the SleepLogList identifies the original SleepLog object (editableLog) that is primarily associated with the rendered card (e.g., the morningLog if available, otherwise the eveningLog) and passes its id to the parent component for action. This ensures that only a single, coherent SleepLog object is modified or deleted.
Key Principle: SleepLogList.tsx is the presentation layer that transforms the sleep-cycle-centric SleepLog data into a calendar-day-centric view without altering the underlying data model.
5. Statistics Logic (SleepStats.tsx)
The SleepStats component focuses on providing analytical insights into sleep patterns.
Data Filtering/Mapping (buildNightRecords):
This function specifically selects SleepLog objects that represent complete sleep cycles. An "in-progress" log (one without full morning details) is excluded from statistics.
Each selected SleepLog object is directly mapped to a NightRecord for statistical analysis, as it contains all the necessary data for one night's sleep (bedtime, wakeup, duration, both moods, notes).
nightStartDisplay and nightEndDisplay are generated for clarity in the table, reflecting the bedtime date and wakeup date of that single sleep cycle.
Score Calculation (calculateScore):
Calculates a wellness score for a single, complete SleepLog by combining wakeupMood, fuzziness, and bedtimeMood.
Chart and Table Generation:
Uses the NightRecord array to generate charts (e.g., average score by sleep duration) and a detailed table.
Key Principle: SleepStats.tsx operates directly on the complete SleepLog objects, treating each as a holistic "night" for accurate analytical purposes.


first entry:
thursday august 7th (evening)
sleep duratation: ? hours
- morning:
    woke: 6:30 AM
    wake moode: -
    fuzziness: -
    mid-dream: -
    morning notes: -
- evening:
    bed: 10:00 PM
    daytime mood: 4/5
    evening notes: "Had a productive day, feeling accomplished."


friday august 8th: 
sleep duratation: 8 hours
- morning:
    woke: 6:00 AM
    wake moode: happy
    fuzziness: 1/5
    mid-dream: no
    morning notes: "Slept well, woke up refreshed."
- evening:
    bed: 10:00 PM
    daytime mood: 4/5
    evening notes: "Had a productive day, feeling accomplished."


saturday August 9th:
sleep duratation: 7 hours (bed: 10:00 PM, woke at 5:00 AM)
- morning:
    woke: 5:00 AM
    wake moode: happy
    fuzziness: 5/5
    mid-dream: yes
    morning notes: "woke up tireed."
- evening:
    bed: 9:00 PM
    daytime mood: 1/5
    evening notes: "Had a gread day."


sunday august 10th:
sleep duratation: 10 hours (bed: 9:00 PM, woke at 7:00 AM)
- morning:
    woke: 7:00 AM
    wake moode: sad
    fuzziness: 3/5
    mid-dream: no
    morning notes: "woke up ok."
- evening:
    bed: 11:00 PM
    daytime mood: 1/5
    evening notes: "mixed day"




