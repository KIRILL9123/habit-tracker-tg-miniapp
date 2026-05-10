import type { Habit } from "../types";
import { formatDateISO } from "../utils/dateUtils";
import { isCompletedToday } from "../hooks/useStreak";

type HabitCardProps = {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export const HabitCard = ({ habit, onToggle, onDelete }: HabitCardProps) => {
  const doneToday = isCompletedToday(habit, formatDateISO());

  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-tg-text sm:text-lg">
            <span className="mr-2">{habit.emoji}</span>
            {habit.name}
          </p>
          <p className="mt-1 text-sm text-muted">
            🔥 {habit.streak} дней · Рекорд: {habit.bestStreak}
          </p>
          <p className="mt-1 text-xs text-muted">
            Напоминание: {habit.reminderTime}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onDelete(habit.id)}
            className="rounded-lg px-2 py-1 text-xs text-tg-destructive transition hover:bg-white/10"
          >
            Удалить
          </button>
          <button
            type="button"
            onClick={() => onToggle(habit.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tg-button ${
              doneToday
                ? "border-transparent bg-tg-button text-tg-buttonText"
                : "border-white/20 bg-transparent text-tg-text hover:bg-white/10"
            }`}
            aria-pressed={doneToday}
            aria-label={
              doneToday ? "Отметить как не выполнено" : "Отметить как выполнено"
            }
          >
            {doneToday ? "✓" : ""}
          </button>
        </div>
      </div>
    </article>
  );
};
