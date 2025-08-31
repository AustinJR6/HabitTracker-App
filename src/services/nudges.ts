import * as Notifications from 'expo-notifications';
import dayjs from 'dayjs';
import { getDb, getSetting, setSetting } from '../db';
import { Habit } from '../types/core';
import { getTimezone, ymd as ymdInTz } from '../utils/time';

const MAP_KEY = 'nudge_schedule_ids';

async function getScheduleMap(): Promise<Record<string, string>> {
  try {
    const raw = await getSetting(MAP_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function setScheduleMap(map: Record<string, string>) {
  await setSetting(MAP_KEY, JSON.stringify(map));
}

export async function scheduleHabitNudge(habit: Habit, tz?: string) {
  if (!habit.nudgeEnabled || habit.archived) return;
  const db = getDb();
  const tzName = tz || (await getTimezone());

  if (habit.nudgeHour == null || habit.nudgeMinute == null) return;

  const now = dayjs();
  const targetToday = now.tz(tzName).hour(habit.nudgeHour).minute(habit.nudgeMinute).second(0).millisecond(0);
  const when = targetToday.isAfter(now) ? targetToday.toDate() : targetToday.add(1, 'day').toDate();

  const notifId = await Notifications.scheduleNotificationAsync({
    content: { title: 'Habit Reminder', body: habit.name },
    trigger: when,
  });

  const map = await getScheduleMap();
  map[habit.id] = notifId;
  await setScheduleMap(map);

  // Ensure today's completion row exists and store nudge_at for effectiveness
  const ymd = ymdInTz(new Date(), tzName);
  const id = `${habit.id}:${ymd}`;
  const nudgeAt = when.getTime();
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO completions(id, habit_id, ymd, completed, completed_at, duration_sec, nudge_at)
       VALUES(?, ?, ?, COALESCE((SELECT completed FROM completions WHERE id=?), 0),
              COALESCE((SELECT completed_at FROM completions WHERE id=?), NULL),
              COALESCE((SELECT duration_sec FROM completions WHERE id=?), 0),
              ?) 
       ON CONFLICT(id) DO UPDATE SET nudge_at=excluded.nudge_at;`,
      [id, habit.id, ymd, id, id, id, nudgeAt]
    );
  });
}

export async function cancelHabitNudges(habitId: string) {
  const map = await getScheduleMap();
  const id = map[habitId];
  if (id) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
    delete map[habitId];
    await setScheduleMap(map);
  }
}

export async function ensureDailyNotifications(tz?: string) {
  const db = getDb();
  const tzName = tz || (await getTimezone());
  await new Promise<void>((resolve, reject) => {
    db.readTransaction((tx) => {
      tx.executeSql(
        `SELECT id, name, cadence, archived, created_at, nudge_enabled, nudge_hour, nudge_minute, timer_enabled, min_required_minutes, default_session_minutes FROM habits WHERE archived = 0;`,
        [],
        async (_t, rs) => {
          const habits: Habit[] = [];
          for (let i = 0; i < rs.rows.length; i++) {
            const r = rs.rows.item(i) as any;
            habits.push({
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

          // cancel and reschedule
          const map = await getScheduleMap();
          for (const [hid, nid] of Object.entries(map)) {
            try { await Notifications.cancelScheduledNotificationAsync(nid); } catch {}
            delete map[hid];
          }
          await setScheduleMap(map);

          for (const h of habits) {
            await scheduleHabitNudge(h, tzName);
          }
          resolve();
        }
      );
    }, (e) => reject(e));
  });
}

