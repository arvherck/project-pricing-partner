import { Currency } from './types';

// Fallback rates (approximate) — used if fetch fails
const FALLBACK_RATES: Record<string, number> = {
  'EUR_EUR': 1,
  'EUR_GBP': 0.86,
  'EUR_SEK': 11.20,
  'EUR_USD': 1.08,
  'GBP_EUR': 1.16,
  'GBP_GBP': 1,
  'GBP_SEK': 13.02,
  'GBP_USD': 1.26,
  'SEK_EUR': 0.089,
  'SEK_GBP': 0.077,
  'SEK_SEK': 1,
  'SEK_USD': 0.096,
  'USD_EUR': 0.93,
  'USD_GBP': 0.79,
  'USD_SEK': 10.37,
  'USD_USD': 1,
};

let cachedRates: Record<string, number> | null = null;
let cacheTime = 0;
const CACHE_DURATION = 3600000; // 1 hour

export async function fetchECBRates(): Promise<Record<string, number>> {
  if (cachedRates && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    // ECB daily rates (EUR-based)
    const res = await fetch('https://api.exchangerate.host/latest?base=EUR&symbols=GBP,SEK,USD');
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    
    if (data.rates) {
      const eurRates: Record<Currency, number> = {
        EUR: 1,
        GBP: data.rates.GBP,
        SEK: data.rates.SEK,
        USD: data.rates.USD,
      };

      // Build full cross-rate table
      const rates: Record<string, number> = {};
      const currencies: Currency[] = ['EUR', 'GBP', 'SEK', 'USD'];
      for (const from of currencies) {
        for (const to of currencies) {
          rates[`${from}_${to}`] = eurRates[to] / eurRates[from];
        }
      }
      cachedRates = rates;
      cacheTime = Date.now();
      return rates;
    }
  } catch {
    // Try alternative API
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/EUR');
      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
          const eurRates: Record<Currency, number> = {
            EUR: 1,
            GBP: data.rates.GBP,
            SEK: data.rates.SEK,
            USD: data.rates.USD,
          };
          const rates: Record<string, number> = {};
          const currencies: Currency[] = ['EUR', 'GBP', 'SEK', 'USD'];
          for (const from of currencies) {
            for (const to of currencies) {
              rates[`${from}_${to}`] = eurRates[to] / eurRates[from];
            }
          }
          cachedRates = rates;
          cacheTime = Date.now();
          return rates;
        }
      }
    } catch {}
  }

  return FALLBACK_RATES;
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
