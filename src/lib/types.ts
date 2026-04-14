export type Seniority = 'Junior Consultant' | 'Consultant' | 'Senior Consultant' | 'Manager' | 'Sr. Manager' | 'Managing Director/VP';
export type Country = 'Netherlands' | 'Belgium' | 'Germany' | 'UK' | 'Sweden' | 'Denmark' | 'Switzerland' | 'France' | 'Italy' | 'Spain' | 'Portugal' | 'Poland' | 'Russia' | 'USA' | 'Canada' | 'Mexico' | 'India' | 'China';

export const SENIORITY_LEVELS: Seniority[] = ['Junior Consultant', 'Consultant', 'Senior Consultant', 'Manager', 'Sr. Manager', 'Managing Director/VP'];
export const COUNTRIES: Country[] = ['Netherlands', 'Belgium', 'Germany', 'UK', 'Sweden', 'Denmark', 'Switzerland', 'France', 'Italy', 'Spain', 'Portugal', 'Poland', 'Russia', 'USA', 'Canada', 'Mexico', 'India', 'China'];

export const SENIORITY_EXPERIENCE: Record<Seniority, string> = {
  'Junior Consultant': '0-23 months',
  'Consultant': '24-47 months',
  'Senior Consultant': '48-71 months',
  'Manager': '72-107 months',
  'Sr. Manager': '108-179 months',
  'Managing Director/VP': '180+ months',
};

export type Currency = 'EUR' | 'GBP' | 'SEK' | 'USD' | 'DKK' | 'CHF' | 'RUB' | 'CAD' | 'MXN' | 'INR' | 'CNY';

export const COUNTRY_CURRENCY: Record<Country, Currency> = {
  Netherlands: 'EUR',
  Belgium: 'EUR',
  Germany: 'EUR',
  France: 'EUR',
  Italy: 'EUR',
  Spain: 'EUR',
  Portugal: 'EUR',
  Poland: 'EUR',
  UK: 'GBP',
  Sweden: 'SEK',
  Denmark: 'DKK',
  Switzerland: 'CHF',
  Russia: 'RUB',
  USA: 'USD',
  Canada: 'CAD',
  Mexico: 'MXN',
  India: 'INR',
  China: 'CNY',
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  GBP: '£',
  SEK: 'kr',
  USD: '$',
  DKK: 'kr',
  CHF: 'CHF',
  RUB: '₽',
  CAD: 'C$',
  MXN: 'MX$',
  INR: '₹',
  CNY: '¥',
};

export const ALL_CURRENCIES: Currency[] = ['EUR', 'GBP', 'SEK', 'USD', 'DKK', 'CHF', 'RUB', 'CAD', 'MXN', 'INR', 'CNY'];

export const COUNTRY_FLAGS: Record<Country, string> = {
  Netherlands: '🇳🇱',
  Belgium: '🇧🇪',
  Germany: '🇩🇪',
  UK: '🇬🇧',
  Sweden: '🇸🇪',
  Denmark: '🇩🇰',
  Switzerland: '🇨🇭',
  France: '🇫🇷',
  Italy: '🇮🇹',
  Spain: '🇪🇸',
  Portugal: '🇵🇹',
  Poland: '🇵🇱',
  Russia: '🇷🇺',
  USA: '🇺🇸',
  Canada: '🇨🇦',
  Mexico: '🇲🇽',
  India: '🇮🇳',
  China: '🇨🇳',
};

export type RateCard = Record<Seniority, Record<Country, number>>;

export interface Resource {
  id: string;
  name: string;
  seniority: Seniority;
  country: Country;
  allocationPercent: number;
  vacationWeeks: number[]; // week indices (0-based)
}

export interface ProjectConfig {
  name: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
}

export interface ProjectWeek {
  index: number;
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface ResourceCalculation {
  resourceId: string;
  weeklyBreakdown: { week: number; billableDays: number; billableHours: number; price: number }[];
  totalWorkingDays: number;
  totalWorkingHours: number;
  totalPrice: number;
}

export interface InvoiceRow {
  id: string;
  label: string;
  date: string; // ISO date
  percentOfTotal: number;
}
