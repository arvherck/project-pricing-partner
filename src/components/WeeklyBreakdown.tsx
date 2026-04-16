import React, { useMemo, useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { useProject } from '@/context/ProjectContext';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { COUNTRY_CURRENCY, CURRENCY_SYMBOLS, COUNTRY_FLAGS } from '@/lib/types';
import { fetchECBRates, convertCurrency, mergeRates } from '@/lib/currencyRates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function WeeklyBreakdown() {
  const { config, resources, rateCard, programVacationWeeks, targetCurrency, customRates } = useProject();

  const [fetchedRates, setFetchedRates] = useState<Record<string, number>>({});
  useEffect(() => { fetchECBRates().then(setFetchedRates); }, []);
  const rates = useMemo(() => mergeRates(fetchedRates, customRates), [fetchedRates, customRates]);

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

  const targetSymbol = CURRENCY_SYMBOLS[targetCurrency];
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Breakdown ({targetSymbol} {targetCurrency})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 min-w-[140px]">Week</TableHead>
                {calculations.map(({ resource }) => (
                  <TableHead key={resource.id} className="text-center min-w-[120px]" colSpan={2}>
                    {COUNTRY_FLAGS[resource.country]} {resource.name || 'Unnamed'}
                  </TableHead>
                ))}
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
                      const localCost = wb?.price ?? 0;
                      const localCurrency = COUNTRY_CURRENCY[resource.country];
                      const cost = convertCurrency(localCost, localCurrency, targetCurrency, rates);
                      totalDays += days;
                      totalCost += cost;
                      return (
                        <React.Fragment key={resource.id}>
                          <TableCell className="text-right text-xs">{days > 0 ? days.toFixed(1) : '—'}</TableCell>
                          <TableCell className="text-right text-xs">{cost > 0 ? `${targetSymbol}${fmt(cost)}` : '—'}</TableCell>
                        </React.Fragment>
                      );
                    })}
                    <TableCell className="text-right text-xs font-semibold">{totalDays > 0 ? totalDays.toFixed(1) : '—'}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{totalCost > 0 ? `${targetSymbol}${fmt(totalCost)}` : '—'}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="border-t-2 font-bold">
                <TableCell className="sticky left-0 bg-card z-10">Total</TableCell>
                {calculations.map(({ resource, calc }) => {
                  const localCurrency = COUNTRY_CURRENCY[resource.country];
                  const convertedTotal = convertCurrency(calc.totalPrice, localCurrency, targetCurrency, rates);
                  return (
                    <React.Fragment key={resource.id}>
                      <TableCell className="text-right text-xs">{calc.totalWorkingDays.toFixed(1)}</TableCell>
                      <TableCell className="text-right text-xs">{targetSymbol}{fmt(convertedTotal)}</TableCell>
                    </React.Fragment>
                  );
                })}
                <TableCell className="text-right text-xs">{calculations.reduce((s, c) => s + c.calc.totalWorkingDays, 0).toFixed(1)}</TableCell>
                <TableCell className="text-right text-xs">
                  {targetSymbol}{fmt(calculations.reduce((s, c) => s + convertCurrency(c.calc.totalPrice, COUNTRY_CURRENCY[c.resource.country], targetCurrency, rates), 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
