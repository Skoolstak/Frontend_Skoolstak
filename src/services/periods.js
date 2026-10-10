import { useCallback, useEffect, useState } from 'react';
import api from './api';

// Standard times, used until a school saves its own (and if the times cannot be loaded).
export const DEFAULT_PERIODS = [
  [1, '06:00', '06:45'], [2, '06:45', '07:30'], [3, '07:30', '08:15'], [4, '08:15', '09:00'],
  [5, '09:15', '10:00'], [6, '10:00', '10:45'], [7, '10:45', '11:30'], [8, '12:30', '13:15'],
  [9, '13:15', '14:00'], [10, '14:00', '14:45'], [11, '15:00', '18:00'],
].map(([period, start_time, end_time]) => ({ period, start_time, end_time }));

// "06:00 – 06:45" (or "06:00–06:45" when compact)
export function formatPeriod(p, compact = false) {
  if (!p) return '';
  return compact ? `${p.start_time}–${p.end_time}` : `${p.start_time} – ${p.end_time}`;
}

// The school's period times for every timetable screen. Always returns usable times.
export function usePeriods() {
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);

  const reload = useCallback(async () => {
    try {
      const { data } = await api.get('/timetable/periods');
      if (Array.isArray(data.periods) && data.periods.length > 0) setPeriods(data.periods);
    } catch (e) {
      console.error('Could not load period times, showing the standard times.', e);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { periods, reload };
}
