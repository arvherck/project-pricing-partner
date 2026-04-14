import React, { useMemo, useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { Download, RotateCcw } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { COUNTRY_CURRENCY, CURRENCY_SYMBOLS, COUNTRY_FLAGS, Currency } from '@/lib/types';
import { fetchECBRates, convertCurrency, getEurBasedRates, mergeRates } from '@/lib/currencyRates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function SummaryView() {
  const { config, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent, targetCurrency, programVacationWeeks, customRates, setCustomRates } = useProject();

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
      return { ...calc, name: r.name || 'Unnamed', country: r.country, localCurrency, convertedPrice };
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

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(config.name || 'Project Pricing', 14, 20);
    doc.setFontSize(10);
    doc.text(`${config.startDate} to ${config.endDate} · ${weeks.length} weeks`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Resource', 'Country', 'Days', 'Hours', `Local Cost`, `Cost (${targetCurrency})`]],
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
    });

    doc.save(`${config.name || 'project'}-pricing.pdf`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Summary ({targetSymbol} {targetCurrency})</CardTitle>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={calculations.length === 0}>
            <Download className="mr-1 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={calculations.length === 0}>
            <Download className="mr-1 h-4 w-4" /> PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
