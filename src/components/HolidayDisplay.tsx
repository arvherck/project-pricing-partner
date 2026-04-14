import React, { useMemo } from 'react';
import { parseISO, format } from 'date-fns';
import { useProject } from '@/context/ProjectContext';
import { COUNTRY_FLAGS, Country } from '@/lib/types';
import { getNamedHolidaysInRange, NamedHoliday } from '@/lib/holidays';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export default function HolidayDisplay() {
  const { config, resources } = useProject();

  const startDate = config.startDate ? parseISO(config.startDate) : null;
  const endDate = config.endDate ? parseISO(config.endDate) : null;

  const usedCountries = useMemo(() => {
    const set = new Set<Country>();
    resources.forEach(r => set.add(r.country));
    return Array.from(set);
  }, [resources]);

  const holidaysByCountry = useMemo(() => {
    if (!startDate || !endDate) return {};
    const map: Record<string, NamedHoliday[]> = {};
    usedCountries.forEach(c => {
      map[c] = getNamedHolidaysInRange(c, startDate, endDate);
    });
    return map;
  }, [usedCountries, startDate, endDate]);

  if (usedCountries.length === 0 || !startDate || !endDate) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Holidays (excluded from billing)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {usedCountries.map(country => {
          const holidays = holidaysByCountry[country] || [];
          return (
            <Collapsible key={country}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left text-sm font-medium hover:bg-accent rounded px-2 py-1.5">
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                <span>{COUNTRY_FLAGS[country]} {country}</span>
                <span className="text-xs text-muted-foreground ml-auto">{holidays.length} holidays</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-8 pr-2 pb-2">
                {holidays.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No public holidays in this period</p>
                ) : (
                  <div className="grid gap-1">
                    {holidays.map((h, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{h.name}</span>
                        <span className="text-muted-foreground">{format(h.date, 'dd MMM yyyy')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
