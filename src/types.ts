export type BadgeLabel = 'red' | 'yellow' | 'green' | 'blue';
export type BadgeTier = { minutes: number; label: BadgeLabel };

export type Habit = {
  id: string;
  name: string;
  days: number[]; // 0..6
  timed: boolean;
  minMinutes?: number;
  reminders?: string[]; // ["07:30 AM", ...]
  badgeTiers?: BadgeTier[]; // optional per-habit tiers
  reminderIds?: string[]; // expo-notification ids
};

export type HabitLog = {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean; // true for checkbox habits
  durationMinutes?: number; // cumulative minutes for timed habits for that day
  lastBadge?: BadgeLabel;
};

export type RunningTimer = {
  habitId: string;
  startedAt: string; // ISO timestamp
};
