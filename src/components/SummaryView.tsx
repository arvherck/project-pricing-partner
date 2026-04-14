import React, { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { Download } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { ResourceCalculation } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function SummaryView() {
  const { config, resources, rateCard, colaEnabled, bufferEnabled } = useProject();

  const startDate = config.startDate ? parseISO(config.startDate) : null;
  const endDate = config.endDate ? parseISO(config.endDate) : null;
  const weeks = startDate && endDate ? getProjectWeeks(startDate, endDate) : [];

  const calculations: (ResourceCalculation & { name: string; country: string })[] = useMemo(() => {
    if (!startDate || !endDate) return [];
    return resources.map(r => ({
      ...calculateResource(r, weeks, rateCard, startDate, endDate),
      name: r.name || 'Unnamed',
      country: r.country,
    }));
  }, [resources, weeks, rateCard, startDate, endDate]);

  const grandTotal = calculations.reduce((s, c) => s + c.totalPrice, 0);
  const totalDays = calculations.reduce((s, c) => s + c.totalWorkingDays, 0);
  const afterCola = colaEnabled ? grandTotal * 1.025 : grandTotal;
  const afterBuffer = bufferEnabled ? afterCola * 1.10 : afterCola;

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const exportCSV = () => {
    const header = 'Resource,Country,Working Days,Total Cost (EUR)\n';
    const rows = calculations.map(c => `"${c.name}","${c.country}",${c.totalWorkingDays.toFixed(1)},${c.totalPrice.toFixed(0)}`).join('\n');
    const summary = `\n\nSubtotal,,${totalDays.toFixed(1)},${grandTotal.toFixed(0)}\n${colaEnabled ? `COLA (2.5%),,,"${(grandTotal * 0.025).toFixed(0)}"\n` : ''}${bufferEnabled ? `Buffer (10%),,,"${((afterCola) * 0.10).toFixed(0)}"\n` : ''}Grand Total,,${totalDays.toFixed(1)},${afterBuffer.toFixed(0)}`;
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
      head: [['Resource', 'Country', 'Working Days', 'Total (EUR)']],
      body: calculations.map(c => [c.name, c.country, c.totalWorkingDays.toFixed(1), `€${fmt(c.totalPrice)}`]),
      foot: [
        ['Subtotal', '', totalDays.toFixed(1), `€${fmt(grandTotal)}`],
        ...(colaEnabled ? [['COLA (2.5%)', '', '', `+€${fmt(grandTotal * 0.025)}`]] : []),
        ...(bufferEnabled ? [['Buffer (10%)', '', '', `+€${fmt(afterCola * 0.10)}`]] : []),
        ['Grand Total', '', totalDays.toFixed(1), `€${fmt(afterBuffer)}`],
      ],
    });

    doc.save(`${config.name || 'project'}-pricing.pdf`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Summary</CardTitle>
        <div className="flex gap-2">
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
                  <TableHead className="text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map(c => (
                  <TableRow key={c.resourceId}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.country}</TableCell>
                    <TableCell className="text-right">{c.totalWorkingDays.toFixed(1)}</TableCell>
                    <TableCell className="text-right">€{fmt(c.totalPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 space-y-1 text-right text-sm">
              <p>Subtotal: <strong>€{fmt(grandTotal)}</strong></p>
              {colaEnabled && <p className="text-muted-foreground">+ COLA 2.5%: €{fmt(grandTotal * 0.025)}</p>}
              {bufferEnabled && <p className="text-muted-foreground">+ Buffer 10%: €{fmt(afterCola * 0.10)}</p>}
              <p className="text-lg font-bold pt-1 border-t">Grand Total: €{fmt(afterBuffer)}</p>
              <p className="text-muted-foreground">{totalDays.toFixed(1)} total working days</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
