export type HabitId =
  | 'morning_mandarin'
  | 'morning_workout'
  | 'evening_mandarin'
  | 'evening_workout'
  | 'lab_hour';

export type Habit = { id: HabitId; label: string };

export type AppStateShape = {
  streak: number;
  currentDateKey: string;
  habits: Record<HabitId, boolean>;
  dayCompleted: boolean;
};
