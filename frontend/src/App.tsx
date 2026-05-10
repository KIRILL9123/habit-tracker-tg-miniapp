import { useMemo, useState } from "react";
import { HabitCard } from "./components/HabitCard";
import { HabitForm } from "./components/HabitForm";
import { ProgressBar } from "./components/ProgressBar";
import { useHabits } from "./hooks/useHabits";
import { formatDateISO } from "./utils/dateUtils";
import { isCompletedToday } from "./hooks/useStreak";

const App = () => {
  const [showForm, setShowForm] = useState(false);
  const {
    habits,
    loading,
    addHabit,
    toggleToday,
    removeHabit,
    error,
    clearError,
  } = useHabits();

  const completedToday = useMemo(() => {
    const today = formatDateISO();
    return habits.filter((habit) => isCompletedToday(habit, today)).length;
  }, [habits]);

  const handleAddHabit = async (payload: {
    name: string;
    emoji: string;
    reminderTime: string;
  }) => {
    await addHabit(payload);
    setShowForm(false);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg bg-tg-bg px-4 pb-24 pt-5 text-tg-text">
      <header className="mb-4 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Habit Tracker</h1>
        <p className="text-sm text-muted">
          Минималистичный трекер привычек в Telegram
        </p>
      </header>

      {error && (
        <div className="error-banner mb-3 p-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <p>{error}</p>
            <button
              type="button"
              onClick={clearError}
              className="text-xs text-muted hover:text-tg-text"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <ProgressBar completed={completedToday} total={habits.length} />

      <section className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-muted">Загрузка привычек...</p>
        ) : habits.length === 0 ? (
          <div className="card p-4 text-sm text-muted">
            У тебя пока нет привычек. Нажми на «+», чтобы добавить первую.
          </div>
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={toggleToday}
              onDelete={removeHabit}
            />
          ))
        )}
      </section>

      <button
        type="button"
        onClick={() => {
          clearError();
          setShowForm((prev) => !prev);
        }}
        className="btn-primary fixed bottom-6 right-6 z-10 flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-lg"
        aria-label="Добавить привычку"
      >
        +
      </button>

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/55 p-3 backdrop-blur-[1px]">
          <div className="w-full">
            <HabitForm
              onSubmit={handleAddHabit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default App;
