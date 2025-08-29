import React from 'react';
import { Calendar, DateObject } from 'react-native-calendars';
import dayjs from 'dayjs';
import { useHabitStore, ISODate } from '../store/habits';
import { palette } from '../theme/palette';

export function HabitCalendar({ onSelectDate }: { onSelectDate: (iso: ISODate) => void }) {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const dayView = useHabitStore((s) => s.dayView);

  const monthMarks = React.useMemo(() => {
    const start = dayjs().startOf('month');
    const end = dayjs().endOf('month');
    const marks: Record<string, any> = {};
    for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
      const iso = d.format('YYYY-MM-DD') as ISODate;
      const { due, logs: dlogs } = dayView(iso);
      if (due.length === 0) continue; // no due habits that day
      const completed = due.every((h) => dlogs.find((l) => l.habitId === h.id)?.status === 'completed');
      marks[iso] = {
        customStyles: {
          container: { backgroundColor: completed ? '#22c55e' : '#ef4444', borderRadius: 6 },
          text: { color: '#fff' },
        },
      };
    }
    return marks;
  }, [habits, logs]);

  return (
    <Calendar
      markingType="custom"
      markedDates={monthMarks}
      onDayPress={(d: DateObject) => onSelectDate(d.dateString as ISODate)}
      theme={{
        backgroundColor: palette.bg,
        calendarBackground: palette.bg,
        dayTextColor: palette.text,
        monthTextColor: palette.text,
        textDisabledColor: palette.textDim,
        arrowColor: palette.text,
      }}
    />
  );
}

export default HabitCalendar;

