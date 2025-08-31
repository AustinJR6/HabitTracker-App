import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import dayjs from 'dayjs';
import { Habit, HabitLog, ISODate } from '../store/habits';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    // Added for iOS behavior keys in newer SDKs
    shouldShowBanner: true as any,
    shouldShowList: true as any,
  }) as any,
} as any);

export async function ensureNotifPermissions() {
  try {
    if (!Device.isDevice) return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch {}
}

function hhmmToDate(time: string) {
  const [hh, mm] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
}

export async function scheduleTodayReminders(habits: Habit[], logs: HabitLog[]) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const iso = dayjs().format('YYYY-MM-DD') as ISODate;
    const dow = dayjs().day();

    for (const h of habits) {
      if (h.archivedAt) continue;
      const due = h.frequency === 'daily' || h.daysOfWeek?.includes(dow);
      if (!due) continue;

      const done = logs.find((l) => l.habitId === h.id && l.date === iso)?.status === 'completed';
      if (done) continue;

      for (const t of h.reminders ?? []) {
        const when = hhmmToDate(t);
        if (when.getTime() <= Date.now()) continue;
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Habit Reminder', body: h.name },
          trigger: { type: 'date', date: when } as any,
        });
      }
    }

    // Evening nudge 8:30pm
    const cutoff = dayjs().hour(20).minute(30).second(0).toDate();
    const pendingCount = habits.filter((h) => h.frequency === 'daily' || h.daysOfWeek?.includes(dow)).length;
    if (pendingCount > 0 && cutoff.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Evening nudge', body: 'You still have habits to finish — quick win time.' },
        trigger: { type: 'date', date: cutoff } as any,
      });
    }
  } catch {}
}




