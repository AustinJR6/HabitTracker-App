import { useEffect, useState } from 'react';
import { Habit } from '../types';
import { computeStreaksV2, PerHabitStreaks } from '../utils/streaksV2';

export function useOverallStreakV2(habits: Habit[], refreshKey?: number) {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { overall } = await computeStreaksV2(habits);
      if (!cancelled) setStreak(overall);
    })();
    return () => { cancelled = true; };
  }, [habits, refreshKey]);
  return streak;
}

export function usePerHabitStreaksV2(habits: Habit[], refreshKey?: number) {
  const [streaks, setStreaks] = useState<PerHabitStreaks>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { perHabit } = await computeStreaksV2(habits);
      if (!cancelled) setStreaks(perHabit);
    })();
    return () => { cancelled = true; };
  }, [habits, refreshKey]);
  return streaks;
}
