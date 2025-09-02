import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from '../types';

export async function scheduleHabitReminders(habit: Habit) {
  if (!habit.reminders?.length) return [] as string[];
  const ids: string[] = [];
  for (const r of habit.reminders) {
    const [time, mer] = r.split(' ');
    const [hh, mm] = time.split(':').map(Number);
    const hour24 = mer === 'PM' ? (hh % 12) + 12 : hh % 12;
    for (const dow of habit.days) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Habbit Tracker',
          body: `“${habit.name}” reminder`,
          sound: Platform.select({ ios: 'default', android: true as any }),
        },
        trigger: { weekday: dow + 1, hour: hour24, minute: mm, repeats: true } as any,
      });
      ids.push(id);
    }
  }
  return ids;
}

export async function cancelReminderIds(ids: string[]) {
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
}
