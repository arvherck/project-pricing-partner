import React, { useMemo, useEffect, useState, useRef } from 'react';
import { parseISO, format, eachDayOfInterval, isWeekend, addDays, startOfMonth, addMonths, isBefore, isAfter, isSameDay } from 'date-fns';
import { Plus, Trash2, CalendarIcon, AlertTriangle } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { InvoiceRow, CURRENCY_SYMBOLS, COUNTRY_CURRENCY } from '@/lib/types';
import { fetchECBRates, convertCurrency, mergeRates } from '@/lib/currencyRates';
import { getHolidaysInRange, isHoliday } from '@/lib/holidays';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function toWorkingDay(date: Date, allHolidays: Date[], direction: 'forward' | 'backward'): Date {
  let d = new Date(date);
  const step = direction === 'forward' ? 1 : -1;
  while (isWeekend(d) || isHoliday(d, allHolidays)) {
    d = addDays(d, step);
  }
  return d;
}

export default function InvoicingSchedule() {
  const {
    config, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent,
    targetCurrency, programVacationWeeks, invoiceRows, setInvoiceRows, customRates,
  } = useProject();

  const [fetchedRates, setFetchedRates] = useState<Record<string, number>>({});
  useEffect(() => { fetchECBRates().then(setFetchedRates); }, []);
  const rates = useMemo(() => mergeRates(fetchedRates, customRates), [fetchedRates, customRates]);

  const startDate = config.startDate ? parseISO(config.startDate) : null;
  const endDate = config.endDate ? parseISO(config.endDate) : null;
  const weeks = startDate && endDate ? getProjectWeeks(startDate, endDate) : [];

  const grandTotal = useMemo(() => {
    if (!startDate || !endDate) return 0;
    let total = resources.reduce((sum, r) => {
      const calc = calculateResource(r, weeks, rateCard, startDate, endDate, programVacationWeeks);
      const localCurrency = COUNTRY_CURRENCY[r.country];
      return sum + convertCurrency(calc.totalPrice, localCurrency, targetCurrency, rates);
    }, 0);
    if (colaEnabled) total *= (1 + colaPercent / 100);
    if (bufferEnabled) total *= (1 + bufferPercent / 100);
    return total;
  }, [resources, weeks, rateCard, startDate, endDate, targetCurrency, rates, colaEnabled, colaPercent, bufferEnabled, bufferPercent, programVacationWeeks]);

  const totalWorkingDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return resources.reduce((sum, r) => {
      const calc = calculateResource(r, weeks, rateCard, startDate, endDate, programVacationWeeks);
      return sum + calc.totalWorkingDays;
    }, 0);
  }, [resources, weeks, rateCard, startDate, endDate, programVacationWeeks]);

  const totalProjectWorkingDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const programVacSet = new Set(programVacationWeeks);
    const country = resources.length > 0 ? resources[0].country : 'Netherlands';
    const holidays = getHolidaysInRange(country, startDate, endDate);
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    return allDays.filter(d => {
      if (isWeekend(d)) return false;
      if (isHoliday(d, holidays)) return false;
      const weekIndex = weeks.findIndex(w => d >= w.startDate && d <= w.endDate);
      if (weekIndex >= 0 && programVacSet.has(weekIndex)) return false;
      return true;
    }).length;
  }, [startDate, endDate, weeks, programVacationWeeks, resources]);

  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current) return;
    if (invoiceRows.length > 0 || !startDate || !endDate) return;
    prefilled.current = true;

    const countries = resources.length > 0
      ? [...new Set(resources.map(r => r.country))]
      : ['Netherlands' as const];
    const allHolidays = countries.flatMap(c => getHolidaysInRange(c, startDate, endDate));

    const dates: Date[] = [];
    dates.push(toWorkingDay(startDate, allHolidays, 'forward'));

    let cursor = startOfMonth(addMonths(startDate, 1));
    while (isBefore(cursor, endDate)) {
      const wd = toWorkingDay(cursor, allHolidays, 'forward');
      if (isBefore(wd, endDate) && !isSameDay(wd, dates[0])) {
        dates.push(wd);
      }
      cursor = addMonths(cursor, 1);
    }

    const endWd = toWorkingDay(endDate, allHolidays, 'backward');
    if (!dates.some(d => isSameDay(d, endWd))) {
      dates.push(endWd);
    }

    const count = dates.length;
    const evenPercent = Math.floor((100 / count) * 100) / 100;
    const rows: InvoiceRow[] = dates.map((d, i) => ({
      id: crypto.randomUUID(),
      label: i === 0 ? 'Project Start' : i === dates.length - 1 ? 'Project End' : `Invoice ${i + 1}`,
      date: format(d, 'yyyy-MM-dd'),
      percentOfTotal: i === dates.length - 1
        ? Math.round((100 - evenPercent * (count - 1)) * 100) / 100
        : evenPercent,
    }));

    setInvoiceRows(rows);
  }, [startDate, endDate, invoiceRows.length, resources]);

  const addRow = () => {
    setInvoiceRows([...invoiceRows, { id: crypto.randomUUID(), label: '', date: '', percentOfTotal: 0 }]);
  };

  const updateRow = (id: string, updates: Partial<InvoiceRow>) => {
    if (updates.percentOfTotal !== undefined) {
      const otherSum = invoiceRows.filter(r => r.id !== id).reduce((s, r) => s + r.percentOfTotal, 0);
      const maxAllowed = Math.max(0, 100 - otherSum);
      updates.percentOfTotal = Math.min(Math.max(0, updates.percentOfTotal), maxAllowed);
    }
    setInvoiceRows(invoiceRows.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRow = (id: string) => {
    setInvoiceRows(invoiceRows.filter(r => r.id !== id));
  };

  const rowsWithCalc = useMemo(() => {
    const sorted = [...invoiceRows].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const programVacSet = new Set(programVacationWeeks);
    const country = resources.length > 0 ? resources[0].country : 'Netherlands';

    return sorted.map((row) => {
      const amount = grandTotal * (row.percentOfTotal / 100);
      const workingDays = totalWorkingDays * (row.percentOfTotal / 100);

      let workDelivered = 0;
      if (row.date && startDate && endDate && totalProjectWorkingDays > 0) {
        const invoiceDate = parseISO(row.date);
        const effectiveEnd = invoiceDate > endDate ? endDate : invoiceDate < startDate ? startDate : invoiceDate;
        const holidays = getHolidaysInRange(country, startDate, effectiveEnd);
        const daysToInvoice = eachDayOfInterval({ start: startDate, end: effectiveEnd });
        const elapsedWorkingDays = daysToInvoice.filter(d => {
          if (isWeekend(d)) return false;
          if (isHoliday(d, holidays)) return false;
          const weekIndex = weeks.findIndex(w => d >= w.startDate && d <= w.endDate);
          if (weekIndex >= 0 && programVacSet.has(weekIndex)) return false;
          return true;
        }).length;
        workDelivered = (elapsedWorkingDays / totalProjectWorkingDays) * 100;
      }

      // Check if date is outside project range
      const isOutOfRange = row.date && startDate && endDate && (
        isBefore(parseISO(row.date), startDate) || isAfter(parseISO(row.date), endDate)
      );

      return { ...row, amount, workingDays, workDelivered, isOutOfRange: !!isOutOfRange };
    });
  }, [invoiceRows, grandTotal, totalWorkingDays, totalProjectWorkingDays, startDate, endDate, weeks, programVacationWeeks, resources]);

  const totalPercent = invoiceRows.reduce((s, r) => s + r.percentOfTotal, 0);
  const totalAmount = grandTotal * (totalPercent / 100);
  const totalCalcDays = totalWorkingDays * (totalPercent / 100);
  const percentExceeds = totalPercent > 100;

  const symbol = CURRENCY_SYMBOLS[targetCurrency];
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Invoicing Schedule</CardTitle>
        <Button onClick={addRow} size="sm"><Plus className="mr-1 h-4 w-4" /> Add Invoice</Button>
      </CardHeader>
      <CardContent>
        {invoiceRows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No invoices added. Set project dates and add resources to auto-generate, or click "Add Invoice".</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Label</TableHead>
                  <TableHead className="min-w-[150px]">Invoicing Date</TableHead>
                  <TableHead className="text-right min-w-[80px]">% of Total</TableHead>
                  <TableHead className="text-right min-w-[120px]">Amount ({targetCurrency})</TableHead>
                  <TableHead className="text-right min-w-[100px]">Working Days</TableHead>
                  <TableHead className="text-right min-w-[120px]">% Work Delivered</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TooltipProvider>
                  {rowsWithCalc.map(row => (
                    <TableRow key={row.id} className={cn(row.isOutOfRange && "bg-destructive/5")}>
                      <TableCell>
                        <Input
                          value={row.label}
                          onChange={e => updateRow(row.id, { label: e.target.value })}
                          placeholder="e.g. Start"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn(
                                "h-8 w-full justify-start text-left text-sm font-normal",
                                !row.date && "text-muted-foreground",
                                row.isOutOfRange && "border-destructive text-destructive"
                              )}>
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {row.date ? format(parseISO(row.date), 'dd-MMM-yy') : 'Pick date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={row.date ? parseISO(row.date) : undefined}
                                onSelect={d => d && updateRow(row.id, { date: format(d, 'yyyy-MM-dd') })}
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          {row.isOutOfRange && (
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent>Date is outside the project range</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={row.percentOfTotal}
                          onChange={e => updateRow(row.id, { percentOfTotal: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-right text-sm w-20"
                          min={0}
                          max={100}
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm">{symbol}{fmt(row.amount)}</TableCell>
                      <TableCell className="text-right text-sm">{row.workingDays.toFixed(0)}</TableCell>
                      <TableCell className="text-right text-sm">{row.workDelivered.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeRow(row.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TooltipProvider>
              </TableBody>
              <TableFooter>
                <TableRow className="font-bold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className={cn("text-right", percentExceeds && "text-destructive")}>{totalPercent.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{symbol}{fmt(totalAmount)}</TableCell>
                  <TableCell className="text-right">{totalCalcDays.toFixed(0)}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
