import { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { HabitLogV2, HabitV2, Weekday } from '../types/v2';
import { deleteHabitV2, getHabitsV2, getLogsByDateV2, logCompletionV2, setHabitsV2, upsertHabitV2 } from '../services/storageV2';

const DOW: Weekday[] = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function useHabitsV2() {
  const [habits, setHabits] = useState<HabitV2[]>([]);
  const [date, setDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [logs, setLogs] = useState<HabitLogV2[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const reloadHabits = useCallback(async () => {
    const arr = await getHabitsV2();
    setHabits(arr);
  }, []);

  const reloadLogs = useCallback(async (ymd: string) => {
    const arr = await getLogsByDateV2(ymd);
    setLogs(arr);
  }, []);

  useEffect(() => { reloadHabits(); }, [reloadHabits]);
  useEffect(() => { reloadLogs(date); }, [date, reloadLogs]);

  const addHabit = useCallback(async (h: HabitV2) => {
    await upsertHabitV2(h);
    await reloadHabits();
    setRefreshKey((v) => v + 1);
  }, [reloadHabits]);

  const updateHabit = useCallback(async (habitId: string, patch: Partial<HabitV2>) => {
    const curr = await getHabitsV2();
    const idx = curr.findIndex(x => x.habitId === habitId);
    if (idx < 0) return;
    const next = { ...curr[idx], ...patch } as HabitV2;
    await upsertHabitV2(next);
    await reloadHabits();
    setRefreshKey((v) => v + 1);
  }, [reloadHabits]);

  const removeHabit = useCallback(async (habitId: string) => {
    await deleteHabitV2(habitId);
    await reloadHabits();
    setRefreshKey((v) => v + 1);
  }, [reloadHabits]);

  const markCompleted = useCallback(async (params: { habitId: string; completed: boolean; duration?: number; badge?: string; ymd?: string; }) => {
    const ymd = params.ymd ?? date;
    await logCompletionV2({ date: ymd, habitId: params.habitId, completed: params.completed, duration: Math.max(0, Math.floor(params.duration ?? 0)), badge: params.badge });
    await reloadLogs(ymd);
    setRefreshKey((v) => v + 1);
  }, [date, reloadLogs]);

  const dueHabits = useCallback((ymd: string) => {
    const dow = DOW[dayjs(ymd).day()];
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
