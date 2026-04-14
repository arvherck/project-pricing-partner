import React from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function PriceAdjustments({ grandTotal }: { grandTotal: number }) {
  const { colaEnabled, setColaEnabled, bufferEnabled, setBufferEnabled } = useProject();

  const afterCola = colaEnabled ? grandTotal * 1.025 : grandTotal;
  const afterBuffer = bufferEnabled ? afterCola * 1.10 : afterCola;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Adjustments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label className="text-sm font-medium">COLA Uplift (2.5%)</Label>
            <p className="text-xs text-muted-foreground">Cost-of-living adjustment</p>
          </div>
          <div className="flex items-center gap-4">
            {colaEnabled && (
              <span className="text-sm text-muted-foreground">
                €{grandTotal.toLocaleString()} → €{(grandTotal * 1.025).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            )}
            <Switch checked={colaEnabled} onCheckedChange={setColaEnabled} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label className="text-sm font-medium">Fixed Price Buffer (10%)</Label>
            <p className="text-xs text-muted-foreground">Overtime / risk buffer</p>
          </div>
          <div className="flex items-center gap-4">
            {bufferEnabled && (
              <span className="text-sm text-muted-foreground">
                €{afterCola.toLocaleString(undefined, { maximumFractionDigits: 0 })} → €{afterBuffer.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            )}
            <Switch checked={bufferEnabled} onCheckedChange={setBufferEnabled} />
          </div>
        </div>
        <div className="rounded-lg bg-muted p-4 text-right">
          <p className="text-sm text-muted-foreground">Adjusted Grand Total</p>
          <p className="text-2xl font-bold">€{afterBuffer.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </CardContent>
    </Card>
  );
}
