import React, { useMemo, useState, useEffect } from 'react';
import { parseISO } from 'date-fns';

import { useProject } from '@/context/ProjectContext';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { COUNTRY_CURRENCY, CURRENCY_SYMBOLS } from '@/lib/types';
import { fetchECBRates, convertCurrency, mergeRates } from '@/lib/currencyRates';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function ScenarioCompare({ onClose }: { onClose: () => void }) {
  const { config, scenarios, targetCurrency, programVacationWeeks, customRates } = useProject();

  const [fetchedRates, setFetchedRates] = useState<Record<string, number>>({});
  useEffect(() => { fetchECBRates().then(setFetchedRates); }, []);
  const rates = useMemo(() => mergeRates(fetchedRates, customRates), [fetchedRates, customRates]);

  const startDate = config.startDate ? parseISO(config.startDate) : null;
  const endDate = config.endDate ? parseISO(config.endDate) : null;
  const weeks = startDate && endDate ? getProjectWeeks(startDate, endDate) : [];

  const symbol = CURRENCY_SYMBOLS[targetCurrency];
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const scenarioData = useMemo(() => {
    if (!startDate || !endDate) return [];
    return scenarios.map(s => {
      let totalDays = 0;
      let totalHours = 0;
      let totalCost = 0;
      s.resources.forEach(r => {
        const calc = calculateResource(r, weeks, s.rateCard, startDate, endDate, programVacationWeeks);
        totalDays += calc.totalWorkingDays;
        totalHours += calc.totalWorkingHours;
        const lc = COUNTRY_CURRENCY[r.country];
        totalCost += convertCurrency(calc.totalPrice, lc, targetCurrency, rates);
      });
      const colaM = s.colaEnabled ? 1 + s.colaPercent / 100 : 1;
      const bufM = s.bufferEnabled ? 1 + s.bufferPercent / 100 : 1;
      const grandTotal = totalCost * colaM * bufM;
      return { id: s.id, name: s.name, resources: s.resources.length, totalDays, totalHours, totalCost, grandTotal };
    });
  }, [scenarios, startDate, endDate, weeks, programVacationWeeks, targetCurrency, rates]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Scenario Comparison</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead className="text-right">Resources</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Subtotal ({targetCurrency})</TableHead>
                <TableHead className="text-right">Grand Total ({targetCurrency})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarioData.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right">{s.resources}</TableCell>
                  <TableCell className="text-right">{s.totalDays.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{s.totalHours.toFixed(0)}</TableCell>
                  <TableCell className="text-right">{symbol}{fmt(s.totalCost)}</TableCell>
                  <TableCell className="text-right font-bold">{symbol}{fmt(s.grandTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
