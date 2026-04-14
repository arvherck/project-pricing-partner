import React, { useMemo } from 'react';
import { parseISO, format, eachDayOfInterval, isWeekend } from 'date-fns';
import { Plus, Trash2, CalendarDays } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { Resource, SENIORITY_LEVELS, COUNTRIES, SENIORITY_EXPERIENCE, COUNTRY_CURRENCY, CURRENCY_SYMBOLS, COUNTRY_FLAGS } from '@/lib/types';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export default function ResourceManager() {
  const { config, resources, setResources, rateCard, programVacationWeeks } = useProject();

  const startDate = config.startDate ? parseISO(config.startDate) : null;
  const endDate = config.endDate ? parseISO(config.endDate) : null;
  const weeks = startDate && endDate ? getProjectWeeks(startDate, endDate) : [];

  const addResource = () => {
    const newResource: Resource = {
      id: crypto.randomUUID(),
      name: '',
      seniority: 'Consultant',
      country: 'Netherlands',
      allocationPercent: 100,
      vacationDates: [],
    };
    setResources([...resources, newResource]);
  };

  const updateResource = (id: string, updates: Partial<Resource>) => {
    setResources(resources.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Resources</CardTitle>
        <Button onClick={addResource} size="sm"><Plus className="mr-1 h-4 w-4" /> Add Resource</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {resources.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No resources added yet. Click "Add Resource" to begin.</p>
        )}
        {resources.map(resource => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            weeks={weeks}
            rateCard={rateCard}
            startDate={startDate}
            endDate={endDate}
            programVacationWeeks={programVacationWeeks}
            onUpdate={updateResource}
            onRemove={removeResource}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function ResourceCard({
  resource, weeks, rateCard, startDate, endDate, programVacationWeeks, onUpdate, onRemove,
}: {
  resource: Resource;
  weeks: ReturnType<typeof getProjectWeeks>;
  rateCard: any;
  startDate: Date | null;
  endDate: Date | null;
  programVacationWeeks: number[];
  onUpdate: (id: string, u: Partial<Resource>) => void;
  onRemove: (id: string) => void;
}) {
  const calc = useMemo(() => {
    if (!startDate || !endDate) return null;
    return calculateResource(resource, weeks, rateCard, startDate, endDate, programVacationWeeks);
  }, [resource, weeks, rateCard, startDate, endDate, programVacationWeeks]);

  const currency = COUNTRY_CURRENCY[resource.country];
  const symbol = CURRENCY_SYMBOLS[currency];

  // Parse vacation dates for the calendar
  const selectedDates = useMemo(() =>
    (resource.vacationDates ?? []).map(d => parseISO(d)),
    [resource.vacationDates]
  );

  // Compute disabled dates: weekdays in program-level vacation weeks
  const programVacationDates = useMemo(() => {
    if (!startDate || !endDate || weeks.length === 0) return [];
    const programVacSet = new Set(programVacationWeeks);
    const disabled: Date[] = [];
    weeks.forEach(week => {
      if (programVacSet.has(week.index)) {
        const days = eachDayOfInterval({ start: week.startDate, end: week.endDate });
        days.forEach(d => {
          if (!isWeekend(d)) disabled.push(d);
        });
      }
    });
    return disabled;
  }, [weeks, programVacationWeeks, startDate, endDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const iso = format(date, 'yyyy-MM-dd');
    const current = resource.vacationDates ?? [];
    // Filter out any dates that overlap with program vacation weeks
    const updated = current.includes(iso)
      ? current.filter(d => d !== iso)
      : [...current, iso];
    onUpdate(resource.id, { vacationDates: updated });
  };

  // Filter out resource vacation dates that overlap with program vacation weeks
  const cleanVacationDates = useMemo(() => {
    const programSet = new Set(programVacationDates.map(d => format(d, 'yyyy-MM-dd')));
    return (resource.vacationDates ?? []).filter(d => !programSet.has(d));
  }, [resource.vacationDates, programVacationDates]);

  // If there are stale overlapping dates, clean them up
  useMemo(() => {
    if (cleanVacationDates.length !== (resource.vacationDates ?? []).length) {
      onUpdate(resource.id, { vacationDates: cleanVacationDates });
    }
  }, [cleanVacationDates]);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid gap-3 flex-1 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs">Name / Role</Label>
            <Input value={resource.name} onChange={e => onUpdate(resource.id, { name: e.target.value })} placeholder="e.g. Project Manager" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Seniority</Label>
            <Select value={resource.seniority} onValueChange={v => onUpdate(resource.id, { seniority: v as any })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SENIORITY_LEVELS.map(s => (
                  <SelectItem key={s} value={s}>
                    <span>{s}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({SENIORITY_EXPERIENCE[s]})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Country</Label>
            <Select value={resource.country} onValueChange={v => onUpdate(resource.id, { country: v as any })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => (
                  <SelectItem key={c} value={c}>
                    <span className="mr-2">{COUNTRY_FLAGS[c]}</span>{c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Allocation: {resource.allocationPercent}%</Label>
            <Slider value={[resource.allocationPercent]} onValueChange={v => onUpdate(resource.id, { allocationPercent: v[0] })} min={0} max={100} step={5} className="mt-2" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Vacation Days</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full h-9 justify-start text-xs">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  {cleanVacationDates.length > 0
                    ? `${cleanVacationDates.length} day(s)`
                    : 'Select dates'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {startDate && endDate ? (
                  <div>
                    <Calendar
                      mode="multiple"
                      selected={selectedDates}
                      onDayClick={handleDateSelect}
                      defaultMonth={startDate}
                      fromDate={startDate}
                      toDate={endDate}
                      disabled={programVacationDates}
                      className={cn("p-3 pointer-events-auto")}
                    />
                    {programVacationDates.length > 0 && (
                      <p className="text-xs text-muted-foreground px-3 pb-3">
                        Greyed-out dates are program-level vacation weeks.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground p-4">Set project dates first</p>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="ml-2 text-destructive shrink-0" onClick={() => onRemove(resource.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {calc && (
        <div className="flex gap-4 text-sm">
          <Badge variant="secondary">{calc.totalWorkingDays.toFixed(1)} days ({calc.totalWorkingHours.toFixed(0)} hrs)</Badge>
          <Badge variant="secondary">{symbol}{calc.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Badge>
          <Badge variant="outline">{symbol}{rateCard[resource.seniority]?.[resource.country] ?? 0}/hr</Badge>
        </div>
      )}
    </div>
  );
}
