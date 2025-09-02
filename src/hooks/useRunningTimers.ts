import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RunningTimer } from '../types';

const STORAGE_KEY = '@runningTimers';

type TimersMap = Record<string, RunningTimer | undefined>;

export function useRunningTimers() {
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

  const stopTimer = useCallback(async (habitId: string) => {
    const next: TimersMap = { ...runningTimers };
    delete next[habitId];
    setRunningTimers(next);
    await save(next);
  }, [runningTimers, save]);

  const getElapsedMs = useCallback((habitId: string) => {
    const rt = runningTimers[habitId];
    if (!rt) return 0;
    return Math.max(0, Date.now() - new Date(rt.startedAt).getTime());
  }, [runningTimers]);

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

  // Note: No auto-complete. Timers run until the user stops them.
  // This allows tracking actual time beyond the minimum.

  return { runningTimers, startTimer, stopTimer, getElapsedMs };
}
