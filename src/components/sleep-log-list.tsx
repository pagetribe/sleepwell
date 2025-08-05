
'use client';

import type { FC } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { SleepLog } from '@/lib/types';
import { MOOD_OPTIONS } from '@/lib/types';
import { Clock, Bed, Sunrise, Trash2, Brain, Moon, Cloudy, Info } from 'lucide-react';

interface SleepLogListProps {
  logs: SleepLog[];
  onDelete: (id: string) => void;
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

export const SleepLogList: FC<SleepLogListProps> = ({ logs, onDelete, defaultOpenId = null }) => {
  if (logs.length === 0) {
    return (
      <div>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">Sleep History</CardTitle>
        </CardHeader>
        <CardContent>
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
  }

  const defaultValues = defaultOpenId ? [defaultOpenId] : (logs.length > 0 ? [logs[0].id] : []);

  return (
    <div>
      <CardHeader>
        <CardTitle className="text-center text-2xl font-semibold">Sleep History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" className="w-full" defaultValue={defaultValues}>
          {logs.map((log) => (
            <AccordionItem value={log.id} key={log.id} className="border-b-0 neumorphic-flat mb-3 !rounded-lg overflow-hidden">
              <AccordionTrigger className="hover:no-underline p-4">
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-base">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />
                      {log.sleepDuration === 'In Progress' ? (
                        <span className="text-yellow-500">In Progress...</span>
                      ) : (
                        log.sleepDuration
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MoodIndicator value={log.wakeupMood} />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-4 bg-background/50 border-t">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2"><Bed className="h-4 w-4 text-primary" /> <span>Bedtime: {formatTime(log.bedtime)}</span></div>
                      <div className="flex items-center gap-2"><Sunrise className="h-4 w-4 text-primary" /> <span>Wake-up: {formatTime(log.wakeupTime)}</span></div>
                      <div className="flex items-center gap-2"><Moon className="h-4 w-4 text-primary" /> <span>Bedtime Mood: <MoodIndicator value={log.bedtimeMood} /></span></div>
                      <div className="flex items-center gap-2"><Sunrise className="h-4 w-4 text-primary" /> <span>Wake-up Mood: <MoodIndicator value={log.wakeupMood} /></span></div>
                      <div className="flex items-center gap-2"><Cloudy className="h-4 w-4 text-primary" /> <span>Fuzziness: {log.fuzziness > 0 ? `${log.fuzziness}/5` : '-'}</span></div>
                      {log.wokeUpDuringDream && <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> <span>Woke up mid-dream</span></div>}
                   </div>
                   {log.additionalInfo && (
                     <div className="neumorphic-inset p-3">
                       <h4 className="font-semibold mb-2 flex items-center"><Info className="mr-2 h-4 w-4" />Notes:</h4>
                       <p className="text-sm text-muted-foreground">{log.additionalInfo}</p>
                     </div>
                   )}
                   <CardFooter className="p-0 pt-4 flex justify-end">
                     <Button variant="destructive" size="icon" onClick={() => onDelete(log.id)} className="h-8 w-8 neumorphic-convex active:neumorphic-concave">
                       <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Delete</span>
                     </Button>
                   </CardFooter>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </div>
  );
};
