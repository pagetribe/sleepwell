'use client';

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

const calculateScore = (log: SleepLog): number => {
  // The bedtimeMood is from the night before the wakeupMood (i.e., bedtime on day N, wakeup on day N+1)
  // This function assumes that log.bedtimeMood is associated with the previous day of log.wakeupMood
  const wakeupMoodScore = log.wakeupMood;
  const fuzzinessScore = 6 - log.fuzziness; 
  const bedtimeMoodScore = log.bedtimeMood;
  return wakeupMoodScore + fuzzinessScore + bedtimeMoodScore;
};

export const SleepStats: FC<SleepStatsProps> = ({ logs, onDelete }) => {
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const completedLogs = logs.filter(log => log.sleepDuration !== 'In Progress');

  if (completedLogs.length < 3) {
    return (
      <div>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">Sleep Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Not enough data to show stats yet.</p>
            <p>Log at least 3 nights of sleep to see your analysis.</p>
          </div>
        </CardContent>
      </div>
    );
  }

  // When displaying or aggregating, make sure to clarify that bedtimeMood is from the previous day
  // For example, if you want to group by date, use the wakeup date as the "main" date for the log

  const durationData = completedLogs.reduce((acc, log) => {
    const score = calculateScore(log);
    if (!acc[log.sleepDuration]) {
      acc[log.sleepDuration] = { totalScore: 0, count: 0 };
    }
    acc[log.sleepDuration].totalScore += score;
    acc[log.sleepDuration].count += 1;
    return acc;
  }, {} as Record<string, { totalScore: number; count: number }>);

  const chartData = Object.entries(durationData).map(([duration, data]) => ({
    name: duration,
    'Average Score': parseFloat((data.totalScore / data.count).toFixed(2)),
  }));

  const bestDuration = chartData.reduce((best, current) => {
    return current['Average Score'] > best['Average Score'] ? current : best;
  }, chartData[0]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0] && data.activePayload[0].payload) {
      setSelectedDuration(data.activePayload[0].payload.name);
      setIsDialogOpen(true);
    }
  };

  const selectedLogs = selectedDuration
    ? logs.filter((log) => log.sleepDuration === selectedDuration)
    : [];

  // Example: grouping logs by wakeup date
  const logsByWakeupDate = logs.reduce((acc, log) => {
    const wakeupDate = log.wakeup.slice(0, 10); // YYYY-MM-DD
    if (!acc[wakeupDate]) acc[wakeupDate] = [];
    acc[wakeupDate].push(log);
    return acc;
  }, {} as Record<string, SleepLog[]>);

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
              (Bedtime mood is from the night before the wakeup mood.)
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
            Higher score is better. Click a bar for details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
             <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} onClick={handleBarClick}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground) / 0.1)" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground) / 0.5)" />
                    <YAxis stroke="hsl(var(--foreground) / 0.5)"/>
                    <Tooltip contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      boxShadow: 'var(--shadow-neumorphic-flat)',
                    }}/>
                    <Legend wrapperStyle={{ color: 'hsl(var(--foreground) / 0.8)'}}/>
                    <Bar dataKey="Average Score" fill="hsl(var(--primary))" style={{ cursor: 'pointer' }} radius={[4, 4, 0, 0]}/>
                </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-md w-full neumorphic-flat">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><ClockIcon className="mr-2 h-6 w-6" />Sleep Logs for {selectedDuration}</AlertDialogTitle>
            <AlertDialogDescription>
              Here are the detailed sleep logs for the duration you selected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
             <SleepLogList logs={selectedLogs} onDelete={onDelete} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};
