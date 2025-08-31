import { useEffect, useState } from 'react';
import { getDailyCompletion, getNudgeEffectiveness, getTimeOfDayHistogram, getTimeOnTaskSeries } from '../selectors/insights';

export function useDailyCompletion(fromYmd: string, toYmd: string) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    getDailyCompletion(fromYmd, toYmd).then(setRows).catch(() => {});
  }, [fromYmd, toYmd]);
  return rows;
}

export function useTimeOfDay(habitId: string) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { getTimeOfDayHistogram(habitId).then(setRows).catch(() => {}); }, [habitId]);
  return rows;
}

export function useTimeOnTask(habitId: string | null, fromYmd: string, toYmd: string) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { getTimeOnTaskSeries(habitId, fromYmd, toYmd).then(setRows).catch(() => {}); }, [habitId, fromYmd, toYmd]);
  return rows;
}

export function useNudgeEffectiveness(habitId: string) {
  const [pct, setPct] = useState<number | null>(null);
  useEffect(() => { getNudgeEffectiveness(habitId).then(setPct).catch(() => {}); }, [habitId]);
  return pct;
}

