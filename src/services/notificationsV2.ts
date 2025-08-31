import * as Notifications from 'expo-notifications';
import dayjs from 'dayjs';
import { getHabitsV2, getLogsByDateV2 } from './storageV2';

export async function scheduleV2DailyReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}

  const habits = await getHabitsV2();
  const iso = dayjs().format('YYYY-MM-DD');
  const logs = await getLogsByDateV2(iso);

  for (const h of habits) {
    if (!h.notificationTime) continue;
    const done = logs.find(l => l.habitId === h.habitId)?.completed;
    if (done) continue;
    const when = dayjs().hour(h.notificationTime.hour).minute(h.notificationTime.minute).second(0);
    const target = when.isAfter(dayjs()) ? when.toDate() : when.add(1,'day').toDate();
    try {
      await Notifications.scheduleNotificationAsync({ content: { title: 'Habit Reminder', body: h.name }, trigger: { date: target } as any });
    } catch {}
  }
}
