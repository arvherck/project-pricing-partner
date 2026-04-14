import { Currency } from './types';

const ALL_CUR: Currency[] = ['EUR', 'GBP', 'SEK', 'USD', 'DKK', 'CHF', 'RUB', 'CAD', 'MXN', 'INR', 'CNY'];

// Fallback EUR-based rates (approximate)
const FALLBACK_EUR: Record<Currency, number> = {
  EUR: 1,
  GBP: 0.86,
  SEK: 11.20,
  USD: 1.08,
  DKK: 7.46,
  CHF: 0.97,
  RUB: 98.0,
  CAD: 1.47,
  MXN: 18.5,
  INR: 90.0,
  CNY: 7.80,
};

function buildCrossRates(eurRates: Record<Currency, number>): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const from of ALL_CUR) {
    for (const to of ALL_CUR) {
      rates[`${from}_${to}`] = eurRates[to] / eurRates[from];
    }
  }
  return rates;
}

const FALLBACK_RATES = buildCrossRates(FALLBACK_EUR);

let cachedRates: Record<string, number> | null = null;
let cacheTime = 0;
const CACHE_DURATION = 3600000;

export async function fetchECBRates(): Promise<Record<string, number>> {
  if (cachedRates && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedRates;
  }

  const symbols = ALL_CUR.filter(c => c !== 'EUR').join(',');

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/EUR`);
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    if (data.rates) {
      const eurRates: Record<Currency, number> = { EUR: 1 } as any;
      for (const c of ALL_CUR) {
        if (c !== 'EUR') eurRates[c] = data.rates[c] ?? FALLBACK_EUR[c];
      }
      cachedRates = buildCrossRates(eurRates);
      cacheTime = Date.now();
      return cachedRates;
    }
  } catch {}

  try {
    const res = await fetch(`https://api.exchangerate.host/latest?base=EUR&symbols=${symbols}`);
    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        const eurRates: Record<Currency, number> = { EUR: 1 } as any;
        for (const c of ALL_CUR) {
          if (c !== 'EUR') eurRates[c] = data.rates[c] ?? FALLBACK_EUR[c];
        }
        cachedRates = buildCrossRates(eurRates);
        cacheTime = Date.now();
        return cachedRates;
      }
    }
  } catch {}

  return FALLBACK_RATES;
}

export function getEurBasedRates(rates: Record<string, number>): Record<Currency, number> {
  const eurRates: Record<Currency, number> = { EUR: 1 } as any;
  for (const c of ALL_CUR) {
    eurRates[c] = rates[`EUR_${c}`] ?? FALLBACK_EUR[c];
  }
  return eurRates;
}

export function mergeRates(
  fetched: Record<string, number>,
  custom: Record<string, number | null>,
): Record<string, number> {
  const merged = { ...fetched };
  for (const [key, val] of Object.entries(custom)) {
    if (val != null && val > 0) merged[key] = val;
  }
  return merged;
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: Record<string, number>,
): number {
  if (from === to) return amount;
  const key = `${from}_${to}`;
  const rate = rates[key] ?? FALLBACK_RATES[key] ?? 1;
  return amount * rate;
}
