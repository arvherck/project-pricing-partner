import React from 'react';
import { useProject } from '@/context/ProjectContext';
import { CURRENCY_SYMBOLS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function PriceAdjustments({ grandTotal }: { grandTotal: number }) {
  const {
    colaEnabled, setColaEnabled, colaPercent, setColaPercent,
    bufferEnabled, setBufferEnabled, bufferPercent, setBufferPercent,
    targetCurrency,
  } = useProject();

  const symbol = CURRENCY_SYMBOLS[targetCurrency];
  const colaMultiplier = 1 + colaPercent / 100;
  const bufferMultiplier = 1 + bufferPercent / 100;
  const afterCola = colaEnabled ? grandTotal * colaMultiplier : grandTotal;
  const afterBuffer = bufferEnabled ? afterCola * bufferMultiplier : afterCola;

  const fmt = (n: number) => `${symbol}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Adjustments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div>
              <Label className="text-sm font-medium">COLA Uplift</Label>
              <p className="text-xs text-muted-foreground">Cost-of-living adjustment</p>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                className="h-8 w-20 text-center text-sm"
                value={colaPercent}
                onChange={e => setColaPercent(parseFloat(e.target.value) || 0)}
                step={0.5}
                min={0}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {colaEnabled && (
              <span className="text-sm text-muted-foreground">
                {fmt(grandTotal)} → {fmt(grandTotal * colaMultiplier)}
              </span>
            )}
            <Switch checked={colaEnabled} onCheckedChange={setColaEnabled} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div>
              <Label className="text-sm font-medium">Fixed Price Buffer</Label>
              <p className="text-xs text-muted-foreground">Overtime / risk buffer</p>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                className="h-8 w-20 text-center text-sm"
                value={bufferPercent}
                onChange={e => setBufferPercent(parseFloat(e.target.value) || 0)}
                step={1}
                min={0}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {bufferEnabled && (
              <span className="text-sm text-muted-foreground">
                {fmt(afterCola)} → {fmt(afterBuffer)}
              </span>
            )}
            <Switch checked={bufferEnabled} onCheckedChange={setBufferEnabled} />
          </div>
        </div>
        <div className="rounded-lg bg-muted p-4 text-right">
          <p className="text-sm text-muted-foreground">Adjusted Grand Total</p>
          <p className="text-2xl font-bold">{fmt(afterBuffer)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
