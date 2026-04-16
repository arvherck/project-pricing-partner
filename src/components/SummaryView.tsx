import React, { useMemo, useState, useEffect } from 'react';
import { parseISO, format, eachDayOfInterval, isWeekend } from 'date-fns';
import { Download, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { COUNTRY_CURRENCY, CURRENCY_SYMBOLS, COUNTRY_FLAGS, Currency, SENIORITY_LEVELS } from '@/lib/types';
import { fetchECBRates, convertCurrency, getEurBasedRates, mergeRates } from '@/lib/currencyRates';
import { getHolidaysInRange, isHoliday } from '@/lib/holidays';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle } from 'lucide-react';

export default function SummaryView() {
  const {
    config, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent,
    targetCurrency, programVacationWeeks, customRates, setCustomRates, invoiceRows,
  } = useProject();

  const [fetchedRates, setFetchedRates] = useState<Record<string, number>>({});
  useEffect(() => { fetchECBRates().then(setFetchedRates); }, []);
  const rates = useMemo(() => mergeRates(fetchedRates, customRates), [fetchedRates, customRates]);

  const startDate = config.startDate ? parseISO(config.startDate) : null;
  const endDate = config.endDate ? parseISO(config.endDate) : null;
  const weeks = startDate && endDate ? getProjectWeeks(startDate, endDate) : [];

  const calculations = useMemo(() => {
    if (!startDate || !endDate) return [];
    return resources.map(r => {
      const calc = calculateResource(r, weeks, rateCard, startDate, endDate, programVacationWeeks);
      const localCurrency = COUNTRY_CURRENCY[r.country];
      const convertedPrice = convertCurrency(calc.totalPrice, localCurrency, targetCurrency, rates);
      return { ...calc, name: r.name || 'Unnamed', country: r.country, localCurrency, convertedPrice, resource: r };
    });
  }, [resources, weeks, rateCard, startDate, endDate, targetCurrency, rates, programVacationWeeks]);

  const usedCurrencies = useMemo(() => {
    const set = new Set<Currency>();
    resources.forEach(r => set.add(COUNTRY_CURRENCY[r.country]));
    set.add(targetCurrency);
    return Array.from(set);
  }, [resources, targetCurrency]);

  const fetchedEurRates = useMemo(() => getEurBasedRates(fetchedRates), [fetchedRates]);
  const mergedEurRates = useMemo(() => getEurBasedRates(rates), [rates]);

  const grandTotalConverted = calculations.reduce((s, c) => s + c.convertedPrice, 0);
  const totalDays = calculations.reduce((s, c) => s + c.totalWorkingDays, 0);
  const totalHours = calculations.reduce((s, c) => s + c.totalWorkingHours, 0);
  const colaMultiplier = 1 + colaPercent / 100;
  const bufferMultiplier = 1 + bufferPercent / 100;
  const afterCola = colaEnabled ? grandTotalConverted * colaMultiplier : grandTotalConverted;
  const afterBuffer = bufferEnabled ? afterCola * bufferMultiplier : afterCola;

  const targetSymbol = CURRENCY_SYMBOLS[targetCurrency];
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const totalInvoicePercent = invoiceRows.reduce((s, r) => s + r.percentOfTotal, 0);
  const invoicePercentMismatch = invoiceRows.length > 0 && Math.abs(totalInvoicePercent - 100) > 0.01;

  const handleRateChange = (currency: Currency, value: string) => {
    const num = parseFloat(value);
    if (!value || isNaN(num)) {
      setCustomRates({ ...customRates, [`EUR_${currency}`]: null });
    } else {
      setCustomRates({ ...customRates, [`EUR_${currency}`]: num });
    }
  };

  const resetRate = (currency: Currency) => {
    const updated = { ...customRates };
    delete updated[`EUR_${currency}`];
    setCustomRates(updated);
  };

  const exportCSV = () => {
    const header = `Resource,Country,Working Days,Hours,Local Cost,Cost (${targetCurrency})\n`;
    const rows = calculations.map(c => {
      const ls = CURRENCY_SYMBOLS[c.localCurrency];
      return `"${c.name}","${c.country}",${c.totalWorkingDays.toFixed(1)},${c.totalWorkingHours.toFixed(0)},${ls}${c.totalPrice.toFixed(0)},${targetSymbol}${c.convertedPrice.toFixed(0)}`;
    }).join('\n');
    const summary = `\n\nSubtotal,,${totalDays.toFixed(1)},${totalHours.toFixed(0)},,${targetSymbol}${grandTotalConverted.toFixed(0)}\n${colaEnabled ? `COLA (${colaPercent}%),,,,,"${targetSymbol}${(grandTotalConverted * (colaMultiplier - 1)).toFixed(0)}"\n` : ''}${bufferEnabled ? `Buffer (${bufferPercent}%),,,,,"${targetSymbol}${(afterCola * (bufferMultiplier - 1)).toFixed(0)}"\n` : ''}Grand Total,,${totalDays.toFixed(1)},${totalHours.toFixed(0)},,${targetSymbol}${afterBuffer.toFixed(0)}`;
    const blob = new Blob([header + rows + summary], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${config.name || 'project'}-pricing.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const invoiceCalcData = useMemo(() => {
    if (!startDate || !endDate) return [];
    const programVacSet = new Set(programVacationWeeks);
    const country = resources.length > 0 ? resources[0].country : 'Netherlands' as const;
    const projectHolidays = getHolidaysInRange(country, startDate, endDate);
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const totalProjectWD = allDays.filter(d => {
      if (isWeekend(d)) return false;
      if (isHoliday(d, projectHolidays)) return false;
      const wi = weeks.findIndex(w => d >= w.startDate && d <= w.endDate);
      if (wi >= 0 && programVacSet.has(wi)) return false;
      return true;
    }).length;

    const totalWD = resources.reduce((sum, r) => {
      const calc = calculateResource(r, weeks, rateCard, startDate, endDate, programVacationWeeks);
      return sum + calc.totalWorkingDays;
    }, 0);

    let total = resources.reduce((sum, r) => {
      const calc = calculateResource(r, weeks, rateCard, startDate, endDate, programVacationWeeks);
      const lc = COUNTRY_CURRENCY[r.country];
      return sum + convertCurrency(calc.totalPrice, lc, targetCurrency, rates);
    }, 0);
    if (colaEnabled) total *= colaMultiplier;
    if (bufferEnabled) total *= bufferMultiplier;

    return [...invoiceRows].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(row => {
      const amount = total * (row.percentOfTotal / 100);
      const workingDays = totalWD * (row.percentOfTotal / 100);
      let workDelivered = 0;
      if (row.date && totalProjectWD > 0) {
        const invoiceDate = parseISO(row.date);
        const effectiveEnd = invoiceDate > endDate ? endDate : invoiceDate < startDate ? startDate : invoiceDate;
        const holidays = getHolidaysInRange(country, startDate, effectiveEnd);
        const elapsed = eachDayOfInterval({ start: startDate, end: effectiveEnd }).filter(d => {
          if (isWeekend(d)) return false;
          if (isHoliday(d, holidays)) return false;
          const wi = weeks.findIndex(w => d >= w.startDate && d <= w.endDate);
          if (wi >= 0 && programVacSet.has(wi)) return false;
          return true;
        }).length;
        workDelivered = (elapsed / totalProjectWD) * 100;
      }
      return { label: row.label, date: row.date, pct: row.percentOfTotal, amount, workingDays, workDelivered };
    });
  }, [invoiceRows, startDate, endDate, resources, weeks, rateCard, programVacationWeeks, targetCurrency, rates, colaEnabled, colaPercent, bufferEnabled, bufferPercent]);

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    let y = 15;

    const sectionTitle = (title: string) => {
      if (y > 250) { doc.addPage(); y = 15; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, y);
      y += 7;
    };

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(config.name || 'Project Pricing', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${config.startDate || '?'} to ${config.endDate || '?'} · ${weeks.length} weeks`, 14, y);
    y += 5;
    doc.text(`Currency: ${targetCurrency}`, 14, y);
    y += 10;

    sectionTitle('Resources');
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Seniority', 'Country', 'Allocation', 'Vacation Days', `Rate (local/hr)`]],
      body: resources.map(r => {
        const cur = CURRENCY_SYMBOLS[COUNTRY_CURRENCY[r.country]];
        const rate = rateCard[r.seniority]?.[r.country] ?? 0;
        return [r.name || 'Unnamed', r.seniority, r.country, `${r.allocationPercent}%`, `${(r.vacationDates ?? []).length}`, `${cur}${rate}`];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    if (calculations.length > 0 && weeks.length > 0) {
      sectionTitle('Weekly Breakdown');
      const wbHead = ['Week', ...calculations.flatMap(c => [`${c.name} Days`, `${c.name} Cost`]), 'Total Days', 'Total Cost'];
      const wbBody = weeks.map(week => {
        let tDays = 0, tCost = 0;
        const cells = calculations.flatMap(c => {
          const wb = c.weeklyBreakdown.find((w: any) => w.week === week.index);
          const days = wb?.billableDays ?? 0;
          const localCost = wb?.price ?? 0;
          const cost = convertCurrency(localCost, c.localCurrency as Currency, targetCurrency, rates);
          tDays += days;
          tCost += cost;
          return [days > 0 ? days.toFixed(1) : '—', cost > 0 ? fmt(cost) : '—'];
        });
        return [week.label, ...cells, tDays > 0 ? tDays.toFixed(1) : '—', tCost > 0 ? fmt(tCost) : '—'];
      });
      autoTable(doc, {
        startY: y,
        head: [wbHead],
        body: wbBody,
        styles: { fontSize: 6, cellPadding: 1.5 },
        headStyles: { fillColor: [59, 130, 246], fontSize: 6 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    sectionTitle('Summary');
    autoTable(doc, {
      startY: y,
      head: [['Resource', 'Country', 'Days', 'Hours', 'Local Cost', `Cost (${targetCurrency})`]],
      body: calculations.map(c => {
        const ls = CURRENCY_SYMBOLS[c.localCurrency];
        return [c.name, c.country, c.totalWorkingDays.toFixed(1), c.totalWorkingHours.toFixed(0), `${ls}${fmt(c.totalPrice)}`, `${targetSymbol}${fmt(c.convertedPrice)}`];
      }),
      foot: [
        ['Subtotal', '', totalDays.toFixed(1), totalHours.toFixed(0), '', `${targetSymbol}${fmt(grandTotalConverted)}`],
        ...(colaEnabled ? [['COLA (' + colaPercent + '%)', '', '', '', '', `+${targetSymbol}${fmt(grandTotalConverted * (colaMultiplier - 1))}`]] : []),
        ...(bufferEnabled ? [['Buffer (' + bufferPercent + '%)', '', '', '', '', `+${targetSymbol}${fmt(afterCola * (bufferMultiplier - 1))}`]] : []),
        ['Grand Total', '', totalDays.toFixed(1), totalHours.toFixed(0), '', `${targetSymbol}${fmt(afterBuffer)}`],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    if (invoiceCalcData.length > 0) {
      sectionTitle('Invoicing Schedule');
      const invTotalPct = invoiceCalcData.reduce((s, r) => s + r.pct, 0);
      const invTotalAmt = invoiceCalcData.reduce((s, r) => s + r.amount, 0);
      const invTotalDays = invoiceCalcData.reduce((s, r) => s + r.workingDays, 0);
      autoTable(doc, {
        startY: y,
        head: [['Label', 'Date', '% of Total', `Amount (${targetCurrency})`, 'Working Days', '% Work Delivered']],
        body: invoiceCalcData.map(r => [
          r.label, r.date ? format(parseISO(r.date), 'dd-MMM-yy') : '', `${r.pct.toFixed(1)}%`,
          `${targetSymbol}${fmt(r.amount)}`, r.workingDays.toFixed(0), `${r.workDelivered.toFixed(1)}%`,
        ]),
        foot: [['Total', '', `${invTotalPct.toFixed(1)}%`, `${targetSymbol}${fmt(invTotalAmt)}`, invTotalDays.toFixed(0), '']],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (usedCurrencies.length > 1) {
      sectionTitle('Exchange Rates Applied');
      const rateRows = usedCurrencies.filter(c => c !== 'EUR').map(c => {
        const isCustom = customRates[`EUR_${c}`] != null;
        return ['EUR', c, mergedEurRates[c]?.toFixed(4) ?? '—', isCustom ? 'Custom' : 'Market'];
      });
      autoTable(doc, {
        startY: y,
        head: [['From', 'To', 'Rate', 'Source']],
        body: rateRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    doc.save(`${config.name || 'project'}-pricing.pdf`);
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Resource', 'Country', 'Working Days', 'Hours', 'Local Cost', `Cost (${targetCurrency})`],
      ...calculations.map(c => {
        const ls = CURRENCY_SYMBOLS[c.localCurrency];
        return [c.name, c.country, c.totalWorkingDays, c.totalWorkingHours, c.totalPrice, c.convertedPrice];
      }),
      [],
      ['Subtotal', '', totalDays, totalHours, '', grandTotalConverted],
      ...(colaEnabled ? [['COLA (' + colaPercent + '%)', '', '', '', '', grandTotalConverted * (colaMultiplier - 1)]] : []),
      ...(bufferEnabled ? [['Buffer (' + bufferPercent + '%)', '', '', '', '', afterCola * (bufferMultiplier - 1)]] : []),
      ['Grand Total', '', totalDays, totalHours, '', afterBuffer],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Weekly Breakdown sheet
    if (calculations.length > 0 && weeks.length > 0) {
      const wbHead = ['Week', ...calculations.flatMap(c => [`${c.name} Days`, `${c.name} Cost`]), 'Total Days', 'Total Cost'];
      const wbBody = weeks.map(week => {
        let tDays = 0, tCost = 0;
        const cells = calculations.flatMap(c => {
          const wb2 = c.weeklyBreakdown.find((w: any) => w.week === week.index);
          const days = wb2?.billableDays ?? 0;
          const localCost = wb2?.price ?? 0;
          const cost = convertCurrency(localCost, c.localCurrency as Currency, targetCurrency, rates);
          tDays += days;
          tCost += cost;
          return [days, cost];
        });
        return [week.label, ...cells, tDays, tCost];
      });
      const wbWs = XLSX.utils.aoa_to_sheet([wbHead, ...wbBody]);
      XLSX.utils.book_append_sheet(wb, wbWs, 'Weekly Breakdown');
    }

    // Invoicing Schedule sheet
    if (invoiceCalcData.length > 0) {
      const invData = [
        ['Label', 'Date', '% of Total', `Amount (${targetCurrency})`, 'Working Days', '% Work Delivered'],
        ...invoiceCalcData.map(r => [r.label, r.date, r.pct, r.amount, r.workingDays, r.workDelivered]),
      ];
      const invWs = XLSX.utils.aoa_to_sheet(invData);
      XLSX.utils.book_append_sheet(wb, invWs, 'Invoicing Schedule');
    }

    // Exchange Rates sheet
    if (usedCurrencies.length > 1) {
      const rateData = [
        ['From', 'To', 'Rate', 'Source'],
        ...usedCurrencies.filter(c => c !== 'EUR').map(c => {
          const isCustom = customRates[`EUR_${c}`] != null;
          return ['EUR', c, mergedEurRates[c] ?? 0, isCustom ? 'Custom' : 'Market'];
        }),
      ];
      const rateWs = XLSX.utils.aoa_to_sheet(rateData);
      XLSX.utils.book_append_sheet(wb, rateWs, 'Exchange Rates');
    }

    XLSX.writeFile(wb, `${config.name || 'project'}-pricing.xlsx`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Summary ({targetSymbol} {targetCurrency})</CardTitle>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={calculations.length === 0}>
            <Download className="mr-1 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={calculations.length === 0}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={calculations.length === 0}>
            <Download className="mr-1 h-4 w-4" /> PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invoicePercentMismatch && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Invoice percentages total {totalInvoicePercent.toFixed(1)}% — they should add up to 100%.
            </AlertDescription>
          </Alert>
        )}
        {calculations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Add resources and set project dates to see the summary.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Local Cost</TableHead>
                  <TableHead className="text-right">Cost ({targetCurrency})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map(c => {
                  const ls = CURRENCY_SYMBOLS[c.localCurrency];
                  return (
                    <TableRow key={c.resourceId}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{COUNTRY_FLAGS[c.country as keyof typeof COUNTRY_FLAGS]} {c.country}</TableCell>
                      <TableCell className="text-right">{c.totalWorkingDays.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{c.totalWorkingHours.toFixed(0)}</TableCell>
                      <TableCell className="text-right">{ls}{fmt(c.totalPrice)}</TableCell>
                      <TableCell className="text-right">{targetSymbol}{fmt(c.convertedPrice)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="mt-4 space-y-1 text-right text-sm">
              <p>Subtotal: <strong>{targetSymbol}{fmt(grandTotalConverted)}</strong></p>
              {colaEnabled && <p className="text-muted-foreground">+ COLA {colaPercent}%: {targetSymbol}{fmt(grandTotalConverted * (colaMultiplier - 1))}</p>}
              {bufferEnabled && <p className="text-muted-foreground">+ Buffer {bufferPercent}%: {targetSymbol}{fmt(afterCola * (bufferMultiplier - 1))}</p>}
              <p className="text-lg font-bold pt-1 border-t">Grand Total: {targetSymbol}{fmt(afterBuffer)}</p>
              <p className="text-muted-foreground">{totalDays.toFixed(1)} days · {totalHours.toFixed(0)} hours</p>
            </div>

            {usedCurrencies.length > 1 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-semibold mb-2">Exchange Rates (base: EUR) — click to edit</h4>
                <div className="flex flex-wrap gap-3 text-xs">
                  <TooltipProvider>
                    {usedCurrencies.filter(c => c !== 'EUR').map(c => {
                      const isCustom = customRates[`EUR_${c}`] != null;
                      return (
                        <div key={c} className={`flex items-center gap-1 rounded border px-2 py-1 ${isCustom ? 'border-primary bg-primary/5' : ''}`}>
                          <span className="whitespace-nowrap">1 EUR =</span>
                          <Input
                            type="number"
                            step="0.0001"
                            value={isCustom ? (customRates[`EUR_${c}`] ?? '') : (fetchedEurRates[c]?.toFixed(4) ?? '')}
                            onChange={e => handleRateChange(c, e.target.value)}
                            className="h-6 w-20 text-xs px-1 border-0 bg-transparent focus-visible:ring-1"
                          />
                          <span className="whitespace-nowrap">{c}</span>
                          {isCustom && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => resetRate(c)}>
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reset to API rate ({fetchedEurRates[c]?.toFixed(4)})</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      );
                    })}
                  </TooltipProvider>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
