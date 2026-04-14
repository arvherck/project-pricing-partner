import React from 'react';
import { useProject } from '@/context/ProjectContext';
import { SENIORITY_LEVELS, COUNTRIES, Seniority, Country } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function RateCardEditor() {
  const { rateCard, setRateCard } = useProject();

  const updateRate = (seniority: Seniority, country: Country, value: string) => {
    const num = parseInt(value) || 0;
    setRateCard({
      ...rateCard,
      [seniority]: { ...rateCard[seniority], [country]: num },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Card (EUR / day)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Seniority</TableHead>
                {COUNTRIES.map(c => <TableHead key={c} className="text-center">{c}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {SENIORITY_LEVELS.map(s => (
                <TableRow key={s}>
                  <TableCell className="font-medium">{s}</TableCell>
                  {COUNTRIES.map(c => (
                    <TableCell key={c} className="p-1">
                      <Input
                        type="number"
                        className="h-8 text-center text-sm"
                        value={rateCard[s][c]}
                        onChange={e => updateRate(s, c, e.target.value)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
