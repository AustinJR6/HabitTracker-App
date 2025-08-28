import { Habit, HabitId } from '../utils/types';

export const habits: Habit[] = [
  { id: 'morning_mandarin', label: 'Morning Mandarin' },
  { id: 'morning_workout', label: 'Morning Workout' },
  { id: 'evening_mandarin', label: 'Evening Mandarin' },
  { id: 'evening_workout', label: 'Evening Workout' },
  { id: 'lab_hour', label: 'Lab Hour' },
];

export const allFalseHabitsState: Record<HabitId, boolean> = habits.reduce(
  (acc, habit) => {
    acc[habit.id] = false;
    return acc;
  },
  {} as Record<HabitId, boolean>
);
