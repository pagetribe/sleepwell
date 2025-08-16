"use client";

import * as React from "react";
import { FC, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import type { SleepLog } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StarIcon, ClockIcon } from '@radix-ui/react-icons';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { getDateInTimezone } from "@/lib/utils";
// Removed SleepLogList import as it's not used directly here

interface SleepStatsProps {
  logs: SleepLog[];
  onDelete: (id: string) => void;
}

// Define the structure for a single "night" for stats
interface NightRecord {
  logId: string; // The ID of the original SleepLog
  nightStartDisplay: string; // Formatted date for when sleep started (e.g., "Aug 11")
  nightEndDisplay: string;   // Formatted date for when sleep ended (e.g., "Aug 12")
  bedtime: string;
  wakeup: string;
  sleepDuration: string;
  bedtimeMood: number;
  eveningNotes: string; // Corrected to eveningNotes
  wakeupMood: number;
  fuzziness: number;
  wokeUpDuringDream: boolean;
  morningNotes: string; // Corrected to morningNotes
}

// Helper to process logs into NightRecords for stats
function buildNightRecords(logs: SleepLog[]): NightRecord[] {
  const nights: NightRecord[] = [];

  // Sort logs by their wake-up date (`log.date`) in ascending order
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedLogs.forEach(log => {
    // Only include logs that are "completed" sleep cycles (have both bedtime and wakeup, and wakeupMood)
    // A wakeupMood of 0 (default) typically indicates an incomplete log.
    if (log.bedtime && log.wakeup && (log.wakeupMood !== 0 && log.wakeupMood !== undefined && log.wakeupMood !== null)) {

      // Determine the actual bedtime date for display
      const wakeupDate = getDateInTimezone(log.date); // This is the wakeup date (e.g., Aug 12)
      const [bedHours, bedMinutes] = log.bedtime.split(':').map(Number);
      const [wakeHours, wakeMinutes] = log.wakeup.split(':').map(Number);

      let bedtimeDate = new Date(wakeupDate.getFullYear(), wakeupDate.getMonth(), wakeupDate.getDate(), bedHours, bedMinutes);
      let fullWakeupDateTime = new Date(wakeupDate.getFullYear(), wakeupDate.getMonth(), wakeupDate.getDate(), wakeHours, wakeMinutes);

      // If bedtime is later than wakeup (e.g., 10 PM vs 6 AM), it means bedtime was the previous calendar day
      if (bedtimeDate.getTime() > fullWakeupDateTime.getTime()) {
        bedtimeDate.setDate(bedtimeDate.getDate() - 1);
      }

      const nightStartDisplay = bedtimeDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', timeZone: 'Australia/Sydney' });
      const nightEndDisplay = wakeupDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', timeZone: 'Australia/Sydney' });

      nights.push({
        logId: log.id,
        nightStartDisplay: nightStartDisplay,
        nightEndDisplay: nightEndDisplay,
        bedtime: log.bedtime,
        wakeup: log.wakeup,
        sleepDuration: log.sleepDuration, // Use the already stored sleepDuration
        bedtimeMood: log.bedtimeMood ?? 0, // Default to 0 if null/undefined
        eveningNotes: log.eveningNotes || '', // Use eveningNotes
        wakeupMood: log.wakeupMood ?? 0,
        fuzziness: log.fuzziness ?? 0,
        wokeUpDuringDream: log.wokeUpDuringDream ?? false,
        morningNotes: log.morningNotes || '', // Use morningNotes
      });
    }
  });

  return nights;
}

// This function still calculates score from a SINGLE SleepLog, which is correct.
// It combines aspects of a complete SleepLog.
const calculateScore = (log: SleepLog): number => {
  const wakeupMoodScore = log.wakeupMood ?? 0;
  const fuzzinessScore = 6 - (log.fuzziness ?? 3); // Default fuzziness to 3 if undefined/null
  const bedtimeMoodScore = log.bedtimeMood ?? 0;
  return wakeupMoodScore + fuzzinessScore + bedtimeMoodScore;
};

export const SleepStats: FC<SleepStatsProps> = ({ logs, onDelete }) => {
  const [selectedNightIdx, setSelectedNightIdx] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Build nights using the corrected function
  const nights = buildNightRecords(logs);

  if (nights.length < 1) {
    return (
      <div>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">Sleep Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Not enough data to show stats yet.</p>
            <p>Log at least 1 complete night to see your analysis.</p> {/* Changed from 2 consecutive nights */}
          </div>
        </CardContent>
      </div>
    );
  }

  // Chart: group by sleepDuration (extract hours)
  const durationData = nights.reduce((acc, night) => {
    // Parse the duration string (e.g., "9h 30m") to get the hour part
    const match = night.sleepDuration.match(/(\d+)h/);
    const hourString = match ? match[1] : 'N/A'; // Use 'N/A' for logs without hour part
    if (hourString === 'N/A') return acc; // Skip logs with unparseable duration

    // Ensure the hour is treated as a number for proper grouping
    const hour = parseInt(hourString, 10);

    // Get the score for this specific night (using calculateScore on the original log)
    // We need to find the original log from the 'logs' prop using night.logId
    const originalLog = logs.find(l => l.id === night.logId);
    if (!originalLog) return acc; // Should not happen if buildNightRecords is correct

    const score = calculateScore(originalLog);

    if (!acc[hour]) {
        acc[hour] = { totalScore: 0, count: 0 };
    }
    acc[hour].totalScore += score;
    acc[hour].count += 1;
    return acc;
  }, {} as Record<number, { totalScore: number; count: number }>); // Key is now number

  // Convert to array and sort by hour for chart
  const chartData = Object.entries(durationData)
    .map(([hour, data]) => ({
        name: `${hour}h`,
        'Average Score': parseFloat((data.totalScore / data.count).toFixed(2)),
    }))
    .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10)); // Sort by hour

  // Handle case where chartData might be empty (e.g., all logs are incomplete)
  const bestDuration = chartData.length > 0
    ? chartData.reduce((best, current) => {
        return current['Average Score'] > best['Average Score'] ? current : best;
      }, chartData[0])
    : null;


  const handleBarClick = (data: any) => {
    // Extract the hour from the clicked bar's name (e.g., "9h" -> "9")
    if (data && data.activePayload && data.activePayload[0] && data.activePayload[0].payload) {
      const clickedHour = parseInt(data.activePayload[0].payload.name.replace('h', ''), 10);
      
      // Find the *first* night in the `nights` array that matches this duration's hour
      // (This is just for sample display in the dialog)
      const idx = nights.findIndex(night => {
          const match = night.sleepDuration.match(/(\d+)h/);
          return match && parseInt(match[1], 10) === clickedHour;
      });

      if (idx !== -1) {
        setSelectedNightIdx(idx);
        setIsDialogOpen(true);
      }
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'pm' : 'am';
    const formattedHour = h % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  return (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-semibold">Statistics</CardTitle>
      </CardHeader>
      <Card className="neumorphic-flat">
        <CardHeader>
          <CardTitle>Optimal Sleep</CardTitle>
          <CardDescription>
            Based on your mood and clarity.<br />
            <span className="text-xs text-muted-foreground">
              (Each night is logged from bedtime on day N to wakeup on day N+1)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-2 text-3xl font-bold text-primary">
            <StarIcon className="h-10 w-10" />
            <span>{bestDuration ? bestDuration.name : 'N/A'}</span>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            {bestDuration ? 'This duration gives you the highest average wellness score.' : 'No complete sleep data available yet.'}
          </p>
        </CardContent>
      </Card>
      <Card className="neumorphic-flat">
        <CardHeader>
          <CardTitle>Score by Duration</CardTitle>
          <CardDescription>
            Higher score is better. Click a bar for a sample night.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
            {chartData.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} onClick={handleBarClick}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground) / 0.1)" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground) / 0.5)" />
                    <YAxis stroke="hsl(var(--foreground) / 0.5)" />
                    <Tooltip contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      boxShadow: 'var(--shadow-neumorphic-flat)',
                    }} />
                    <Legend wrapperStyle={{ color: 'hsl(var(--foreground) / 0.8)' }} />
                    <Bar dataKey="Average Score" fill="hsl(var(--primary))" style={{ cursor: 'pointer' }} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>No complete sleep data to generate chart.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List of nights */}
      <Card className="neumorphic-flat">
        <CardHeader>
          <CardTitle>Sleep Nights</CardTitle>
          <CardDescription>
            Each row is a complete sleep cycle: bedtime (day N) to wakeup (day N+1).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nights.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left">Night</th>
                    <th className="px-2 py-1 text-left">Bedtime</th>
                    <th className="px-2 py-1 text-left">Wake-up</th>
                    <th className="px-2 py-1 text-left">Duration</th>
                    <th className="px-2 py-1 text-left">Evening Mood</th>
                    <th className="px-2 py-1 text-left">Morning Mood</th>
                    <th className="px-2 py-1 text-left">Fuzziness</th>
                    <th className="px-2 py-1 text-left">Mid-dream</th>
                    <th className="px-2 py-1 text-left">Evening Notes</th>
                    <th className="px-2 py-1 text-left">Morning Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {nights.map((night) => ( // No need for index key here if night.logId is unique
                    <tr key={night.logId} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => {
                        const originalIdx = nights.findIndex(n => n.logId === night.logId);
                        if (originalIdx !== -1) {
                            setSelectedNightIdx(originalIdx);
                            setIsDialogOpen(true);
                        }
                    }}>
                      <td className="px-2 py-1 font-semibold whitespace-nowrap">{night.nightStartDisplay} → {night.nightEndDisplay}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{formatTime(night.bedtime)}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{formatTime(night.wakeup)}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{night.sleepDuration}</td>
                      <td className="px-2 py-1 text-center">{night.bedtimeMood}/5</td>
                      <td className="px-2 py-1 text-center">{night.wakeupMood}/5</td>
                      <td className="px-2 py-1 text-center">{night.fuzziness}/5</td>
                      <td className="px-2 py-1 text-center">{night.wokeUpDuringDream ? 'Yes' : 'No'}</td>
                      <td className="px-2 py-1">{night.eveningNotes || '-'}</td>
                      <td className="px-2 py-1">{night.morningNotes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
                <p>No complete sleep data to display in table.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for night details */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-md w-full neumorphic-flat">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><ClockIcon className="mr-2 h-6 w-6" />Night Details</AlertDialogTitle>
            <AlertDialogDescription>
              Details for the selected complete sleep cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            {selectedNightIdx !== null && nights[selectedNightIdx] && (
              <div className="space-y-2 text-base">
                <div><b>Night:</b> {nights[selectedNightIdx].nightStartDisplay} → {nights[selectedNightIdx].nightEndDisplay}</div>
                <div><b>Bedtime:</b> {formatTime(nights[selectedNightIdx].bedtime)}</div>
                <div><b>Wake-up:</b> {formatTime(nights[selectedNightIdx].wakeup)}</div>
                <div><b>Duration:</b> {nights[selectedNightIdx].sleepDuration}</div>
                <div><b>Evening Mood:</b> {nights[selectedNightIdx].bedtimeMood}/5</div>
                <div><b>Morning Mood:</b> {nights[selectedNightIdx].wakeupMood}/5</div>
                <div><b>Fuzziness:</b> {nights[selectedNightIdx].fuzziness}/5</div>
                <div><b>Mid-dream:</b> {nights[selectedNightIdx].wokeUpDuringDream ? 'Yes' : 'No'}</div>
                <div><b>Evening Notes:</b> {nights[selectedNightIdx].eveningNotes || '-'}</div>
                <div><b>Morning Notes:</b> {nights[selectedNightIdx].morningNotes || '-'}</div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
