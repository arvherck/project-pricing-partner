import React, { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { useProject } from '@/context/ProjectContext';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { COUNTRY_CURRENCY, CURRENCY_SYMBOLS, COUNTRY_FLAGS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function WeeklyBreakdown() {
  const { config, resources, rateCard, programVacationWeeks } = useProject();

  const startDate = config.startDate ? parseISO(config.startDate) : null;
  const endDate = config.endDate ? parseISO(config.endDate) : null;
  const weeks = startDate && endDate ? getProjectWeeks(startDate, endDate) : [];

  const calculations = useMemo(() => {
    if (!startDate || !endDate) return [];
    return resources.map(r => ({
      resource: r,
      calc: calculateResource(r, weeks, rateCard, startDate, endDate, programVacationWeeks),
    }));
  }, [resources, weeks, rateCard, startDate, endDate, programVacationWeeks]);

  if (calculations.length === 0 || weeks.length === 0) return null;

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 min-w-[140px]">Week</TableHead>
                {calculations.map(({ resource }) => {
                  const symbol = CURRENCY_SYMBOLS[COUNTRY_CURRENCY[resource.country]];
                  return (
                    <TableHead key={resource.id} className="text-center min-w-[120px]" colSpan={2}>
                      {COUNTRY_FLAGS[resource.country]} {resource.name || 'Unnamed'} ({symbol})
                    </TableHead>
                  );
                })}
                <TableHead className="text-center min-w-[80px]" colSpan={2}>Total</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10" />
                {calculations.map(({ resource }) => (
                  <React.Fragment key={resource.id}>
                    <TableHead className="text-right text-xs">Days</TableHead>
                    <TableHead className="text-right text-xs">Cost</TableHead>
                  </React.Fragment>
                ))}
                <TableHead className="text-right text-xs">Days</TableHead>
                <TableHead className="text-right text-xs">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.map(week => {
                let totalDays = 0;
                let totalCost = 0;
                return (
                  <TableRow key={week.index}>
                    <TableCell className="sticky left-0 bg-card z-10 text-xs whitespace-nowrap">{week.label}</TableCell>
                    {calculations.map(({ resource, calc }) => {
                      const wb = calc.weeklyBreakdown.find(w => w.week === week.index);
                      const days = wb?.billableDays ?? 0;
                      const cost = wb?.price ?? 0;
                      totalDays += days;
                      totalCost += cost;
                      return (
                        <React.Fragment key={resource.id}>
                          <TableCell className="text-right text-xs">{days > 0 ? days.toFixed(1) : '—'}</TableCell>
                          <TableCell className="text-right text-xs">{cost > 0 ? fmt(cost) : '—'}</TableCell>
                        </React.Fragment>
                      );
                    })}
                    <TableCell className="text-right text-xs font-semibold">{totalDays > 0 ? totalDays.toFixed(1) : '—'}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{totalCost > 0 ? fmt(totalCost) : '—'}</TableCell>
                  </TableRow>
                );
              })}
              {/* Totals row */}
              <TableRow className="border-t-2 font-bold">
                <TableCell className="sticky left-0 bg-card z-10">Total</TableCell>
                {calculations.map(({ resource, calc }) => (
                  <React.Fragment key={resource.id}>
                    <TableCell className="text-right text-xs">{calc.totalWorkingDays.toFixed(1)}</TableCell>
                    <TableCell className="text-right text-xs">{fmt(calc.totalPrice)}</TableCell>
                  </React.Fragment>
                ))}
                <TableCell className="text-right text-xs">{calculations.reduce((s, c) => s + c.calc.totalWorkingDays, 0).toFixed(1)}</TableCell>
                <TableCell className="text-right text-xs">{fmt(calculations.reduce((s, c) => s + c.calc.totalPrice, 0))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
