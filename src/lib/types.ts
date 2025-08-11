export type SleepLog = {
  id: string;
  date: string;
  bedtime: string; // ISO string or Date
  wakeup: string;  // ISO string or Date
  bedtimeMood: number;
  wakeupMood: number;
  wokeUpDuringDream?: boolean;
  morningNotes?: string;
  eveningNotes?: string;
  fuzziness: number;
  sleepDuration: string;
};

export const MOOD_OPTIONS = [
  { value: 1, label: '😞', description: 'Very Poor' },
  { value: 2, label: '😐', description: 'Poor' },
  { value: 3, label: '😊', description: 'Average' },
  { value: 4, label: '😄', description: 'Good' },
  { value: 5, label: '😁', description: 'Excellent' },
];
