import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getDateInTimezone = (date: Date | number | string = new Date()) => {
  const ausTime = new Date(date).toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
  return new Date(ausTime);
};

export function calculateDuration(start: string, end: string): string {
  if (!start || !end || !start.includes(':') || !end.includes(':')) {
    return '0h 0m';
  }

  const [startHour, startMinute] = start.split(':').map(Number);
  if (isNaN(startHour) || isNaN(startMinute)) return '0h 0m';
  
  let startDate = new Date(0, 0, 0, startHour, startMinute, 0);

  const [endHour, endMinute] = end.split(':').map(Number);
  if (isNaN(endHour) || isNaN(endMinute)) return '0h 0m';

  let endDate = new Date(0, 0, 0, endHour, endMinute, 0);

  if (endDate <= startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }

  const diff = endDate.getTime() - startDate.getTime();
  const hours = Math.floor(diff / 1000 / 60 / 60);
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}
