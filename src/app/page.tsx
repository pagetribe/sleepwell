// page.tsx
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

    const relevantLogForMorning = sleepLogs.find(log => !log.wakeupMood || log.wakeupMood === 0);

    let determinedFlow: 'morning' | 'evening';
    let determinedLog: SleepLog | undefined;

    const isMorningTime = currentHour >= 6 && currentHour < 18;

    if (isMorningTime) {
      if (relevantLogForMorning) {
        determinedFlow = 'morning';
        determinedLog = relevantLogForMorning;
      } else {
        determinedFlow = 'evening';
        determinedLog = undefined;
      }
    } else {
      determinedFlow = 'evening';
      determinedLog = undefined;
    }

    setFlow(determinedFlow);
    setFormLog(determinedLog);
  }, [sleepLogs]);


  const handleSaveLog = (logData: Partial<SleepLog>) => {
    let savedLogId = '';
    
    if (logData.id) {
      // If logData has an ID, it means we are updating an existing log (typically a morning entry)
      setSleepLogs(
        sleepLogs.map((log) => {
          if (log.id === logData.id) {
            let updatedLog: SleepLog = { 
              ...log, // Keep existing log data
              ...logData, // Apply new data from form
              // Recalculate sleep duration only if wakeup time is provided (i.e., morning entry)
              sleepDuration: logData.wakeup ? calculateDuration(log.bedtime, logData.wakeup) : log.sleepDuration 
            };

            // --- CRITICAL FIX: Ensure the log.date is the calculated wake-up date ---
            // This logic explicitly determines the correct calendar date for the completed log,
            // which should be the day the user woke up.
            const [bedHours, bedMinutes] = (updatedLog.bedtime || '').split(':').map(Number);
            const [wakeHours, wakeMinutes] = (updatedLog.wakeup || '').split(':').map(Number);

            // Use the original log's date as a reference point for constructing full Date objects.
            // Appending T00:00:00 ensures the date is parsed in the local timezone, not UTC.
            const referenceDate = new Date((log.date ? `${log.date}T00:00:00` : '') || new Date().toISOString().slice(0, 10));

            let fullBedtime = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), bedHours, bedMinutes);
            let fullWakeup = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), wakeHours, wakeMinutes);

            // If the wakeup time is earlier than bedtime on the same calendar day,
            // it implies wakeup is on the next calendar day.
            if (updatedLog.wakeup && fullWakeup.getTime() < fullBedtime.getTime()) {
                fullWakeup.setDate(fullWakeup.getDate() + 1);
            }
            
            // Set the log's date to the calculated wake-up date for consistency.
            // This is the date that will determine which "day card" the morning details appear on.
            const wakeupYear = fullWakeup.getFullYear();
            const wakeupMonth = String(fullWakeup.getMonth() + 1).padStart(2, '0');
            const wakeupDay = String(fullWakeup.getDate()).padStart(2, '0');
            updatedLog.date = `${wakeupYear}-${wakeupMonth}-${wakeupDay}`;

            return updatedLog;
          }
          return log;
        })
      );
      savedLogId = logData.id;
    } else {
      // If logData has no ID, it means we are creating a new log (typically an evening entry)
      const now = new Date();      
      // Using ISO 8601 format (YYYY-MM-DD) for consistency.
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const newLog: SleepLog = {
        id: new Date().toISOString(), // Unique ID for the new log
        date: todayStr, // Initial date for an evening log is its bedtime date
        bedtime: logData.bedtime || '',
        bedtimeMood: logData.bedtimeMood || 0,
        wakeup: logData.wakeup || '', 
        morningNotes: logData.morningNotes || undefined,
        eveningNotes: logData.eveningNotes || undefined,
        wakeupMood: 0, 
        fuzziness: 0, 
        wokeUpDuringDream: logData.wokeUpDuringDream ?? null,
        sleepDuration: 'In Progress', 
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
    const updatedSleepLogs = sleepLogs.map(log => {
        if (log.id === updatedLog.id) {
            let finalLog = { ...updatedLog };

            if (finalLog.bedtime && finalLog.wakeup) {
                const bedtimeLogDate = new Date(log.date); // Use the original log's date as reference for bedtime
                const [bedHours, bedMinutes] = finalLog.bedtime.split(':').map(Number);
                const [wakeHours, wakeMinutes] = finalLog.wakeup.split(':').map(Number);

                const fullBedtime = new Date(bedtimeLogDate.getFullYear(), bedtimeLogDate.getMonth(), bedtimeLogDate.getDate(), bedHours, bedMinutes);
                let fullWakeup = new Date(bedtimeLogDate.getFullYear(), bedtimeLogDate.getMonth(), bedtimeLogDate.getDate(), wakeHours, wakeMinutes);

                if (fullWakeup.getTime() < fullBedtime.getTime()) {
                    fullWakeup.setDate(fullWakeup.getDate() + 1);
                }

                const wakeupYear = fullWakeup.getFullYear();
                const wakeupMonth = String(fullWakeup.getMonth() + 1).padStart(2, '0');
                const wakeupDay = String(fullWakeup.getDate()).padStart(2, '0');
                finalLog.date = `${wakeupYear}-${wakeupMonth}-${wakeupDay}`;
            }
            finalLog.sleepDuration = (finalLog.bedtime && finalLog.wakeup) 
                                       ? calculateDuration(finalLog.bedtime, finalLog.wakeup) 
                                       : finalLog.sleepDuration;

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
