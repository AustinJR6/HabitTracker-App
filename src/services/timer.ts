import { getDb } from '../db';
import { getTimezone, ymd as ymdInTz } from '../utils/time';
import { Habit } from '../types/core';
import { cancelHabitNudges } from './nudges';

export async function startSession(habitId: string, tz?: string): Promise<string> {
  const db = getDb();
  const tzName = tz || (await getTimezone());
  const now = Date.now();
  const ymd = ymdInTz(new Date(now), tzName);
  const sessionId = (global as any).crypto?.randomUUID?.() ?? String(now + Math.random());
  const completionId = `${habitId}:${ymd}`;

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `INSERT INTO completions(id, habit_id, ymd, completed, completed_at, duration_sec)
           VALUES(?, ?, ?, COALESCE((SELECT completed FROM completions WHERE id=?), 0),
                  COALESCE((SELECT completed_at FROM completions WHERE id=?), NULL),
                  COALESCE((SELECT duration_sec FROM completions WHERE id=?), 0))
           ON CONFLICT(id) DO NOTHING;`,
          [completionId, habitId, ymd, completionId, completionId, completionId]
        );
        tx.executeSql(
          `INSERT INTO sessions(id, habit_id, ymd, started_at, stopped_at, duration_sec) VALUES(?, ?, ?, ?, ?, ?);`,
          [sessionId, habitId, ymd, now, now, 0]
        );
      },
      (e) => reject(e),
      () => resolve()
    );
  });

  return sessionId;
}

export async function stopSession(sessionId: string): Promise<number> {
  const db = getDb();
  const now = Date.now();
  let duration = 0;
  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `UPDATE sessions SET stopped_at=?, duration_sec=(? - started_at)/1000 WHERE id=?;`,
          [now, now, sessionId]
        );
        tx.executeSql(
          `SELECT habit_id, ymd, duration_sec FROM sessions WHERE id=?;`,
          [sessionId],
          (_t, rs) => {
            if (rs.rows.length > 0) {
              const row = rs.rows.item(0) as any;
              duration = Math.max(0, Math.floor(row.duration_sec));
              const compId = `${row.habit_id}:${row.ymd}`;
              // increment completion duration
              _t.executeSql(
                `UPDATE completions SET duration_sec = COALESCE(duration_sec,0) + ? WHERE id=?;`,
                [duration, compId]
              );
            }
          }
        );
      },
      (e) => reject(e),
      () => resolve()
    );
  });
  return duration;
}

export function canMarkComplete(habit: Habit, durationSecToday: number): boolean {
  if (habit.timerEnabled && habit.minRequiredMinutes) {
    return durationSecToday >= habit.minRequiredMinutes * 60;
  }
  return true;
}

export async function markComplete(habitId: string, tz?: string): Promise<void> {
  const db = getDb();
  const tzName = tz || (await getTimezone());
  const now = Date.now();
  const ymd = ymdInTz(new Date(now), tzName);
  const id = `${habitId}:${ymd}`;
  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `UPDATE completions SET completed=1, completed_at=? WHERE id=?;`,
          [now, id]
        );
      },
      (e) => reject(e),
      () => resolve()
    );
  });
  await cancelHabitNudges(habitId);
}

