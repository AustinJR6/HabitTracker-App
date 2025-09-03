import { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { Habit, HabitLog, BadgeLabel } from '../types';
import { deleteHabit, getHabits, getLogsByDate, logHabit, upsertHabit } from '../storage';
import { cancelReminderIds } from '../lib/reminders';

export function useHabitsV2() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [date, setDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const reloadHabits = useCallback(async () => {
    const arr = await getHabits();
    setHabits(arr);
  }, []);

  const reloadLogs = useCallback(async (ymd: string) => {
    const arr = await getLogsByDate(ymd);
    setLogs(arr);
  }, []);

  useEffect(() => { reloadHabits(); }, [reloadHabits]);
  useEffect(() => { reloadLogs(date); }, [date, reloadLogs]);

  const addHabit = useCallback(async (h: Habit) => {
    await upsertHabit(h);
    await reloadHabits();
    setRefreshKey((v) => v + 1);
  }, [reloadHabits]);

  const updateHabit = useCallback(async (habitId: string, patch: Partial<Habit>) => {
    const curr = await getHabits();
    const idx = curr.findIndex(x => x.id === habitId);
    if (idx < 0) return;
    const next = { ...curr[idx], ...patch } as Habit;
    await upsertHabit(next);
    await reloadHabits();
    setRefreshKey((v) => v + 1);
  }, [reloadHabits]);

  const removeHabit = useCallback(async (habitId: string) => {
    const h = habits.find(h => h.id === habitId);
    if (h?.reminderIds?.length) await cancelReminderIds(h.reminderIds);
    await deleteHabit(habitId);
    await reloadHabits();
    setRefreshKey((v) => v + 1);
  }, [habits, reloadHabits]);

  const markCompleted = useCallback(async (params: { habitId: string; completed: boolean; durationMinutes?: number; countValue?: number; badge?: BadgeLabel; ymd?: string; }) => {
    const ymd = params.ymd ?? date;
    const id = `${params.habitId}-${ymd}`;
    await logHabit({
      id,
      date: ymd,
      habitId: params.habitId,
      completed: params.completed,
      durationMinutes: Math.max(0, Math.floor(params.durationMinutes ?? 0)),
      countValue: Math.max(0, Math.floor(params.countValue ?? 0)),
      lastBadge: params.badge,
    });
    await reloadLogs(ymd);
    setRefreshKey((v) => v + 1);
  }, [date, reloadLogs]);

  const dueHabits = useCallback((ymd: string) => {
    const dow = dayjs(ymd).day();
    return habits.filter(h => h.days.includes(dow));
  }, [habits]);

  const statusOf = useCallback((habitId: string) => {
    return logs.find(l => l.habitId === habitId)?.completed ?? false;
  }, [logs]);

  return {
    date, setDate,
    habits, logs,
    reloadHabits, reloadLogs,
    addHabit, updateHabit, removeHabit, markCompleted,
    dueHabits, statusOf,
    refreshKey,
  };
}
