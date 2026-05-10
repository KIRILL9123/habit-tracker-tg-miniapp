import type { Habit } from "../types";
import {
  formatDateISO,
  getDateDistanceInDays,
  isYesterday,
  trimToLast30Dates,
  uniqSortDates,
} from "../utils/dateUtils";

const getLatestDate = (dates: string[]): string | null => {
  const sorted = uniqSortDates(dates);

  if (sorted.length === 0) {
    return null;
  }

  return sorted[sorted.length - 1] ?? null;
};

export const isCompletedToday = (
  habit: Habit,
  today: string = formatDateISO(),
): boolean => {
  return habit.completedDates.includes(today);
};

export const calculateCurrentStreak = (
  dates: string[],
  today: string = formatDateISO(),
): number => {
  const sorted = uniqSortDates(dates);

  if (sorted.length === 0) {
    return 0;
  }

  const latest = sorted[sorted.length - 1];

  if (!(latest === today || isYesterday(latest, today))) {
    return 0;
  }

  let streak = 1;
  let cursor = latest;

  for (let i = sorted.length - 2; i >= 0; i -= 1) {
    const current = sorted[i];
    const diff = getDateDistanceInDays(current, cursor);

    if (diff !== 1) {
      break;
    }

    streak += 1;
    cursor = current;
  }

  return streak;
};

export const resetStreakIfMissed = (
  habit: Habit,
  today: string = formatDateISO(),
): Habit => {
  const trimmedDates = trimToLast30Dates(habit.completedDates);
  const latest = getLatestDate(trimmedDates);

  if (!latest || latest === today || isYesterday(latest, today)) {
    return {
      ...habit,
      completedDates: trimmedDates,
      lastChecked: latest,
    };
  }

  return {
    ...habit,
    streak: 0,
    completedDates: trimmedDates,
    lastChecked: latest,
  };
};

export const toggleHabitToday = (
  habit: Habit,
  today: string = formatDateISO(),
): Habit => {
  const doneToday = isCompletedToday(habit, today);

  if (doneToday) {
    const nextDates = trimToLast30Dates(
      habit.completedDates.filter((date) => date !== today),
    );
    const nextStreak = calculateCurrentStreak(nextDates, today);
    const lastChecked = getLatestDate(nextDates);

    return {
      ...habit,
      completedDates: nextDates,
      streak: nextStreak,
      lastChecked,
    };
  }

  const nextDates = trimToLast30Dates([...habit.completedDates, today]);
  const previousChecked = habit.lastChecked;

  let nextStreak = 1;

  if (previousChecked === today) {
    nextStreak = habit.streak;
  } else if (previousChecked && isYesterday(previousChecked, today)) {
    nextStreak = habit.streak + 1;
  }

  const bestStreak = Math.max(habit.bestStreak, nextStreak);

  return {
    ...habit,
    completedDates: nextDates,
    streak: nextStreak,
    bestStreak,
    lastChecked: today,
  };
};
