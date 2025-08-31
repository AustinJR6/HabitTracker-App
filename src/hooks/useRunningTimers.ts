import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HabitV2, RunningTimer } from '../types/v2';

const STORAGE_KEY = '@runningTimers';

type TimersMap = Record<string, RunningTimer | undefined>;

export function useRunningTimers(
  opts: {
    habits?: HabitV2[];
    onAutoComplete?: (habitId: string, minutes: number, badge?: string) => void;
  } = {}
) {
  const { habits = [], onAutoComplete } = opts;
  const [runningTimers, setRunningTimers] = useState<TimersMap>({});
  const [tick, setTick] = useState(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  const save = useCallback(async (map: TimersMap) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch {}
  }, []);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setRunningTimers(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const startTimer = useCallback(async (habitId: string) => {
    const next: TimersMap = { ...runningTimers, [habitId]: { habitId, startedAt: new Date().toISOString() } };
    setRunningTimers(next);
    await save(next);
  }, [runningTimers, save]);

  const stopTimer = useCallback(async (habitId: string, opts?: { saveAsCompleted?: boolean; minutesOverride?: number; badge?: string }) => {
    const rt = runningTimers[habitId];
    const next: TimersMap = { ...runningTimers };
    delete next[habitId];
    setRunningTimers(next);
    await save(next);
    if (opts?.saveAsCompleted) {
      const elapsedMs = opts?.minutesOverride != null ? opts.minutesOverride * 60000 : (rt ? Date.now() - new Date(rt.startedAt).getTime() : 0);
      const minutes = Math.max(0, Math.round(elapsedMs / 60000));
      onAutoComplete?.(habitId, minutes, opts?.badge);
    }
  }, [runningTimers, save, onAutoComplete]);

  const getElapsedMs = useCallback((habitId: string) => {
    const rt = runningTimers[habitId];
    if (!rt) return 0;
    return Math.max(0, Date.now() - new Date(rt.startedAt).getTime());
  }, [runningTimers]);

  const computeBadge = useCallback((habit: HabitV2, minutes: number) => {
    if (!habit.milestones || habit.milestones.length === 0) return undefined;
    const eligible = habit.milestones.filter(m => minutes >= m.minutes).sort((a,b)=> b.minutes - a.minutes)[0];
    return eligible?.badge;
  }, []);

  // Ticker management with AppState
  useEffect(() => {
    const hasRunning = Object.keys(runningTimers).length > 0;
    const ensureInterval = () => {
      if (!intervalRef.current && hasRunning && appState.current === 'active') {
        intervalRef.current = setInterval(() => setTick(t => t + 1), 1000);
      }
    };
    const clearIntervalIfAny = () => {
      if (intervalRef.current) { clearInterval(intervalRef.current as any); intervalRef.current = null; }
    };

    const sub = AppState.addEventListener('change', (next) => {
      appState.current = next;
      if (next === 'active') ensureInterval(); else clearIntervalIfAny();
    });

    ensureInterval();
    return () => { sub.remove(); clearIntervalIfAny(); };
  }, [runningTimers]);

  // Auto-complete when elapsed >= minTime
  useEffect(() => {
    const entries = Object.values(runningTimers).filter(Boolean) as RunningTimer[];
    for (const rt of entries) {
      const h = habits.find(x => x.habitId === rt.habitId);
      if (!h || !h.useTimer || !h.minTime) continue;
      const elapsedMs = Date.now() - new Date(rt.startedAt).getTime();
      if (elapsedMs >= h.minTime * 60000) {
        const minutes = Math.max(0, Math.round(elapsedMs / 60000));
        const badge = computeBadge(h, minutes);
        stopTimer(rt.habitId, { saveAsCompleted: true, minutesOverride: minutes, badge });
      }
    }
    // re-run every tick
  }, [tick, runningTimers, habits, computeBadge, stopTimer]);

  return { runningTimers, startTimer, stopTimer, getElapsedMs };
}

