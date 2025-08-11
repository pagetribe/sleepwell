'use client';

import React, { type FC } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { SleepLog } from '@/lib/types';
import { MOOD_OPTIONS } from '@/lib/types';
import { calculateDuration } from '@/lib/utils';
import { 
  ClockIcon,
  MoonIcon,
  Pencil1Icon,
  TrashIcon,
  InfoCircledIcon,
  BellIcon,
} from '@radix-ui/react-icons';
import { useState } from 'react';

interface SleepLogListProps {
  logs: SleepLog[];
  onDelete: (id: string) => void;
  onEdit: (log: SleepLog) => void;
  defaultOpenId?: string | null;
}

const MoodIndicator: FC<{ value: number }> = ({ value }) => {
  if (value === 0 || value === undefined || value === null) {
    return <span className="text-foreground/60">-</span>;
  }
  const mood = MOOD_OPTIONS.find(m => m.value === value);
  if (!mood) return <span className="text-foreground/60">-</span>;
  return <span className="text-3xl" title={mood.description}>{mood.label}</span>;
};

export const SleepLogList: FC<SleepLogListProps> = ({ logs: rawLogs, onDelete, onEdit, defaultOpenId = null }) => {
  // Normalize logs to handle legacy `wakeup` and `additionalInfo` properties from older data structures.
  const logs = rawLogs.map(log => {
    const logWithLegacyProps = log as SleepLog & { wakeup?: string; additionalInfo?: string };
    let newLog: SleepLog = { ...log };

    if (logWithLegacyProps.wakeup && !newLog.wakeup) {
      newLog.wakeup = logWithLegacyProps.wakeup;
    }

    if (logWithLegacyProps.additionalInfo !== undefined && newLog.morningNotes === undefined && newLog.eveningNotes === undefined) {
      const [morning, evening] = logWithLegacyProps.additionalInfo.split('|');
      newLog.morningNotes = morning || undefined;
      newLog.eveningNotes = evening || undefined;
    }
    return newLog;
  });

  if (logs.length === 0) {
    return (
      <div>
        <CardHeader className="px-0">
          <CardTitle as='h2' className="text-center text-2xl font-semibold">Sleep History</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="text-center text-muted-foreground py-8">
            <p>No sleep logs yet.</p>
            <p>Your logged sleep will appear here.</p>
          </div>
        </CardContent>
      </div>
    );
  }

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'pm' : 'am';
    const formattedHour = h % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const defaultValues = defaultOpenId ? [defaultOpenId] : (sortedLogs.length > 0 ? [sortedLogs[0].id] : []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Record<keyof SleepLog, any>>>({});

  function getEditValue<T>(editValue: T | undefined, originalValue: T | undefined): T | undefined {
    if (editValue === undefined || editValue === null || editValue === '') {
      if (originalValue === undefined || originalValue === null || originalValue === '') {
        return undefined;
      }
      return originalValue;
    }
    return editValue;
  }

  return (
    <div>
      <CardHeader className="px-4">
        <CardTitle as="h2" className="text-center text-2xl font-semibold">Sleep History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-0">
        <Accordion type="multiple" className="w-full" defaultValue={defaultValues}>
          {sortedLogs.map((log, index) => {
            const wakeUpDate = new Date(`${log.date}T00:00:00`);
            const titleDateOptions: Intl.DateTimeFormatOptions = {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            };
            const title = wakeUpDate.toLocaleDateString('en-US', titleDateOptions);

            const previousLog = index < sortedLogs.length - 1 ? sortedLogs[index + 1] : null;

            const today = new Date();
            const todayDateString = today.toISOString().slice(0, 10); // e.g., "2025-08-10"

            const isLogForToday = log.date === todayDateString;

            const hasMorningDetailsRecorded = (log.wakeupMood !== 0 && log.wakeupMood !== undefined && log.wakeupMood !== null) ||
                                             (log.fuzziness !== 0 && log.fuzziness !== undefined && log.fuzziness !== null) ||
                                             (log.morningNotes && log.morningNotes.trim() !== '');

            // A log is "in progress" if it's for today AND morning details are NOT yet recorded
            const isInProgress = isLogForToday && !hasMorningDetailsRecorded;

            // sleepDuration is calculated for display for *completed* logs using the previous night's bedtime
            const sleepDurationForCompleted = previousLog ? calculateDuration(previousLog.bedtime, log.wakeup) : log.sleepDuration;

            // For "in progress" logs, calculate proposed duration using its own bedtime and wakeup (planned times)

            const proposedSleepDuration = (log.bedtime && log.wakeup) ? calculateDuration(log.bedtime, log.wakeup) : '';
            console.log(log)
            console.log(proposedSleepDuration)
            const isEditing = editingId === log.id;

            return (
              <AccordionItem value={log.id} key={log.id} className="border-b-0 neumorphic-flat mb-3 !rounded-lg overflow-hidden">
                <AccordionTrigger className="hover:no-underline p-4">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col text-left">
                      <span className="text-sm text-muted-foreground mb-3">{title}</span>
                      <div className="flex items-start gap-2 text-base text-muted-foreground">
                        <ClockIcon className="h-4 w-4 mt-1 shrink-0" />
                        <div className="flex flex-col items-start">
                          {isInProgress ? (
                            // Exactly matching the new image: "In Progress" followed by "proposed duration: X"
                            <>
                              <span className="font-bold text-foreground">In Progress</span>
                              {proposedSleepDuration && ( // Only show if proposed duration is calculated
                                <span className="text-xs text-muted-foreground">
                                  proposed duration: {proposedSleepDuration}
                                </span>
                              )}
                            </>
                          ) : (
                            // Display actual sleep duration and times for completed logs
                            <>
                              <span className="font-bold text-foreground">
                                {sleepDurationForCompleted} {/* Use the calculated duration for completed logs */}
                              </span>
                              {/* Display bed/woke times for completed logs: */}
                              {/* If there's a previous log (meaning this log represents a full night's sleep) */}
                              {previousLog && (
                                <span className="text-xs text-muted-foreground">
                                  bed: {formatTime(previousLog.bedtime)}, woke at {formatTime(log.wakeup)}
                                </span>
                              )}
                              {/* If it's the very first (oldest) completed log, display its own bedtime/wakeup */}
                              {!previousLog && log.bedtime && log.wakeup && (
                                  <span className="text-xs text-muted-foreground">
                                    bed: {formatTime(log.bedtime)}, woke at {formatTime(log.wakeup)}
                                  </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* MoodIndicator for Wake-up mood, will show '-' if value is 0, null, or undefined */}
                      <MoodIndicator value={log.wakeupMood} />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 p-4 bg-background/50 border-t">
                    {isEditing ? (
                      <form
                        className="space-y-4"
                        onSubmit={e => {
                          e.preventDefault();
                          onEdit({
                            ...log,
                            bedtime: getEditValue(editData.bedtime, log.bedtime) ?? '',
                            wakeup: getEditValue(editData.wakeup, log.wakeup) ?? '',
                            bedtimeMood: getEditValue(
                              editData.bedtimeMood !== undefined && editData.bedtimeMood !== ''
                                ? Number(editData.bedtimeMood)
                                : undefined,
                              log.bedtimeMood
                            ) ?? 0,
                            wakeupMood: getEditValue(
                              editData.wakeupMood !== undefined && editData.wakeupMood !== ''
                                ? Number(editData.wakeupMood)
                                : undefined,
                              log.wakeupMood
                            ) ?? 0,
                            fuzziness: getEditValue(
                              editData.fuzziness !== undefined && editData.fuzziness !== ''
                                ? Number(editData.fuzziness)
                                : undefined,
                              log.fuzziness
                            ) ?? 0,
                            wokeUpDuringDream: getEditValue(
                              editData.wokeUpDuringDream !== undefined
                                ? (editData.wokeUpDuringDream === 'true' || editData.wokeUpDuringDream === true)
                                : undefined,
                              log.wokeUpDuringDream
                            ) ?? false,
                            morningNotes: getEditValue(editData.morningNotes, log.morningNotes),
                            eveningNotes: getEditValue(editData.eveningNotes, log.eveningNotes),
                          });
                          setEditingId(null);
                          setEditData({});
                        }}
                      >
                        <div>
                          <label className="block text-sm mb-1">Bedtime</label>
                          <input
                            type="time"
                            value={editData.bedtime ?? log.bedtime ?? ''}
                            onChange={e => setEditData(d => ({ ...d, bedtime: e.target.value }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Wake-up Time</label>
                          <input
                            type="time"
                            value={editData.wakeup ?? log.wakeup ?? ''}
                            onChange={e => setEditData(d => ({ ...d, wakeup: e.target.value }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Daytime Mood</label>
                          <input
                            type="number"
                            min={0}
                            max={5}
                            value={editData.bedtimeMood ?? log.bedtimeMood ?? ''}
                            onChange={e => setEditData(d => ({ ...d, bedtimeMood: e.target.value }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Wake-up Mood</label>
                          <input
                            type="number"
                            min={0}
                            max={5}
                            value={editData.wakeupMood ?? log.wakeupMood ?? ''}
                            onChange={e => setEditData(d => ({ ...d, wakeupMood: e.target.value }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Fuzziness</label>
                          <input
                            type="number"
                            min={0}
                            max={5}
                            value={editData.fuzziness ?? log.fuzziness ?? ''}
                            onChange={e => setEditData(d => ({ ...d, fuzziness: e.target.value }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Woke Up During Dream</label>
                          <select
                            value={String(editData.wokeUpDuringDream ?? log.wokeUpDuringDream ?? 'false')}
                            onChange={e => setEditData(d => ({ ...d, wokeUpDuringDream: e.target.value === 'true' }))}
                            className="input input-bordered w-full"
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Morning Notes</label>
                          <textarea
                            value={editData.morningNotes ?? log.morningNotes ?? ''}
                            onChange={e => setEditData(d => ({ ...d, morningNotes: e.target.value }))}
                            className="input input-bordered w-full"
                            placeholder="Notes from the morning"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Evening Notes</label>
                          <textarea
                            value={editData.eveningNotes ?? log.eveningNotes ?? ''}
                            onChange={e => setEditData(d => ({ ...d, eveningNotes: e.target.value }))}
                            className="input input-bordered w-full"
                            placeholder="Notes from the evening"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" variant="default">Save</Button>
                          <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setEditData({}); }}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                            <BellIcon className="h-4 w-4" />
                            <span>Morning</span>
                          </h4>
                          <div className="pl-6 space-y-2 text-base border-l-2 border-primary/20">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-24">Woke:</span>
                              <span className="font-semibold">{formatTime(log.wakeup)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-24">Wake-up mood:</span>
                              <span className="font-semibold">{log.wakeupMood > 0 ? `${log.wakeupMood}/5` : '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-24">Fuzziness:</span>
                              <span className="font-semibold">{log.fuzziness > 0 ? `${log.fuzziness}/5` : '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-24">Mid-dream:</span>
                              <span className="font-semibold">
                                {typeof log.wokeUpDuringDream === 'boolean'
                                  ? (log.wokeUpDuringDream ? 'Yes' : 'No')
                                  : <span className="text-foreground/60">-</span>}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground w-24 mt-1">Morning notes:</span>
                              <span className="font-semibold flex-1">
                                {log.morningNotes && log.morningNotes.trim() ? log.morningNotes : <span className="italic text-muted-foreground/60">No notes</span>}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                            <MoonIcon className="h-4 w-4" />
                            <span>Evening</span>
                          </h4>
                          <div className="pl-6 space-y-2 text-base border-l-2 border-primary/20">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-24">Bed:</span>
                              <span className="font-semibold">{formatTime(log.bedtime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-24">Daytime mood:</span>
                              <span className="font-semibold">{log.bedtimeMood > 0 ? `${log.bedtimeMood}/5` : '-'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground w-24 mt-1">Evening notes:</span>
                              <span className="font-semibold flex-1">
                                {log.eveningNotes && log.eveningNotes.trim() ? log.eveningNotes : <span className="italic text-muted-foreground/60">No notes</span>}
                              </span>
                            </div>
                          </div>
                        </div>
                        <CardFooter className="p-0 pt-4 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEditingId(log.id);
                              setEditData({});
                            }}
                            className="h-8 w-8 neumorphic-convex active:neumorphic-concave"
                          >
                            <span className="sr-only">Edit</span>
                            <Pencil1Icon className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => onDelete(log.id)} className="h-8 w-8 neumorphic-convex active:neumorphic-concave">
                            <TrashIcon className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </CardFooter>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </div>
  );
};
