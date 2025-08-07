
'use client';

import { type FC, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bed, Sunrise, Save, Moon, Cloudy, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { SleepLog } from '@/lib/types';
import { MOOD_OPTIONS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SleepLogFormProps {
  onSave: (data: Partial<SleepLog>) => void;
  existingLog?: SleepLog;
  flow: 'evening' | 'morning' | null;
}

const formSchema = z.object({
  id: z.string().optional(),
  bedtime: z.string().optional(),
  wakeupTime: z.string().optional(),
  bedtimeMood: z.string().optional(),
  additionalInfo: z.string().optional(),
  wakeupMood: z.string().optional(),
  fuzziness: z.number().optional(),
  wokeUpDuringDream: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const SleepLogForm: FC<SleepLogFormProps> = ({ onSave, existingLog, flow }) => {
  const fuzzinessLevels = Array.from({ length: 5 }, (_, i) => i + 1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      bedtime: '',
      bedtimeMood: '3',
      additionalInfo: '',
      wakeupTime: '06:30',
      wakeupMood: '3',
      fuzziness: 3,
      wokeUpDuringDream: false,
    },
  });

  useEffect(() => {
    if (flow === 'morning' && existingLog) {
      form.reset({
        id: existingLog.id,
        bedtime: existingLog.bedtime,
        wakeupTime: existingLog.wakeupTime || '06:30',
        bedtimeMood: String(existingLog.bedtimeMood),
        additionalInfo: existingLog.additionalInfo,
        wakeupMood: String(existingLog.wakeupMood || 3),
        fuzziness: existingLog.fuzziness || 3,
        wokeUpDuringDream: existingLog.wokeUpDuringDream || false,
      });
    } else if (flow === 'evening') {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      form.reset({
        id: undefined,
        bedtime: `${hours}:${minutes}`,
        wakeupTime: '06:30',
        bedtimeMood: '3',
        additionalInfo: '',
        wakeupMood: '3',
        fuzziness: 3,
        wokeUpDuringDream: false,
      });
    }
  }, [flow, existingLog, form]);


  function onSubmit(data: FormValues) {
    onSave({
      ...data,
      id: existingLog?.id,
      bedtimeMood: parseInt(data.bedtimeMood || '0', 10),
      wakeupMood: parseInt(data.wakeupMood || '0', 10),
    });
  }
  
  if (!flow) {
    return (
      <div className="space-y-8">
        <div className="h-96" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {flow === 'evening' && (
          <>
            <FormField
              control={form.control}
              name="bedtime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-foreground/80"><Bed className="mr-2 h-4 w-4" />Bedtime</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} className="neumorphic-inset text-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wakeupTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-foreground/80"><Sunrise className="mr-2 h-4 w-4" />Wake-up Time (planned)</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} className="neumorphic-inset text-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bedtimeMood"
              render={({ field }) => (
                <FormItem className="space-y-3 pt-6">
                  <FormLabel className="flex items-center text-foreground/80"><Moon className="mr-2 h-4 w-4" />End of Day Mood</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={String(field.value)}
                      className="flex justify-between"
                    >
                      {MOOD_OPTIONS.map((option) => (
                        <FormItem key={option.value} className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={String(option.value)} id={`bedtime-mood-${option.value}`} className="sr-only" />
                          </FormControl>
                          <FormLabel
                            htmlFor={`bedtime-mood-${option.value}`}
                            className={cn(
                              'text-2xl sm:text-3xl cursor-pointer p-2 rounded-full transition-all duration-200 neumorphic-flat',
                              String(field.value) === String(option.value)
                                ? 'neumorphic-inset scale-110'
                                : 'opacity-60 hover:opacity-100'
                            )}
                          >
                            {option.label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-foreground/80"><Info className="mr-2 h-4 w-4" />Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any other notes about your sleep..." {...field} className="neumorphic-inset"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {flow === 'morning' && (
          <>
            <FormField
              control={form.control}
              name="wakeupTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-foreground/80"><Sunrise className="mr-2 h-4 w-4" />Wake-up Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} className="neumorphic-inset"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wakeupMood"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center text-foreground/80"><Sunrise className="mr-2 h-4 w-4" />Wake-up Mood</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={String(field.value)}
                      className="flex justify-between"
                    >
                      {MOOD_OPTIONS.map((option) => (
                         <FormItem key={option.value} className="flex items-center space-x-2 space-y-0">
                         <FormControl>
                           <RadioGroupItem value={String(option.value)} id={`wakeup-mood-${option.value}`} className="sr-only" />
                         </FormControl>
                         <FormLabel
                            htmlFor={`wakeup-mood-${option.value}`}
                            className={cn(
                              'text-2xl sm:text-3xl cursor-pointer p-2 rounded-full transition-all duration-200 neumorphic-flat',
                              String(field.value) === String(option.value)
                                ? 'neumorphic-inset scale-110'
                                : 'opacity-60 hover:opacity-100'
                            )}
                          >
                           {option.label}
                         </FormLabel>
                       </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fuzziness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-foreground/80"><Cloudy className="mr-2 h-4 w-4" />Mental Fuzziness</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                      value={String(field.value)}
                      className="flex flex-wrap justify-center gap-2 pt-2"
                    >
                      {fuzzinessLevels.map((level) => (
                        <FormItem key={level} className="flex items-center space-x-0">
                          <FormControl>
                            <RadioGroupItem value={String(level)} id={`fuzziness-${level}`} className="sr-only" />
                          </FormControl>
                          <FormLabel
                            htmlFor={`fuzziness-${level}`}
                             className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-all neumorphic-flat',
                              field.value === level
                                ? 'neumorphic-inset'
                                : 'opacity-60 hover:opacity-100'
                            )}
                          >
                            {level}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wokeUpDuringDream"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between neumorphic-flat p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-foreground/80">Woke up mid-dream?</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" className="w-full neumorphic-convex active:neumorphic-concave">
          <Save className="mr-2 h-4 w-4" /> Save Log
        </Button>
      </form>
    </Form>
  );
};
