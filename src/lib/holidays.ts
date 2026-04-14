import { Country } from './types';

// Easter calculation (Anonymous Gregorian algorithm)
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getHolidaysForYear(country: Country, year: number): Date[] {
  const easter = getEasterDate(year);
  const holidays: Date[] = [];

  const add = (m: number, d: number) => holidays.push(new Date(year, m - 1, d));

  switch (country) {
    case 'Netherlands':
      add(1, 1); // New Year
      holidays.push(addDays(easter, -2)); // Good Friday
      holidays.push(easter); // Easter Sunday
      holidays.push(addDays(easter, 1)); // Easter Monday
      add(4, 27); // King's Day
      add(5, 5); // Liberation Day
      holidays.push(addDays(easter, 39)); // Ascension
      holidays.push(addDays(easter, 49)); // Whit Sunday
      holidays.push(addDays(easter, 50)); // Whit Monday
      add(12, 25); add(12, 26); // Christmas
      break;
    case 'Belgium':
      add(1, 1);
      holidays.push(addDays(easter, 1)); // Easter Monday
      add(5, 1); // Labour Day
      holidays.push(addDays(easter, 39)); // Ascension
      holidays.push(addDays(easter, 50)); // Whit Monday
      add(7, 21); // National Day
      add(8, 15); // Assumption
      add(11, 1); // All Saints
      add(11, 11); // Armistice
      add(12, 25);
      break;
    case 'Germany':
      add(1, 1);
      holidays.push(addDays(easter, -2)); // Good Friday
      holidays.push(addDays(easter, 1)); // Easter Monday
      add(5, 1); // Labour Day
      holidays.push(addDays(easter, 39)); // Ascension
      holidays.push(addDays(easter, 50)); // Whit Monday
      add(10, 3); // German Unity
      add(12, 25); add(12, 26);
      break;
    case 'UK':
      add(1, 1);
      holidays.push(addDays(easter, -2)); // Good Friday
      holidays.push(addDays(easter, 1)); // Easter Monday
      // Early May bank holiday (first Monday of May)
      { const d = new Date(year, 4, 1); d.setDate(d.getDate() + ((8 - d.getDay()) % 7)); holidays.push(d); }
      // Spring bank holiday (last Monday of May)
      { const d = new Date(year, 4, 31); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); holidays.push(d); }
      // Summer bank holiday (last Monday of August)
      { const d = new Date(year, 7, 31); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); holidays.push(d); }
      add(12, 25); add(12, 26);
      break;
    case 'Sweden':
      add(1, 1); add(1, 6); // New Year, Epiphany
      holidays.push(addDays(easter, -2)); // Good Friday
      holidays.push(addDays(easter, 1)); // Easter Monday
      add(5, 1); // Labour Day
      holidays.push(addDays(easter, 39)); // Ascension
      add(6, 6); // National Day
      // Midsummer (Friday between June 19-25)
      { const d = new Date(year, 5, 19); while (d.getDay() !== 5) d.setDate(d.getDate() + 1); holidays.push(new Date(d)); }
      add(12, 24); add(12, 25); add(12, 26); add(12, 31);
      break;
    case 'USA':
      add(1, 1); // New Year
      // MLK Day (3rd Monday of January)
      { const d = new Date(year, 0, 1); d.setDate(1 + ((8 - d.getDay()) % 7) + 14); holidays.push(d); }
      // Presidents Day (3rd Monday of February)
      { const d = new Date(year, 1, 1); d.setDate(1 + ((8 - d.getDay()) % 7) + 14); holidays.push(d); }
      // Memorial Day (last Monday of May)
      { const d = new Date(year, 4, 31); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); holidays.push(d); }
      add(7, 4); // Independence Day
      // Labor Day (1st Monday of September)
      { const d = new Date(year, 8, 1); d.setDate(1 + ((8 - d.getDay()) % 7)); holidays.push(d); }
      // Thanksgiving (4th Thursday of November)
      { const d = new Date(year, 10, 1); d.setDate(1 + ((11 - d.getDay()) % 7) + 21); holidays.push(d); }
      add(12, 25);
      break;
  }
  return holidays;
}

export function getHolidaysInRange(country: Country, start: Date, end: Date): Date[] {
  const years = new Set<number>();
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) years.add(y);

  const allHolidays: Date[] = [];
  years.forEach(y => {
    getHolidaysForYear(country, y).forEach(h => {
      if (h >= start && h <= end) allHolidays.push(h);
    });
  });
  return allHolidays;
}

export function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some(h =>
    h.getFullYear() === date.getFullYear() &&
    h.getMonth() === date.getMonth() &&
    h.getDate() === date.getDate()
  );
}
