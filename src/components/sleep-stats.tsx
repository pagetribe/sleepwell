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
import { SleepLogList } from './sleep-log-list';

interface SleepStatsProps {
  logs: SleepLog[];
  onDelete: (id: string) => void;
}

// Helper to pair logs into nights: each night is bedtime (and mood/notes) from day N, wakeup (and mood/notes) from day N+1
function buildNightRecords(logs: SleepLog[]) {
  // Sort logs by date ascending
  const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nights: Array<{
    nightStart: string; // date string for bedtime (day N)
    nightEnd: string;   // date string for wakeup (day N+1)
    bedtime: string;
    wakeup: string;
    sleepDuration: string;
    bedtimeMood: number;
    bedtimeNotes: string;
    wakeupMood: number;
    fuzziness: number;
    wokeUpDuringDream: boolean;
    wakeupNotes: string;
  }> = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const evening = sorted[i];
    const morning = sorted[i + 1];
    // Only pair if both have required fields
    if (evening.bedtime && morning.wakeup) {
      // Calculate duration
      const [bedHour, bedMin] = evening.bedtime.split(":").map(Number);
      const [wakeHour, wakeMin] = morning.wakeup.split(":").map(Number);
      const bedDate = new Date(`${evening.date}T${evening.bedtime}`);
      const wakeDate = new Date(`${morning.date}T${morning.wakeup}`);
      let durationMs = wakeDate.getTime() - bedDate.getTime();
      if (durationMs < 0) durationMs += 24 * 60 * 60 * 1000; // handle overnight
      const hours = Math.floor(durationMs / (60 * 60 * 1000));
      const mins = Math.round((durationMs % (60 * 60 * 1000)) / (60 * 1000));
      const sleepDuration = `${hours}h ${mins}m`;
      nights.push({
        nightStart: evening.date,
        nightEnd: morning.date,
        bedtime: evening.bedtime,
        wakeup: morning.wakeup,
        sleepDuration,
        bedtimeMood: evening.bedtimeMood,
        bedtimeNotes: evening.additionalInfo || '',
        wakeupMood: morning.wakeupMood,
        fuzziness: morning.fuzziness,
        wokeUpDuringDream: !!morning.wokeUpDuringDream,
        wakeupNotes: morning.additionalInfo || '',
      });
    }
  }
  return nights;
}

const calculateScore = (log: SleepLog): number => {
  // The bedtimeMood is from the night before the wakeupMood (i.e., bedtime on day N, wakeup on day N+1)
  // This function assumes that log.bedtimeMood is associated with the previous day of log.wakeupMood
  const wakeupMoodScore = log.wakeupMood;
  const fuzzinessScore = 6 - log.fuzziness; 
  const bedtimeMoodScore = log.bedtimeMood;
  return wakeupMoodScore + fuzzinessScore + bedtimeMoodScore;
};

export const SleepStats: FC<SleepStatsProps> = ({ logs, onDelete }) => {
  const [selectedNightIdx, setSelectedNightIdx] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
            <p>Log at least 2 consecutive nights to see your analysis.</p>
          </div>
        </CardContent>
      </div>
    );
  }

  // Chart: group by sleepDuration (rounded to nearest hour)
  const durationData = nights.reduce((acc, night) => {
    // Round to nearest hour for grouping
    const match = night.sleepDuration.match(/(\d+)h/);
    const hour = match ? match[1] : '?';
    if (!acc[hour]) acc[hour] = { totalScore: 0, count: 0 };
    // Score: wakeupMood + (6 - fuzziness) + bedtimeMood
    const score = (night.wakeupMood || 0) + (6 - (night.fuzziness || 3)) + (night.bedtimeMood || 0);
    acc[hour].totalScore += score;
    acc[hour].count += 1;
    return acc;
  }, {} as Record<string, { totalScore: number; count: number }>);

  const chartData = Object.entries(durationData).map(([hour, data]) => ({
    name: `${hour}h`,
    'Average Score': parseFloat((data.totalScore / data.count).toFixed(2)),
  }));

  const bestDuration = chartData.reduce((best, current) => {
    return current['Average Score'] > best['Average Score'] ? current : best;
  }, chartData[0]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0] && data.activePayload[0].payload) {
      // Find all nights with this duration
      const hour = data.activePayload[0].payload.name.replace('h', '');
      const idx = nights.findIndex(night => night.sleepDuration.startsWith(hour));
      if (idx !== -1) {
        setSelectedNightIdx(idx);
        setIsDialogOpen(true);
      }
    }
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
              (Each night: bedtime on day N, wakeup on day N+1. Bedtime mood is from the night before the wakeup mood.)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-2 text-3xl font-bold text-primary">
            <StarIcon className="h-10 w-10" />
            <span>{bestDuration.name}</span>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            This duration gives you the highest average wellness score.
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
          </div>
        </CardContent>
      </Card>

      {/* List of nights */}
      <Card className="neumorphic-flat">
        <CardHeader>
          <CardTitle>Sleep Nights</CardTitle>
          <CardDescription>
            Each row is a night: bedtime (day N) to wakeup (day N+1).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-1">Night</th>
                  <th className="px-2 py-1">Bedtime</th>
                  <th className="px-2 py-1">Wake-up</th>
                  <th className="px-2 py-1">Duration</th>
                  <th className="px-2 py-1">Evening Mood</th>
                  <th className="px-2 py-1">Morning Mood</th>
                  <th className="px-2 py-1">Fuzziness</th>
                  <th className="px-2 py-1">Mid-dream</th>
                  <th className="px-2 py-1">Evening Notes</th>
                  <th className="px-2 py-1">Morning Notes</th>
                </tr>
              </thead>
              <tbody>
                {nights.map((night, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedNightIdx(idx); setIsDialogOpen(true); }}>
                    <td className="px-2 py-1 font-semibold">{night.nightStart} → {night.nightEnd}</td>
                    <td className="px-2 py-1">{night.bedtime}</td>
                    <td className="px-2 py-1">{night.wakeup}</td>
                    <td className="px-2 py-1">{night.sleepDuration}</td>
                    <td className="px-2 py-1">{night.bedtimeMood}/5</td>
                    <td className="px-2 py-1">{night.wakeupMood}/5</td>
                    <td className="px-2 py-1">{night.fuzziness}/5</td>
                    <td className="px-2 py-1">{night.wokeUpDuringDream ? 'Yes' : 'No'}</td>
                    <td className="px-2 py-1">{night.bedtimeNotes}</td>
                    <td className="px-2 py-1">{night.wakeupNotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for night details */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-md w-full neumorphic-flat">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><ClockIcon className="mr-2 h-6 w-6" />Night Details</AlertDialogTitle>
            <AlertDialogDescription>
              Details for the selected night.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            {selectedNightIdx !== null && nights[selectedNightIdx] && (
              <div className="space-y-2">
                <div><b>Night:</b> {nights[selectedNightIdx].nightStart} → {nights[selectedNightIdx].nightEnd}</div>
                <div><b>Bedtime:</b> {nights[selectedNightIdx].bedtime}</div>
                <div><b>Wake-up:</b> {nights[selectedNightIdx].wakeup}</div>
                <div><b>Duration:</b> {nights[selectedNightIdx].sleepDuration}</div>
                <div><b>Evening Mood:</b> {nights[selectedNightIdx].bedtimeMood}/5</div>
                <div><b>Morning Mood:</b> {nights[selectedNightIdx].wakeupMood}/5</div>
                <div><b>Fuzziness:</b> {nights[selectedNightIdx].fuzziness}/5</div>
                <div><b>Mid-dream:</b> {nights[selectedNightIdx].wokeUpDuringDream ? 'Yes' : 'No'}</div>
                <div><b>Evening Notes:</b> {nights[selectedNightIdx].bedtimeNotes}</div>
                <div><b>Morning Notes:</b> {nights[selectedNightIdx].wakeupNotes}</div>
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
