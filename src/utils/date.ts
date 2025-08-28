import dayjs from 'dayjs';

export const getTodayKey = (): string => dayjs().format('YYYY-MM-DD');
