import { Country } from './types';

export interface NamedHoliday {
  date: Date;
  name: string;
}

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

function getNamedHolidaysForYear(country: Country, year: number): NamedHoliday[] {
  const easter = getEasterDate(year);
  const holidays: NamedHoliday[] = [];
  const add = (m: number, d: number, name: string) => holidays.push({ date: new Date(year, m - 1, d), name });
  const addD = (date: Date, name: string) => holidays.push({ date, name });

  switch (country) {
    case 'Netherlands':
      add(1, 1, "New Year's Day");
      addD(addDays(easter, -2), 'Good Friday');
      addD(easter, 'Easter Sunday');
      addD(addDays(easter, 1), 'Easter Monday');
      add(4, 27, "King's Day");
      add(5, 5, 'Liberation Day');
      addD(addDays(easter, 39), 'Ascension Day');
      addD(addDays(easter, 49), 'Whit Sunday');
      addD(addDays(easter, 50), 'Whit Monday');
      add(12, 25, 'Christmas Day');
      add(12, 26, 'Second Christmas Day');
      break;
    case 'Belgium':
      add(1, 1, "New Year's Day");
      addD(addDays(easter, 1), 'Easter Monday');
      add(5, 1, 'Labour Day');
      addD(addDays(easter, 39), 'Ascension Day');
      addD(addDays(easter, 50), 'Whit Monday');
      add(7, 21, 'National Day');
      add(8, 15, 'Assumption');
      add(11, 1, "All Saints' Day");
      add(11, 11, 'Armistice Day');
      add(12, 25, 'Christmas Day');
      break;
    case 'Germany':
      add(1, 1, "New Year's Day");
      addD(addDays(easter, -2), 'Good Friday');
      addD(addDays(easter, 1), 'Easter Monday');
      add(5, 1, 'Labour Day');
      addD(addDays(easter, 39), 'Ascension Day');
      addD(addDays(easter, 50), 'Whit Monday');
      add(10, 3, 'German Unity Day');
      add(12, 25, 'Christmas Day');
      add(12, 26, 'Second Christmas Day');
      break;
    case 'UK':
      add(1, 1, "New Year's Day");
      addD(addDays(easter, -2), 'Good Friday');
      addD(addDays(easter, 1), 'Easter Monday');
      { const d = new Date(year, 4, 1); d.setDate(d.getDate() + ((8 - d.getDay()) % 7)); addD(d, 'Early May Bank Holiday'); }
      { const d = new Date(year, 4, 31); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); addD(d, 'Spring Bank Holiday'); }
      { const d = new Date(year, 7, 31); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); addD(d, 'Summer Bank Holiday'); }
      add(12, 25, 'Christmas Day');
      add(12, 26, 'Boxing Day');
      break;
    case 'Sweden':
      add(1, 1, "New Year's Day");
      add(1, 6, 'Epiphany');
      addD(addDays(easter, -2), 'Good Friday');
      addD(addDays(easter, 1), 'Easter Monday');
      add(5, 1, 'Labour Day');
      addD(addDays(easter, 39), 'Ascension Day');
      add(6, 6, 'National Day');
      { const d = new Date(year, 5, 19); while (d.getDay() !== 5) d.setDate(d.getDate() + 1); addD(new Date(d), 'Midsommar'); }
      add(12, 24, 'Christmas Eve');
      add(12, 25, 'Christmas Day');
      add(12, 26, 'Second Christmas Day');
      add(12, 31, "New Year's Eve");
      break;
    case 'Denmark':
      add(1, 1, "New Year's Day");
      addD(addDays(easter, -3), 'Maundy Thursday');
      addD(addDays(easter, -2), 'Good Friday');
      addD(addDays(easter, 1), 'Easter Monday');
      addD(addDays(easter, 26), 'General Prayer Day');
      addD(addDays(easter, 39), 'Ascension Day');
      addD(addDays(easter, 50), 'Whit Monday');
      add(6, 5, 'Constitution Day');
      add(12, 24, 'Christmas Eve');
      add(12, 25, 'Christmas Day');
      add(12, 26, 'Second Christmas Day');
      break;
    case 'Switzerland':
      add(1, 1, "New Year's Day");
      add(1, 2, "Berchtold's Day");
      addD(addDays(easter, -2), 'Good Friday');
      addD(addDays(easter, 1), 'Easter Monday');
      addD(addDays(easter, 39), 'Ascension Day');
      addD(addDays(easter, 50), 'Whit Monday');
      add(8, 1, 'National Day');
      add(12, 25, 'Christmas Day');
      add(12, 26, "St. Stephen's Day");
      break;
    case 'France':
      add(1, 1, "New Year's Day");
      addD(addDays(easter, 1), 'Easter Monday');
      add(5, 1, 'Labour Day');
      add(5, 8, 'Victory in Europe Day');
      addD(addDays(easter, 39), 'Ascension Day');
      addD(addDays(easter, 50), 'Whit Monday');
      add(7, 14, 'Bastille Day');
      add(8, 15, 'Assumption');
      add(11, 1, "All Saints' Day");
      add(11, 11, 'Armistice Day');
      add(12, 25, 'Christmas Day');
      break;
    case 'Italy':
      add(1, 1, "New Year's Day");
      add(1, 6, 'Epiphany');
      addD(addDays(easter, 1), 'Easter Monday');
      add(4, 25, 'Liberation Day');
      add(5, 1, 'Labour Day');
      add(6, 2, 'Republic Day');
      add(8, 15, 'Ferragosto');
      add(11, 1, "All Saints' Day");
      add(12, 8, 'Immaculate Conception');
      add(12, 25, 'Christmas Day');
      add(12, 26, "St. Stephen's Day");
      break;
    case 'Spain':
      add(1, 1, "New Year's Day");
      add(1, 6, 'Epiphany');
      addD(addDays(easter, -2), 'Good Friday');
      add(5, 1, 'Labour Day');
      add(8, 15, 'Assumption');
      add(10, 12, 'National Day');
      add(11, 1, "All Saints' Day");
      add(12, 6, 'Constitution Day');
      add(12, 8, 'Immaculate Conception');
      add(12, 25, 'Christmas Day');
      break;
    case 'Portugal':
      add(1, 1, "New Year's Day");
      addD(addDays(easter, -2), 'Good Friday');
      addD(addDays(easter, 1), 'Easter Monday');
      add(4, 25, 'Freedom Day');
      add(5, 1, 'Labour Day');
      add(6, 10, 'Portugal Day');
      add(8, 15, 'Assumption');
      add(10, 5, 'Republic Day');
      add(11, 1, "All Saints' Day");
      add(12, 1, 'Restoration of Independence');
      add(12, 8, 'Immaculate Conception');
      add(12, 25, 'Christmas Day');
      break;
    case 'Poland':
      add(1, 1, "New Year's Day");
      add(1, 6, 'Epiphany');
      addD(addDays(easter, 1), 'Easter Monday');
      add(5, 1, 'Labour Day');
      add(5, 3, 'Constitution Day');
      addD(addDays(easter, 60), 'Corpus Christi');
      add(8, 15, 'Assumption');
      add(11, 1, "All Saints' Day");
      add(11, 11, 'Independence Day');
      add(12, 25, 'Christmas Day');
      add(12, 26, 'Second Christmas Day');
      break;
    case 'Russia':
      add(1, 1, "New Year's Day");
      add(1, 2, 'New Year Holiday');
      add(1, 3, 'New Year Holiday');
      add(1, 7, 'Orthodox Christmas');
      add(2, 23, 'Defender of the Fatherland');
      add(3, 8, "International Women's Day");
      add(5, 1, 'Labour Day');
      add(5, 9, 'Victory Day');
      add(6, 12, 'Russia Day');
      add(11, 4, 'Unity Day');
      break;
    case 'USA':
      add(1, 1, "New Year's Day");
      { const d = new Date(year, 0, 1); d.setDate(1 + ((8 - d.getDay()) % 7) + 14); addD(d, 'MLK Day'); }
      { const d = new Date(year, 1, 1); d.setDate(1 + ((8 - d.getDay()) % 7) + 14); addD(d, "Presidents' Day"); }
      { const d = new Date(year, 4, 31); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); addD(d, 'Memorial Day'); }
      add(7, 4, 'Independence Day');
      { const d = new Date(year, 8, 1); d.setDate(1 + ((8 - d.getDay()) % 7)); addD(d, 'Labor Day'); }
      { const d = new Date(year, 10, 1); d.setDate(1 + ((11 - d.getDay()) % 7) + 21); addD(d, 'Thanksgiving'); }
      add(12, 25, 'Christmas Day');
      break;
    case 'Canada':
      add(1, 1, "New Year's Day");
      { const d = new Date(year, 1, 1); d.setDate(1 + ((8 - d.getDay()) % 7) + 14); addD(d, 'Family Day'); }
      addD(addDays(easter, -2), 'Good Friday');
      { const d = new Date(year, 4, 25); while (d.getDay() !== 1) d.setDate(d.getDate() - 1); addD(new Date(d), 'Victoria Day'); }
      add(7, 1, 'Canada Day');
      { const d = new Date(year, 8, 1); d.setDate(1 + ((8 - d.getDay()) % 7)); addD(d, 'Labour Day'); }
      add(10, 31, 'Halloween'); // not statutory but commonly observed — remove if desired
      add(12, 25, 'Christmas Day');
      add(12, 26, 'Boxing Day');
      break;
    case 'Mexico':
      add(1, 1, "New Year's Day");
      { const d = new Date(year, 1, 1); d.setDate(1 + ((8 - d.getDay()) % 7)); addD(d, 'Constitution Day'); }
      { const d = new Date(year, 2, 1); d.setDate(1 + ((8 - d.getDay()) % 7) + 14); addD(d, "Benito Juárez's Birthday"); }
      add(5, 1, 'Labour Day');
      add(9, 16, 'Independence Day');
      { const d = new Date(year, 10, 1); d.setDate(1 + ((8 - d.getDay()) % 7) + 14); addD(d, 'Revolution Day'); }
      add(12, 25, 'Christmas Day');
      break;
    case 'India':
      add(1, 26, 'Republic Day');
      add(8, 15, 'Independence Day');
      add(10, 2, 'Gandhi Jayanti');
      add(5, 1, 'Labour Day');
      add(12, 25, 'Christmas Day');
      // Major variable holidays approximated
      add(1, 14, 'Makar Sankranti');
      add(3, 25, 'Holi');
      add(11, 1, 'Diwali');
      add(4, 14, 'Ambedkar Jayanti');
      break;
    case 'China':
      add(1, 1, "New Year's Day");
      // Chinese New Year (approx late Jan/early Feb)
      add(1, 29, 'Chinese New Year');
      add(1, 30, 'Chinese New Year');
      add(1, 31, 'Chinese New Year');
      add(4, 5, 'Qingming Festival');
      add(5, 1, 'Labour Day');
      add(6, 22, 'Dragon Boat Festival');
      add(9, 29, 'Mid-Autumn Festival');
      add(10, 1, 'National Day');
      add(10, 2, 'National Day');
      add(10, 3, 'National Day');
      break;
  }
  return holidays;
}

export function getHolidaysInRange(country: Country, start: Date, end: Date): Date[] {
  return getNamedHolidaysInRange(country, start, end).map(h => h.date);
}

export function getNamedHolidaysInRange(country: Country, start: Date, end: Date): NamedHoliday[] {
  const years = new Set<number>();
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) years.add(y);

  const all: NamedHoliday[] = [];
  years.forEach(y => {
    getNamedHolidaysForYear(country, y).forEach(h => {
      if (h.date >= start && h.date <= end) all.push(h);
    });
  });
  return all;
}

export function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some(h =>
    h.getFullYear() === date.getFullYear() &&
    h.getMonth() === date.getMonth() &&
    h.getDate() === date.getDate()
  );
}
