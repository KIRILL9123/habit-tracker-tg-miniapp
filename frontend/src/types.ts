export type Habit = {
  id: string;
  name: string;
  emoji: string;
  reminderTime: string;
  createdAt: string;
  streak: number;
  bestStreak: number;
  lastChecked: string | null;
  completedDates: string[];
};

export type NewHabitInput = {
  name: string;
  emoji: string;
  reminderTime: string;
};
