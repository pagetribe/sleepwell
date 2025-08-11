'use client';

import { FC, useState, useEffect } from 'react';
import { MoonIcon, ReaderIcon, BarChartIcon } from '@radix-ui/react-icons';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SleepLogForm } from '@/components/sleep-log-form';
import { SleepLogList } from '@/components/sleep-log-list';
import { SleepStats } from '@/components/sleep-stats';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { SleepLog } from '@/lib/types';
import { calculateDuration } from '@/lib/utils';


const Home: FC = () => {
  const [sleepLogs, setSleepLogs] = useLocalStorage<SleepLog[]>('sleepLogs', []);
  const [activeTab, setActiveTab] = useState('log');
  const [lastSavedLogId, setLastSavedLogId] = useState<string | null>(null);
  const [flow, setFlow] = useState<'morning' | 'evening' | null>(null);
  const [formLog, setFormLog] = useState<SleepLog | undefined>(undefined);

  useEffect(() => {
    const today = new Date();
    const currentHour = today.getHours();

    // Find the most recent log that doesn't have a wakeupMood (indicating it's an "in-progress" log)
    // Assuming sleepLogs are ordered from newest to oldest due to how they are added in handleSaveLog.
    const relevantLogForMorning = sleepLogs.find(log => !log.wakeupMood || log.wakeupMood === 0);

    let determinedFlow: 'morning' | 'evening';
    let determinedLog: SleepLog | undefined;

    // Determine if it's "morning time" based on local hour (e.g., 6 AM to 5:59 PM local time)
    const isMorningTime = currentHour >= 6 && currentHour < 18; // This covers 06:00 to 17:59 local time

    if (isMorningTime) {
      // If it's morning time AND there's an in-progress log from the previous evening
      if (relevantLogForMorning) {
        determinedFlow = 'morning';
        determinedLog = relevantLogForMorning;
      } else {
        // If it's morning time but NO in-progress log found,
        // we force the flow to 'evening'. This prompts the user to log their bedtime first.
        determinedFlow = 'evening';
        determinedLog = undefined; // Ensure it's a fresh evening form
      }
    } else {
      // It's evening time (18:00 to 05:59 local time)
      determinedFlow = 'evening';
      determinedLog = undefined; // Evening flow always starts fresh
    }

    setFlow(determinedFlow);
    setFormLog(determinedLog);
  }, [sleepLogs]);


  const handleSaveLog = (logData: Partial<SleepLog>) => {
    let savedLogId = '';
    
    if (logData.id) {
      // If logData has an ID, it means we are updating an existing log (typically a morning entry)
      setSleepLogs(
        sleepLogs.map((log) =>
          log.id === logData.id 
            ? { 
                ...log, 
                ...logData, 
                // --- CRITICAL FIX FOR LOG.DATE ---
                // When completing a log (morning submission), the `date` property
                // should be the calendar date of the wake-up.
                // We directly use `new Date()` here, which will be the mocked Tuesday date in the test.
                date: new Date().toISOString().slice(0, 10),
                
                // Recalculate sleep duration only if wakeup time is provided (i.e., morning entry)
                sleepDuration: logData.wakeup ? calculateDuration(log.bedtime, logData.wakeup) : log.sleepDuration 
              } 
            : log
        )
      );
      savedLogId = logData.id;
    } else {
      // If logData has no ID, it means we are creating a new log (typically an evening entry)
      const now = new Date();      
      // Using ISO 8601 format (YYYY-MM-DD) for consistency and to avoid parsing issues.
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const newLog: SleepLog = {
        id: new Date().toISOString(), // Unique ID for the new log
        date: todayStr, // Initial date for an evening log is its bedtime date
        bedtime: logData.bedtime || '',
        bedtimeMood: logData.bedtimeMood || 0,
        wakeup: logData.wakeup || '', // Will likely be default '06:30' from form
        morningNotes: logData.morningNotes || undefined,
        eveningNotes: logData.eveningNotes || undefined,
        wakeupMood: 0, // Initialized to 0, indicating not yet set by morning entry
        fuzziness: 0, // Initialized to 0
        wokeUpDuringDream: logData.wokeUpDuringDream ?? null, // Initialized
        sleepDuration: 'In Progress', // Placeholder until morning entry completes it
      };
      
      setSleepLogs([newLog, ...sleepLogs]); // Add new log to the beginning of the list
      savedLogId = newLog.id;
    }

    setLastSavedLogId(savedLogId);
    setActiveTab('history'); // Navigate to history after saving
  };

  const handleDeleteLog = (id: string) => {
    setSleepLogs(sleepLogs.filter((log) => log.id !== id));
  };

  const handleEditLog = (updatedLog: SleepLog) => {
    // This function handles direct edits to logs, allowing full modification.
    // Ensure sleepDuration is recalculated if wakeup or bedtime change in an edit.
    const updatedSleepLogs = sleepLogs.map(log => {
        if (log.id === updatedLog.id) {
            let finalLog = { ...updatedLog };

            // Recalculate duration if relevant times are present
            if (finalLog.bedtime && finalLog.wakeup) {
                // Determine the actual wakeup date for the 'date' property
                const bedtimeLogDate = new Date(log.date); // Use the original log's date as reference for bedtime
                const [bedHours, bedMinutes] = finalLog.bedtime.split(':').map(Number);
                const [wakeHours, wakeMinutes] = finalLog.wakeup.split(':').map(Number);

                const fullBedtime = new Date(bedtimeLogDate.getFullYear(), bedtimeLogDate.getMonth(), bedtimeLogDate.getDate(), bedHours, bedMinutes);
                let fullWakeup = new Date(bedtimeLogDate.getFullYear(), bedtimeLogDate.getMonth(), bedtimeLogDate.getDate(), wakeHours, wakeMinutes);

                // If the new wakeup time is earlier than the new bedtime, it implies wakeup is next day
                if (fullWakeup.getTime() < fullBedtime.getTime()) {
                    fullWakeup.setDate(fullWakeup.getDate() + 1);
                }

                // Set the log's date to the wakeup date for consistency
                const wakeupYear = fullWakeup.getFullYear();
                const wakeupMonth = String(fullWakeup.getMonth() + 1).padStart(2, '0');
                const wakeupDay = String(fullWakeup.getDate()).padStart(2, '0');
                finalLog.date = `${wakeupYear}-${wakeupMonth}-${wakeupDay}`;
            }
            finalLog.sleepDuration = (finalLog.bedtime && finalLog.wakeup) 
                                       ? calculateDuration(finalLog.bedtime, finalLog.wakeup) 
                                       : finalLog.sleepDuration; // Keep current if not enough info

            return finalLog;
        }
        return log;
    });
    setSleepLogs(updatedSleepLogs);
  };

  const defaultOpenId = activeTab === 'history' 
    ? lastSavedLogId ?? (sleepLogs.length > 0 ? sleepLogs[0].id : null)
    : null;

  return (
    <div className="flex flex-col min-h-svh bg-background">
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 w-full">
          <main className="flex-1 overflow-y-auto pt-4 sm:pt-6 md:pt-8 pb-20 px-8 sm:px-10 md:px-12">
              <TabsContent value="log">
                {flow ? (
                  <>
                    <h2 className="text-center text-2xl font-semibold mb-6">
                      {flow === 'morning' ? 'Good Morning!' : 'Log Sleep'}
                    </h2>
                    <SleepLogForm onSave={handleSaveLog} existingLog={formLog} flow={flow} />
                  </>
                ) : (
                  <div className="h-96"></div>
                )}
              </TabsContent>
              <TabsContent value="history">
                <SleepLogList
                  logs={sleepLogs}
                  onDelete={handleDeleteLog}
                  onEdit={handleEditLog}
                  defaultOpenId={defaultOpenId}
                />
              </TabsContent>
              <TabsContent value="stats">
                <SleepStats logs={sleepLogs} onDelete={handleDeleteLog} />
              </TabsContent>
          </main>
          <div className="w-full fixed bottom-0 left-0 right-0 bg-background">
            <div className="max-w-md mx-auto px-8 sm:px-10 md:px-12 py-4">
              <TabsList className="grid w-full grid-cols-3 p-1 gap-4">
                  <TabsTrigger value="log" className="px-8">
                    <MoonIcon className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger value="history" className="px-8">
                    <ReaderIcon className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="px-8">
                    <BarChartIcon className="h-5 w-5" />
                  </TabsTrigger>
                </TabsList>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Home;