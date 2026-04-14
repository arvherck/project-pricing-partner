import React from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { getTotalWeeks, getProjectWeeks } from '@/lib/calculations';
import { cn } from '@/lib/utils';

export default function ProjectSetup() {
  const { config, setConfig, programVacationWeeks, setProgramVacationWeeks } = useProject();

  const startDate = config.startDate ? parseISO(config.startDate) : undefined;
  const endDate = config.endDate ? parseISO(config.endDate) : undefined;
  const totalWeeks = startDate && endDate ? getTotalWeeks(startDate, endDate) : 0;
  const weeks = startDate && endDate ? getProjectWeeks(startDate, endDate) : [];

  const toggleProgramVacation = (weekIndex: number) => {
    setProgramVacationWeeks(
      programVacationWeeks.includes(weekIndex)
        ? programVacationWeeks.filter(w => w !== weekIndex)
        : [...programVacationWeeks, weekIndex]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input
              value={config.name}
              onChange={e => setConfig({ ...config, name: e.target.value })}
              placeholder="e.g. Digital Transformation"
            />
          </div>
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={d => d && setConfig({ ...config, startDate: format(d, 'yyyy-MM-dd') })} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={d => d && setConfig({ ...config, endDate: format(d, 'yyyy-MM-dd') })} disabled={date => startDate ? date < startDate : false} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Total Weeks</Label>
            <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-semibold">
              {totalWeeks > 0 ? `${totalWeeks} weeks` : '—'}
            </div>
          </div>
        </div>

        {weeks.length > 0 && (
          <div className="space-y-2">
            <Label>Program-Level Vacation Weeks (applies to all resources)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto justify-start text-xs">
                  {programVacationWeeks.length > 0 ? `${programVacationWeeks.length} week(s) selected` : 'Select program vacation weeks'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 max-h-60 overflow-y-auto p-2" align="start">
                {weeks.map(w => (
                  <label key={w.index} className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-accent rounded">
                    <Checkbox checked={programVacationWeeks.includes(w.index)} onCheckedChange={() => toggleProgramVacation(w.index)} />
                    {w.label}
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
