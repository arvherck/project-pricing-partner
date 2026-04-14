import React from 'react';
import { useProject } from '@/context/ProjectContext';
import { SENIORITY_LEVELS, COUNTRIES, SENIORITY_EXPERIENCE, COUNTRY_CURRENCY, CURRENCY_SYMBOLS, Seniority, Country } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
        <CardTitle>Rate Card (per day, local currency)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Seniority</TableHead>
                {COUNTRIES.map(c => (
                  <TableHead key={c} className="text-center">
                    {c}
                    <span className="block text-xs text-muted-foreground font-normal">{CURRENCY_SYMBOLS[COUNTRY_CURRENCY[c]]}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TooltipProvider>
                {SENIORITY_LEVELS.map(s => (
                  <TableRow key={s}>
                    <TableCell className="font-medium">
                      <Tooltip>
                        <TooltipTrigger className="text-left">
                          <span>{s}</span>
                          <span className="block text-xs text-muted-foreground">{SENIORITY_EXPERIENCE[s]}</span>
                        </TooltipTrigger>
                        <TooltipContent>{SENIORITY_EXPERIENCE[s]} experience</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    {COUNTRIES.map(c => (
                      <TableCell key={c} className="p-1">
                        <Input
                          type="number"
                          className="h-8 text-center text-sm"
                          value={rateCard[s]?.[c] ?? 0}
                          onChange={e => updateRate(s, c, e.target.value)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TooltipProvider>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
