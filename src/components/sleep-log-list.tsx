'use client';

import React, { type FC, useState, useEffect } from 'react';
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

interface SleepLogListProps {
  logs: SleepLog[];
  onDelete: (id: string) => void;
  onEdit: (log: SleepLog) => void;
  defaultOpenId?: string | null;
}

// Define a type for the daily summary we want to display
interface DailySleepSummary {
  displayDate: string; // YYYY-MM-DD for the card's main date
  // The ID of the primary log for this day.
  // If it's a complete sleep cycle ending on this day, it's that log's ID.
  // If it's an incomplete evening log starting on this day, it's that log's ID.
  // This is used for accordion value and editing/deleting.
  logId: string; // Needs to be string for Accordion value, not optional

  morningDetails: {
    wakeup?: string;
    wakeupMood?: number;
    fuzziness?: number;
    wokeUpDuringDream?: boolean | null;
    morningNotes?: string;
    sleepDuration?: string; // Actual duration for the sleep ending on this day
    bedtimeForThisSleep?: string; // Bedtime from the log that ended this morning
    originalLogId: string; // ID of the original SleepLog object that provides these morning details
  } | null;

  eveningDetails: {
    bedtime?: string;
    bedtimeMood?: number;
    eveningNotes?: string;
    isInProgress?: boolean; // Is this an incomplete log that started this evening?
    proposedDuration?: string; // Proposed duration for the log that started this evening
    originalLogId: string; // ID of the original SleepLog object that provides these evening details
  } | null;
}

// Helper function to get YYYY-MM-DD from a Date object without timezone conversion issues.
// Using .toISOString().slice(0, 10) can result in the wrong date for timezones ahead of UTC.
const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MoodIndicator: FC<{ value: number }> = ({ value }) => {
  if (value === 0 || value === undefined || value === null) {
    return <span className="text-foreground/60">-</span>;
  }
  const mood = MOOD_OPTIONS.find(m => m.value === value);
  if (!mood) return <span className="text-foreground/60">-</span>;
  return <span className="text-3xl" title={mood.description}>{mood.label}</span>;
};

export const SleepLogList: FC<SleepLogListProps> = ({ logs: rawLogs, onDelete, onEdit, defaultOpenId = null }) => {
  // Normalize logs (keep this part as it cleans up potential old data structures)
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

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'pm' : 'am';
    const formattedHour = h % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  const dailySummariesMap = new Map<string, DailySleepSummary>();

logs.forEach(log => {
  const isCompletedSleepLog = (log.wakeupMood !== 0 && log.wakeupMood !== undefined && log.wakeupMood !== null);

  if (isCompletedSleepLog) {
    const wakeUpDate = new Date(`${log.date}T00:00:00`);
    const wakeUpDateKey = toYYYYMMDD(wakeUpDate);

    if (!dailySummariesMap.has(wakeUpDateKey)) {
      dailySummariesMap.set(wakeUpDateKey, {
        displayDate: wakeUpDateKey,
        logId: log.id,
        morningDetails: null,
        eveningDetails: null,
      });
    }
    const currentDaySummary = dailySummariesMap.get(wakeUpDateKey)!;
    currentDaySummary.morningDetails = {
      wakeup: log.wakeup,
      wakeupMood: log.wakeupMood,
      fuzziness: log.fuzziness,
      wokeUpDuringDream: log.wokeUpDuringDream,
      morningNotes: log.morningNotes,
      sleepDuration: log.sleepDuration,
      bedtimeForThisSleep: log.bedtime,
      originalLogId: log.id,
    };
    currentDaySummary.logId = log.id;

    const bedtimeDate = new Date(`${log.date}T00:00:00`);
    const [bedHours, bedMinutes] = log.bedtime.split(':').map(Number);
    const [wakeHours, wakeMinutes] = log.wakeup.split(':').map(Number);

    const fullBedtime = new Date(bedtimeDate.getFullYear(), bedtimeDate.getMonth(), bedtimeDate.getDate(), bedHours, bedMinutes);
    const fullWakeup = new Date(bedtimeDate.getFullYear(), bedtimeDate.getMonth(), bedtimeDate.getDate(), wakeHours, wakeMinutes);

    if (fullWakeup.getTime() < fullBedtime.getTime()) {
      bedtimeDate.setDate(bedtimeDate.getDate() - 1);
    }
    const bedtimeDateKey = toYYYYMMDD(bedtimeDate);

    if (!dailySummariesMap.has(bedtimeDateKey)) {
      dailySummariesMap.set(bedtimeDateKey, {
        displayDate: bedtimeDateKey,
        logId: log.id,
        morningDetails: null,
        eveningDetails: null,
      });
    }
    const previousDaySummary = dailySummariesMap.get(bedtimeDateKey)!;
    previousDaySummary.eveningDetails = {
      bedtime: log.bedtime,
      bedtimeMood: log.bedtimeMood,
      eveningNotes: log.eveningNotes,
      isInProgress: false,
      proposedDuration: undefined,
      originalLogId: log.id,
    };

    if (!previousDaySummary.morningDetails) {
      previousDaySummary.logId = log.id;
    }
  } else {
    const bedtimeDate = new Date(`${log.date}T00:00:00`);
    const bedtimeDateKey = toYYYYMMDD(bedtimeDate);

    if (!dailySummariesMap.has(bedtimeDateKey)) {
      dailySummariesMap.set(bedtimeDateKey, {
        displayDate: bedtimeDateKey,
        logId: log.id,
        morningDetails: null,
        eveningDetails: null,
      });
    }
    const currentDaySummaryForEvening = dailySummariesMap.get(bedtimeDateKey)!;
    currentDaySummaryForEvening.eveningDetails = {
      bedtime: log.bedtime,
      bedtimeMood: log.bedtimeMood,
      eveningNotes: log.eveningNotes,
      isInProgress: true,
      proposedDuration: (log.bedtime && log.wakeup) ? calculateDuration(log.bedtime, log.wakeup) : undefined,
      originalLogId: log.id,
    };
    currentDaySummaryForEvening.logId = log.id;
  }
});


  // Filter out any summaries that ended up with no morning OR evening details (shouldn't happen with current logic but as a safeguard)
  const filteredDailySummaries = Array.from(dailySummariesMap.values()).filter(summary =>
    summary.morningDetails || summary.eveningDetails
  );

  // Sort daily summaries by displayDate from newest to oldest
  const sortedDailySummaries = filteredDailySummaries.sort((a, b) =>
    new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime()
  );

  // Handle Accordion default open state
  const initialOpenItems = defaultOpenId ? [defaultOpenId] : (sortedDailySummaries.length > 0 ? [sortedDailySummaries[0].logId] : []);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>(initialOpenItems);

  // Ensure defaultOpenId is opened if it changes or wasn't initially present
  useEffect(() => {
    if (defaultOpenId && !openAccordionItems.includes(defaultOpenId)) {
      setOpenAccordionItems(prev => [...prev, defaultOpenId]);
    }
  }, [defaultOpenId, openAccordionItems]);


  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Record<keyof SleepLog, any>>>({});

  // Helper to safely get edit value, falling back to original if edit is empty
  function getEditValue<T>(editValue: T | undefined, originalValue: T | undefined): T | undefined {
    if (editValue === undefined || editValue === null || editValue === '') {
      if (originalValue === undefined || originalValue === null || originalValue === '') {
        return undefined;
      }
      return originalValue;
    }
    return editValue;
  }

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

  return (
    <div>
      <CardHeader className="px-4">
        <CardTitle as="h2" className="text-center text-2xl font-semibold">Sleep History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-0">
        <Accordion type="multiple" className="w-full" value={openAccordionItems} onValueChange={setOpenAccordionItems}>
          {sortedDailySummaries.map((dailySummary) => {
            // Convert ISO date string to readable date for the card title
            const displayDateObj = new Date(dailySummary.displayDate);
            const titleDateOptions: Intl.DateTimeFormatOptions = {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              timeZone: 'Australia/Sydney',
            };
            const title = displayDateObj.toLocaleDateString('en-AU', titleDateOptions);

            const sectionDateOptions: Intl.DateTimeFormatOptions = {
              month: 'long',
              day: 'numeric',
              timeZone: 'Australia/Sydney',
            };
            const morningSectionDateString = displayDateObj.toLocaleDateString('en-AU', sectionDateOptions);
            const eveningSectionDateString = displayDateObj.toLocaleDateString('en-AU', sectionDateOptions); // Evening is on the same displayDate

            // Determine which original log to use for editing/deleting based on the primary logId for this summary
            // This is crucial because a dailySummary might combine parts of two different actual SleepLog objects
            const originalLogForActions = logs.find(l => l.id === dailySummary.logId);

            if (!originalLogForActions) return null; // Should not happen if dailySummary.logId is correctly set

            const isEditing = editingId === originalLogForActions.id;

            return (
              // Use the logId of the primary log for this summary as the AccordionItem value
              <AccordionItem value={originalLogForActions.id} key={originalLogForActions.id} className="border-b-0 neumorphic-flat mb-3 !rounded-lg overflow-hidden">
                <AccordionTrigger className="hover:no-underline p-4">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col text-left">
                      <span className="text-sm text-muted-foreground mb-3">{title}</span> {/* Main date of the card */}
                      <div className="flex items-start gap-2 text-base text-muted-foreground">
                        <ClockIcon className="h-4 w-4 mt-1 shrink-0" />
                        <div className="flex flex-col items-start">
                          {dailySummary.eveningDetails?.isInProgress && !dailySummary.morningDetails ? (
                            // Only Evening data for this day (it's an in-progress log starting on this day)
                            <>
                              <span className="font-bold text-foreground">In Progress</span>
                              {dailySummary.eveningDetails.proposedDuration && (
                                <span className="text-xs text-muted-foreground">
                                  proposed duration: {dailySummary.eveningDetails.proposedDuration}
                                </span>
                              )}
                            </>
                          ) : (
                            // Completed sleep or a day with morning data but no current evening data
                            <>
                              <span className="font-bold text-foreground">
                                {dailySummary.morningDetails?.sleepDuration || 'N/A'} {/* Use actual duration from morning details */}
                              </span>
                              {dailySummary.morningDetails?.bedtimeForThisSleep && dailySummary.morningDetails?.wakeup && (
                                <span className="text-xs text-muted-foreground">
                                  bed: {formatTime(dailySummary.morningDetails.bedtimeForThisSleep)}, woke at {formatTime(dailySummary.morningDetails.wakeup)}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MoodIndicator value={dailySummary.morningDetails?.wakeupMood ?? 0} /> {/* Display morning mood for the card */}
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
                          // When editing, we're editing the original log that generated this daily summary's primary ID
                          onEdit({
                            ...originalLogForActions, // Use the original log found earlier
                            bedtime: getEditValue(editData.bedtime, originalLogForActions.bedtime) ?? '',
                            wakeup: getEditValue(editData.wakeup, originalLogForActions.wakeup) ?? '',
                            bedtimeMood: editData.bedtimeMood === '' ? 0 : 
                              (editData.bedtimeMood !== undefined ? Number(editData.bedtimeMood) : originalLogForActions.bedtimeMood) ?? 0,
                            wakeupMood: editData.wakeupMood === '' ? 0 : 
                              (editData.wakeupMood !== undefined ? Number(editData.wakeupMood) : originalLogForActions.wakeupMood) ?? 0,
                            fuzziness: editData.fuzziness === '' ? 0 : 
                              (editData.fuzziness !== undefined ? Number(editData.fuzziness) : originalLogForActions.fuzziness) ?? 0,
                            wokeUpDuringDream: getEditValue(
                              editData.wokeUpDuringDream !== undefined
                                ? (editData.wokeUpDuringDream === 'true' || editData.wokeUpDuringDream === true)
                                : undefined,
                              originalLogForActions.wokeUpDuringDream
                            ) ?? false,
                            morningNotes: getEditValue(editData.morningNotes, originalLogForActions.morningNotes),
                            eveningNotes: getEditValue(editData.eveningNotes, originalLogForActions.eveningNotes),
                          });
                          setEditingId(null);
                          setEditData({});
                        }}
                      >
                        {/* Edit form fields - populate with originalLogForActions data */}
                        <div>
                          <label className="block text-sm mb-1">Bedtime</label>
                          <input
                            type="time"
                            value={getEditValue(editData.bedtime, originalLogForActions.bedtime) ?? ''}
                            onChange={e => setEditData(d => ({ ...d, bedtime: e.target.value }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Wake-up Time</label>
                          <input
                            type="time"
                            value={getEditValue(editData.wakeup, originalLogForActions.wakeup) ?? ''}
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
                            value={editData.bedtimeMood !== undefined ? editData.bedtimeMood : (originalLogForActions.bedtimeMood ?? '')}
                            onChange={e => setEditData(d => ({ ...d, bedtimeMood: e.target.value === '' ? '' : Number(e.target.value) }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Wake-up Mood</label>
                          <input
                            type="number"
                            min={0}
                            max={5}
                            value={editData.wakeupMood !== undefined ? editData.wakeupMood : (originalLogForActions.wakeupMood ?? '')}
                            onChange={e => setEditData(d => ({ ...d, wakeupMood: e.target.value === '' ? '' : Number(e.target.value) }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Fuzziness</label>
                          <input
                            type="number"
                            min={0}
                            max={5}
                            value={editData.fuzziness !== undefined ? editData.fuzziness : (originalLogForActions.fuzziness ?? '')}
                            onChange={e => setEditData(d => ({ ...d, fuzziness: e.target.value === '' ? '' : Number(e.target.value) }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Woke Up During Dream</label>
                          <select
                            value={String(getEditValue(editData.wokeUpDuringDream, originalLogForActions.wokeUpDuringDream) ?? 'false')}
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
                            value={getEditValue(editData.morningNotes, originalLogForActions.morningNotes) ?? ''}
                            onChange={e => setEditData(d => ({ ...d, morningNotes: e.target.value }))}
                            className="input input-bordered w-full"
                            placeholder="Notes from the morning"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Evening Notes</label>
                          <textarea
                            value={getEditValue(editData.eveningNotes, originalLogForActions.eveningNotes) ?? ''}
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
                            <span>Morning ({morningSectionDateString})</span>
                          </h4>
                          <div className="pl-6 space-y-2 text-base border-l-2 border-primary/20">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-24">Woke:</span>
                              <span className="font-semibold">
                                {dailySummary.morningDetails?.wakeup ? formatTime(dailySummary.morningDetails.wakeup) : <span className="text-foreground/60">-</span>}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-24">Wake-up mood:</span>
                              <span className="font-semibold">
                                {dailySummary.morningDetails?.wakeupMood && dailySummary.morningDetails.wakeupMood > 0 ? `${dailySummary.morningDetails.wakeupMood}/5` : '-'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-24">Fuzziness:</span>
                              <span className="font-semibold">
                                {dailySummary.morningDetails?.fuzziness && dailySummary.morningDetails.fuzziness > 0 ? `${dailySummary.morningDetails.fuzziness}/5` : '-'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-24">Mid-dream:</span>
                              <span className="font-semibold">
                                {typeof dailySummary.morningDetails?.wokeUpDuringDream === 'boolean'
                                  ? (dailySummary.morningDetails.wokeUpDuringDream ? 'Yes' : 'No')
                                  : <span className="text-foreground/60">-</span>}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground w-24 mt-1">Morning notes:</span>
                              <span className="font-semibold flex-1">
                                {dailySummary.morningDetails?.morningNotes && dailySummary.morningDetails.morningNotes.trim() ? dailySummary.morningDetails.morningNotes : <span className="italic text-muted-foreground/60">No notes</span>}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                            <MoonIcon className="h-4 w-4" />
                            <span>Evening ({eveningSectionDateString})</span>
                          </h4>
                          <div className="pl-6 space-y-2 text-base border-l-2 border-primary/20">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-24">Bed:</span>
                              <span className="font-semibold">
                                {dailySummary.eveningDetails?.bedtime ? formatTime(dailySummary.eveningDetails.bedtime) : <span className="text-foreground/60">-</span>}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-24">Daytime mood:</span>
                              <span className="font-semibold">
                                {dailySummary.eveningDetails?.bedtimeMood && dailySummary.eveningDetails.bedtimeMood > 0 ? `${dailySummary.eveningDetails.bedtimeMood}/5` : '-'}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground w-24 mt-1">Evening notes:</span>
                              <span className="font-semibold flex-1">
                                {dailySummary.eveningDetails?.eveningNotes && dailySummary.eveningDetails.eveningNotes.trim() ? dailySummary.eveningDetails.eveningNotes : <span className="italic text-muted-foreground/60">No notes</span>}
                              </span>
                            </div>
                          </div>
                        </div>
                        <CardFooter className="p-0 pt-4 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              // When editing, pass the original log associated with this card
                              setEditingId(originalLogForActions.id);
                              setEditData({
                                bedtime: originalLogForActions.bedtime,
                                wakeup: originalLogForActions.wakeup,
                                bedtimeMood: originalLogForActions.bedtimeMood,
                                wakeupMood: originalLogForActions.wakeupMood,
                                fuzziness: originalLogForActions.fuzziness,
                                wokeUpDuringDream: originalLogForActions.wokeUpDuringDream,
                                morningNotes: originalLogForActions.morningNotes,
                                eveningNotes: originalLogForActions.eveningNotes,
                              });
                            }}
                            className="h-8 w-8 neumorphic-convex active:neumorphic-concave"
                          >
                            <span className="sr-only">Edit</span>
                            <Pencil1Icon className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => onDelete(originalLogForActions.id)} className="h-8 w-8 neumorphic-convex active:neumorphic-concave">
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
