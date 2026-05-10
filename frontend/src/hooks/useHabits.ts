import { useCallback, useEffect, useMemo, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { v4 as uuid } from "uuid";
import type { Habit, NewHabitInput } from "../types";
import { formatDateISO } from "../utils/dateUtils";
import {
  isCompletedToday,
  resetStreakIfMissed,
  toggleHabitToday,
} from "./useStreak";

const STORAGE_KEY = "habits";

const backendUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;

const toErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const hasCloudStorage = () => {
  return typeof WebApp !== "undefined" && Boolean(WebApp.CloudStorage);
};

const getCloudItem = async (key: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    WebApp.CloudStorage.getItem(key, (error, value) => {
      if (error) {
        reject(new Error(error));
        return;
      }

      resolve(value ?? null);
    });
  });
};

const setCloudItem = async (key: string, value: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    WebApp.CloudStorage.setItem(key, value, (error) => {
      if (error) {
        reject(new Error(error));
        return;
      }

      resolve();
    });
  });
};

const parseHabits = (raw: string | null): Habit[] => {
  if (!raw) {
    return [];
  }

  try {
    const data = JSON.parse(raw) as Habit[];

    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  } catch {
    return [];
  }
};

const loadHabitsFromStorage = async (): Promise<Habit[]> => {
  if (hasCloudStorage()) {
    const raw = await getCloudItem(STORAGE_KEY);
    return parseHabits(raw);
  }

  return parseHabits(localStorage.getItem(STORAGE_KEY));
};

const saveHabitsToStorage = async (habits: Habit[]): Promise<void> => {
  const payload = JSON.stringify(habits);

  if (hasCloudStorage()) {
    await setCloudItem(STORAGE_KEY, payload);
    return;
  }

  localStorage.setItem(STORAGE_KEY, payload);
};

const getTelegramUserId = (): number | null => {
  return WebApp.initDataUnsafe?.user?.id ?? null;
};

const requestOrThrow = async (
  input: RequestInfo | URL,
  init: RequestInit,
  fallbackMessage: string,
) => {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(fallbackMessage);
  }

  return response;
};

const postReminder = async (
  habit: Habit,
  completedToday: boolean,
  completedDate: string | null,
): Promise<void> => {
  if (!backendUrl) {
    return;
  }

  const telegramUserId = getTelegramUserId();

  if (!telegramUserId) {
    return;
  }

  await requestOrThrow(
    `${backendUrl}/reminder`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        habitId: habit.id,
        habitName: habit.name,
        reminderTime: habit.reminderTime,
        telegramUserId,
        completedToday,
        completedDate,
        timezoneOffset: new Date().getTimezoneOffset(),
      }),
    },
    "Не удалось обновить напоминание. Попробуй снова.",
  );
};

const deleteReminder = async (habitId: string): Promise<void> => {
  if (!backendUrl) {
    return;
  }

  const telegramUserId = getTelegramUserId();

  if (!telegramUserId) {
    return;
  }

  await requestOrThrow(
    `${backendUrl}/reminder/${habitId}?telegramUserId=${telegramUserId}`,
    {
      method: "DELETE",
    },
    "Не удалось удалить напоминание. Попробуй снова.",
  );
};

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const today = formatDateISO();
        const stored = await loadHabitsFromStorage();
        const normalized = stored.map((habit) =>
          resetStreakIfMissed(habit, today),
        );

        setHabits(normalized);
        await saveHabitsToStorage(normalized);
      } catch (err) {
        setError(
          toErrorMessage(
            err,
            "Не удалось загрузить привычки. Проверь соединение.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const persist = useCallback(async (next: Habit[]) => {
    setHabits(next);
    await saveHabitsToStorage(next);
  }, []);

  const addHabit = useCallback(
    async (payload: NewHabitInput) => {
      clearError();

      const previous = habits;
      const today = formatDateISO();

      const habit: Habit = {
        id: uuid(),
        name: payload.name,
        emoji: payload.emoji,
        reminderTime: payload.reminderTime,
        createdAt: today,
        streak: 0,
        bestStreak: 0,
        lastChecked: null,
        completedDates: [],
      };

      const next = [habit, ...habits];

      try {
        await persist(next);
        await postReminder(habit, false, null);
      } catch (err) {
        setHabits(previous);
        setError(
          toErrorMessage(err, "Не удалось добавить привычку. Попробуй снова."),
        );
      }
    },
    [clearError, habits, persist],
  );

  const toggleToday = useCallback(
    async (habitId: string) => {
      clearError();

      const previous = habits;
      const today = formatDateISO();
      let changedHabit: Habit | null = null;

      const next = habits.map((habit) => {
        if (habit.id !== habitId) {
          return habit;
        }

        const changed = toggleHabitToday(habit, today);
        changedHabit = changed;
        return changed;
      });

      try {
        await persist(next);

        if (changedHabit) {
          const doneToday = isCompletedToday(changedHabit, today);
          await postReminder(changedHabit, doneToday, doneToday ? today : null);
        }
      } catch (err) {
        setHabits(previous);
        setError(
          toErrorMessage(err, "Не удалось обновить привычку. Попробуй снова."),
        );
      }
    },
    [clearError, habits, persist],
  );

  const removeHabit = useCallback(
    async (habitId: string) => {
      clearError();

      const previous = habits;
      const next = habits.filter((habit) => habit.id !== habitId);

      try {
        await persist(next);
        await deleteReminder(habitId);
      } catch (err) {
        setHabits(previous);
        setError(
          toErrorMessage(err, "Не удалось удалить привычку. Попробуй снова."),
        );
      }
    },
    [clearError, habits, persist],
  );

  return useMemo(
    () => ({
      habits,
      loading,
      error,
      clearError,
      addHabit,
      toggleToday,
      removeHabit,
    }),
    [habits, loading, error, clearError, addHabit, toggleToday, removeHabit],
  );
};
