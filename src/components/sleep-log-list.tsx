'use client';

import type { FC } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { SleepLog } from '@/lib/types';
import { MOOD_OPTIONS } from '@/lib/types';
import { calculateDuration } from '@/lib/utils';
import { AlarmClock, Bed, Brain, Clock, Cloudy, Info, Moon, Trash2, Pencil } from 'lucide-react';
import { useState } from 'react';

interface SleepLogListProps {
  logs: SleepLog[];
  onDelete: (id: string) => void;
  onEdit: (log: SleepLog) => void; // <-- add this
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

export const SleepLogList: FC<SleepLogListProps> = ({ logs, onDelete, onEdit, defaultOpenId = null }) => {
  if (logs.length === 0) {
    return (
      <div>
        <CardHeader className="px-0">
          <CardTitle className="text-center text-2xl font-semibold">Sleep History</CardTitle>
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

  const defaultValues = defaultOpenId ? [defaultOpenId] : (logs.length > 0 ? [logs[0].id] : []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Record<keyof SleepLog, any>>>({});

  // Helper to get the edited value or fallback to the original, but never default to 0 for unset
  function getEditValue<T>(editValue: T | undefined, originalValue: T): T | undefined {
    if (editValue === undefined || editValue === null || editValue === '') {
      // If originalValue is undefined/null/empty, keep it as undefined
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
        <CardTitle className="text-center text-2xl font-semibold">Sleep History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-0">
        <Accordion type="multiple" className="w-full" defaultValue={defaultValues}>
          {logs.map((log) => {
            // A sleep log is for the night of the day before the log's date.
            // e.g., a log with date "2024-08-07" is for the night of August 6th.
            // We add T00:00:00 to ensure the date is parsed in the local timezone.
            const wakeUpDate = new Date(`${log.date}T00:00:00`);
            const bedTimeDate = new Date(wakeUpDate);
            bedTimeDate.setDate(wakeUpDate.getDate() - 1);

            const titleDateOptions: Intl.DateTimeFormatOptions = {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            };

            const title = `${bedTimeDate.toLocaleDateString('en-US', titleDateOptions)} - ${wakeUpDate.toLocaleDateString('en-US', titleDateOptions)}`;

            const detailDateOptions: Intl.DateTimeFormatOptions = {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            };
            const bedTimeFullDate = bedTimeDate.toLocaleDateString('en-US', detailDateOptions);
            const wakeUpFullDate = wakeUpDate.toLocaleDateString('en-US', detailDateOptions);

            const isEditing = editingId === log.id;

            return (
              <AccordionItem value={log.id} key={log.id} className="border-b-0 neumorphic-flat mb-3 !rounded-lg overflow-hidden">
                <AccordionTrigger className="hover:no-underline p-4">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col text-left">
                      <span className="text-sm text-muted-foreground mb-3">{title}</span>
                      <div className="flex items-start gap-2 text-base text-muted-foreground">
                        <Clock className="h-4 w-4 mt-1 shrink-0" />
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-foreground">
                            {log.sleepDuration === 'In Progress'
                              ? calculateDuration(log.bedtime, log.wakeupTime ?? new Date().toTimeString().slice(0,5))
                              : log.sleepDuration}
                          </span>
                          {log.sleepDuration === 'In Progress' && (
                            <span className="text-xs text-yellow-500">In Progress...</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                            bedtime: getEditValue(editData.bedtime, log.bedtime),
                            wakeupTime: getEditValue(editData.wakeupTime, log.wakeupTime),
                            bedtimeMood: getEditValue(
                              editData.bedtimeMood !== undefined && editData.bedtimeMood !== ''
                                ? Number(editData.bedtimeMood)
                                : undefined,
                              log.bedtimeMood !== undefined && log.bedtimeMood !== null && log.bedtimeMood !== 0
                                ? log.bedtimeMood
                                : undefined
                            ),
                            wakeupMood: getEditValue(
                              editData.wakeupMood !== undefined && editData.wakeupMood !== ''
                                ? Number(editData.wakeupMood)
                                : undefined,
                              log.wakeupMood !== undefined && log.wakeupMood !== null && log.wakeupMood !== 0
                                ? log.wakeupMood
                                : undefined
                            ),
                            fuzziness: getEditValue(
                              editData.fuzziness !== undefined && editData.fuzziness !== ''
                                ? Number(editData.fuzziness)
                                : undefined,
                              log.fuzziness !== undefined && log.fuzziness !== null && log.fuzziness !== 0
                                ? log.fuzziness
                                : undefined
                            ),
                            wokeUpDuringDream: getEditValue(
                              editData.wokeUpDuringDream !== undefined
                                ? (editData.wokeUpDuringDream === 'true' || editData.wokeUpDuringDream === true)
                                : undefined,
                              log.wokeUpDuringDream
                            ),
                            additionalInfo: getEditValue(editData.additionalInfo, log.additionalInfo),
                          });
                          setEditingId(null);
                          setEditData({});
                        }}
                      >
                        <div>
                          <label className="block text-sm mb-1">Bedtime</label>
                          <input
                            type="time"
                            value={editData.bedtime ?? log.bedtime}
                            onChange={e => setEditData(d => ({ ...d, bedtime: e.target.value }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Wake-up Time</label>
                          <input
                            type="time"
                            value={editData.wakeupTime ?? log.wakeupTime}
                            onChange={e => setEditData(d => ({ ...d, wakeupTime: e.target.value }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Bedtime Mood</label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={
                              editData.bedtimeMood !== undefined
                                ? editData.bedtimeMood
                                : (log.bedtimeMood !== undefined && log.bedtimeMood !== null && log.bedtimeMood !== 0
                                    ? String(log.bedtimeMood)
                                    : '')
                            }
                            onChange={e => setEditData(d => ({
                              ...d,
                              bedtimeMood: e.target.value
                            }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Wake-up Mood</label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={
                              editData.wakeupMood !== undefined
                                ? editData.wakeupMood
                                : (log.wakeupMood !== undefined && log.wakeupMood !== null && log.wakeupMood !== 0
                                    ? String(log.wakeupMood)
                                    : '')
                            }
                            onChange={e => setEditData(d => ({
                              ...d,
                              wakeupMood: e.target.value
                            }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Fuzziness</label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={
                              editData.fuzziness !== undefined
                                ? editData.fuzziness
                                : (log.fuzziness !== undefined && log.fuzziness !== null && log.fuzziness !== 0
                                    ? String(log.fuzziness)
                                    : '')
                            }
                            onChange={e => setEditData(d => ({
                              ...d,
                              fuzziness: e.target.value
                            }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Woke Up During Dream</label>
                          <select
                            value={
                              editData.wokeUpDuringDream !== undefined
                                ? String(editData.wokeUpDuringDream)
                                : String(log.wokeUpDuringDream)
                            }
                            onChange={e => setEditData(d => ({ ...d, wokeUpDuringDream: e.target.value === 'true' }))}
                            className="input input-bordered w-full"
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Notes</label>
                          <textarea
                            value={editData.additionalInfo ?? log.additionalInfo ?? ''}
                            onChange={e => setEditData(d => ({ ...d, additionalInfo: e.target.value }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" variant="default">Save</Button>
                          <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setEditData({}); }}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {/* Evening Details */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            <span>Evening - {bedTimeFullDate}</span>
                          </h4>
                          <div className="pl-6 space-y-2 text-base border-l-2 border-primary/20">
                            <div className="flex items-center gap-2">
                              <Bed className="h-4 w-4 text-primary" /> 
                              <span className="text-muted-foreground">Bedtime:</span>
                              <span className="font-semibold">{formatTime(log.bedtime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4 text-primary" /> 
                              <span className="text-muted-foreground">Mood:</span>
                              <span className="font-semibold">{log.bedtimeMood > 0 ? `${log.bedtimeMood}/5` : '-'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Morning Details */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                            <AlarmClock className="h-4 w-4" />
                            <span>Morning - {wakeUpFullDate}</span>
                          </h4>
                          <div className="pl-6 space-y-2 text-base border-l-2 border-primary/20">
                            <div className="flex items-center gap-2">
                              <AlarmClock className="h-4 w-4 text-primary" /> 
                              <span className="text-muted-foreground">Wake-up:</span>
                              <span className="font-semibold">{formatTime(log.wakeupTime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlarmClock className="h-4 w-4 text-primary" /> 
                              <span className="text-muted-foreground">Mood:</span>
                              <span className="font-semibold">{log.wakeupMood > 0 ? `${log.wakeupMood}/5` : '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Cloudy className="h-4 w-4 text-primary" /> 
                              <span className="text-muted-foreground">Fuzziness:</span>
                              <span className="font-semibold">{log.fuzziness > 0 ? `${log.fuzziness}/5` : '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Brain className="h-4 w-4 text-primary" /> 
                              <span className="text-muted-foreground">Mid-dream:</span>
                              <span className="font-semibold">{log.wokeUpDuringDream ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Notes field styled like other fields */}
                        <div className="flex items-center gap-2 mt-2">
                          <Info className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Notes:</span>
                          <span className="font-semibold text-base">
                            {log.additionalInfo && log.additionalInfo.trim() !== ''
                              ? log.additionalInfo
                              : <span className="italic text-muted-foreground/60">No notes</span>}
                          </span>
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
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => onDelete(log.id)} className="h-8 w-8 neumorphic-convex active:neumorphic-concave">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </CardFooter>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>);
          })}
        </Accordion>
      </CardContent>
    </div>
  );
};