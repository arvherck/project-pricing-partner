import React, { useMemo, useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { Download } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { ResourceCalculation, COUNTRY_CURRENCY, CURRENCY_SYMBOLS, ALL_CURRENCIES, COUNTRY_FLAGS, Currency } from '@/lib/types';
import { fetchECBRates, convertCurrency, getEurBasedRates } from '@/lib/currencyRates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function SummaryView() {
  const { config, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent, targetCurrency, setTargetCurrency, programVacationWeeks } = useProject();

  const [rates, setRates] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchECBRates().then(setRates);
  }, []);

  const startDate = config.startDate ? parseISO(config.startDate) : null;
  const endDate = config.endDate ? parseISO(config.endDate) : null;
  const weeks = startDate && endDate ? getProjectWeeks(startDate, endDate) : [];

  const calculations = useMemo(() => {
    if (!startDate || !endDate) return [];
    return resources.map(r => {
      const calc = calculateResource(r, weeks, rateCard, startDate, endDate, programVacationWeeks);
      const localCurrency = COUNTRY_CURRENCY[r.country];
      const convertedPrice = convertCurrency(calc.totalPrice, localCurrency, targetCurrency, rates);
      return {
        ...calc,
        name: r.name || 'Unnamed',
        country: r.country,
        localCurrency,
        convertedPrice,
      };
    });
  }, [resources, weeks, rateCard, startDate, endDate, targetCurrency, rates, programVacationWeeks]);

  // Currency rates in use
  const usedCurrencies = useMemo(() => {
    const set = new Set<Currency>();
    resources.forEach(r => set.add(COUNTRY_CURRENCY[r.country]));
    set.add(targetCurrency);
    return Array.from(set);
  }, [resources, targetCurrency]);

  const eurRates = useMemo(() => getEurBasedRates(rates), [rates]);

  const grandTotalConverted = calculations.reduce((s, c) => s + c.convertedPrice, 0);
  const totalDays = calculations.reduce((s, c) => s + c.totalWorkingDays, 0);
  const colaMultiplier = 1 + colaPercent / 100;
  const bufferMultiplier = 1 + bufferPercent / 100;
  const afterCola = colaEnabled ? grandTotalConverted * colaMultiplier : grandTotalConverted;
  const afterBuffer = bufferEnabled ? afterCola * bufferMultiplier : afterCola;

  const targetSymbol = CURRENCY_SYMBOLS[targetCurrency];
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const exportCSV = () => {
    const header = `Resource,Country,Working Days,Local Cost,Cost (${targetCurrency})\n`;
    const rows = calculations.map(c => {
      const ls = CURRENCY_SYMBOLS[c.localCurrency];
      return `"${c.name}","${c.country}",${c.totalWorkingDays.toFixed(1)},${ls}${c.totalPrice.toFixed(0)},${targetSymbol}${c.convertedPrice.toFixed(0)}`;
    }).join('\n');
    const summary = `\n\nSubtotal,,${totalDays.toFixed(1)},,${targetSymbol}${grandTotalConverted.toFixed(0)}\n${colaEnabled ? `COLA (${colaPercent}%),,,,"${targetSymbol}${(grandTotalConverted * (colaMultiplier - 1)).toFixed(0)}"\n` : ''}${bufferEnabled ? `Buffer (${bufferPercent}%),,,,"${targetSymbol}${(afterCola * (bufferMultiplier - 1)).toFixed(0)}"\n` : ''}Grand Total,,${totalDays.toFixed(1)},,${targetSymbol}${afterBuffer.toFixed(0)}`;
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
      head: [['Resource', 'Country', 'Days', `Local Cost`, `Cost (${targetCurrency})`]],
      body: calculations.map(c => {
        const ls = CURRENCY_SYMBOLS[c.localCurrency];
        return [c.name, c.country, c.totalWorkingDays.toFixed(1), `${ls}${fmt(c.totalPrice)}`, `${targetSymbol}${fmt(c.convertedPrice)}`];
      }),
      foot: [
        ['Subtotal', '', totalDays.toFixed(1), '', `${targetSymbol}${fmt(grandTotalConverted)}`],
        ...(colaEnabled ? [['COLA (' + colaPercent + '%)', '', '', '', `+${targetSymbol}${fmt(grandTotalConverted * (colaMultiplier - 1))}`]] : []),
        ...(bufferEnabled ? [['Buffer (' + bufferPercent + '%)', '', '', '', `+${targetSymbol}${fmt(afterCola * (bufferMultiplier - 1))}`]] : []),
        ['Grand Total', '', totalDays.toFixed(1), '', `${targetSymbol}${fmt(afterBuffer)}`],
      ],
    });

    doc.save(`${config.name || 'project'}-pricing.pdf`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Summary</CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Target Currency</Label>
            <Select value={targetCurrency} onValueChange={v => setTargetCurrency(v as Currency)}>
              <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_CURRENCIES.map(c => (
                  <SelectItem key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                  <TableHead className="text-right">Working Days</TableHead>
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
              <p className="text-muted-foreground">{totalDays.toFixed(1)} total working days</p>
            </div>

            {/* Currency Rates */}
            {usedCurrencies.length > 1 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-semibold mb-2">Exchange Rates Applied (base: EUR)</h4>
                <div className="flex flex-wrap gap-3 text-xs">
                  {usedCurrencies.filter(c => c !== 'EUR').map(c => (
                    <div key={c} className="rounded border px-2 py-1">
                      1 EUR = {eurRates[c]?.toFixed(4) ?? '—'} {c} ({CURRENCY_SYMBOLS[c]})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
