const DAY_MS = 24 * 60 * 60 * 1000;

export const formatDateISO = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseISODate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const shiftISODate = (value: string, days: number): string => {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return formatDateISO(date);
};

export const isYesterday = (value: string, today: string = formatDateISO()): boolean => {
  return value === shiftISODate(today, -1);
};

export const getDateDistanceInDays = (from: string, to: string): number => {
  const a = parseISODate(from).getTime();
  const b = parseISODate(to).getTime();
  return Math.round((b - a) / DAY_MS);
};

export const uniqSortDates = (dates: string[]): string[] => {
  return [...new Set(dates)].sort((a, b) => parseISODate(a).getTime() - parseISODate(b).getTime());
};

export const trimToLast30Dates = (dates: string[]): string[] => {
  const sorted = uniqSortDates(dates);
  return sorted.slice(Math.max(sorted.length - 30, 0));
};
