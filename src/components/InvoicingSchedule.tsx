import React, { useMemo, useEffect, useState } from 'react';
import { parseISO, format, isWithinInterval, eachDayOfInterval, isWeekend } from 'date-fns';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { InvoiceRow, CURRENCY_SYMBOLS, COUNTRY_CURRENCY } from '@/lib/types';
import { fetchECBRates, convertCurrency, mergeRates } from '@/lib/currencyRates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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

  const addRow = () => {
    setInvoiceRows([...invoiceRows, {
      id: crypto.randomUUID(),
      label: '',
      date: '',
      percentOfTotal: 0,
    }]);
  };

  const updateRow = (id: string, updates: Partial<InvoiceRow>) => {
    setInvoiceRows(invoiceRows.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRow = (id: string) => {
    setInvoiceRows(invoiceRows.filter(r => r.id !== id));
  };

  // Calculate working days per invoice period
  const rowsWithCalc = useMemo(() => {
    const sorted = [...invoiceRows].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return sorted.map((row, i) => {
      const amount = grandTotal * (row.percentOfTotal / 100);
      const workingDays = totalWorkingDays * (row.percentOfTotal / 100);
      const workDelivered = totalWorkingDays > 0 ? (workingDays / totalWorkingDays) * 100 : 0;
      return { ...row, amount, workingDays, workDelivered };
    });
  }, [invoiceRows, grandTotal, totalWorkingDays]);

  const totalPercent = invoiceRows.reduce((s, r) => s + r.percentOfTotal, 0);
  const totalAmount = grandTotal * (totalPercent / 100);
  const totalCalcDays = totalWorkingDays * (totalPercent / 100);

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
          <p className="text-sm text-muted-foreground text-center py-8">No invoices added. Click "Add Invoice" to create an invoicing schedule.</p>
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
                {rowsWithCalc.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Input
                        value={row.label}
                        onChange={e => updateRow(row.id, { label: e.target.value })}
                        placeholder="e.g. Start"
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("h-8 w-full justify-start text-left text-sm font-normal", !row.date && "text-muted-foreground")}>
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
                    <TableCell className="text-right text-sm">{row.workDelivered.toFixed(0)}%</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeRow(row.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="font-bold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">{totalPercent.toFixed(0)}%</TableCell>
                  <TableCell className="text-right">{symbol}{fmt(totalAmount)}</TableCell>
                  <TableCell className="text-right">{totalCalcDays.toFixed(0)}</TableCell>
                  <TableCell className="text-right">{totalPercent.toFixed(0)}%</TableCell>
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
