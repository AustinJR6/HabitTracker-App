import { useEffect, useState } from 'react';
import { getDb } from '../db';
import { Habit } from '../types/core';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  useEffect(() => {
    const db = getDb();
    db.readTransaction((tx) => {
      tx.executeSql(
        `SELECT id, name, cadence, archived, created_at, nudge_enabled, nudge_hour, nudge_minute, timer_enabled, min_required_minutes, default_session_minutes FROM habits;`,
        [],
        (_t, rs) => {
          const arr: Habit[] = [];
          for (let i = 0; i < rs.rows.length; i++) {
            const r = rs.rows.item(i) as any;
            arr.push({
              id: r.id,
              name: r.name,
              cadence: r.cadence,
              archived: !!r.archived,
              createdAt: r.created_at,
              nudgeEnabled: !!r.nudge_enabled,
              nudgeHour: r.nudge_hour ?? undefined,
              nudgeMinute: r.nudge_minute ?? undefined,
              timerEnabled: !!r.timer_enabled,
              minRequiredMinutes: r.min_required_minutes ?? undefined,
              defaultSessionMinutes: r.default_session_minutes ?? undefined,
            });
          }
          setHabits(arr);
        }
      );
    });
  }, []);
  return habits;
}

