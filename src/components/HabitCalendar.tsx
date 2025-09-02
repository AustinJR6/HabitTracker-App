import React from 'react';
import { Calendar, DateData } from 'react-native-calendars';
import dayjs from 'dayjs';
import { ISODate } from '../store/habits';
import { palette } from '../theme/palette';
import { useHabitsV2 } from '../hooks/useHabitsV2';
import { getLogsByDate } from '../storage';

export function HabitCalendar({ onSelectDate }: { onSelectDate: (iso: ISODate) => void }) {
  const { habits, dueHabits, refreshKey } = useHabitsV2();
  const [monthMarks, setMonthMarks] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const start = dayjs().startOf('month');
      const end = dayjs().endOf('month');
      const marks: Record<string, any> = {};
      for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
        const iso = d.format('YYYY-MM-DD') as ISODate;
        const due = dueHabits(iso);
        if (due.length === 0) continue;
        const logs = await getLogsByDate(iso);
        const allDone = due.length > 0 && due.every(h => logs.find(l => l.habitId === h.id)?.completed);
        marks[iso] = {
          customStyles: {
            container: { backgroundColor: allDone ? '#22c55e' : '#ef4444', borderRadius: 6 },
            text: { color: '#fff' },
          },
        };
      }
      if (!cancelled) setMonthMarks(marks);
    })();
    return () => { cancelled = true; };
  }, [habits, dueHabits, refreshKey]);

  return (
    <Calendar
      markingType="custom"
      markedDates={monthMarks}
      onDayPress={(d: DateData) => onSelectDate(d.dateString as ISODate)}
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
