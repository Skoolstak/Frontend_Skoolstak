import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { PageHeader, EmptyState, TermSelector, Spinner } from '../../components/shared';
import api from '../../services/api';
import { usePeriods, formatPeriod } from '../../services/periods';

const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

export default function StudentTimetable() {
  const { periods } = usePeriods();
  const [term,    setTerm]    = useState({ term:1, year: new Date().getFullYear() });
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/student/timetable', { params: term })
      .then(r => setSlots(r.data.slots || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [term]);

  function getSlot(day, period) {
    return slots.find(s => s.day === day && s.period === period);
  }

  return (
    <div>
      <PageHeader title="My Timetable" subtitle="Your weekly class schedule.">
        <TermSelector value={term} onChange={setTerm}/>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner/></div>
      ) : slots.length === 0 ? (
        <EmptyState icon={Calendar} title="No timetable yet" description="Your timetable hasn't been published for this term."/>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-charcoal-500 font-medium text-xs w-24">Period</th>
                {DAYS.map(d => <th key={d} className="py-2 px-2 text-charcoal-900 font-semibold text-xs text-center">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {periods.map((p, pi) => (
                <tr key={p.period} className={pi%2===0?'bg-sand-50':''}>
                  <td className="py-3 pr-4 text-xs font-medium whitespace-nowrap">
                    <span className="font-semibold text-charcoal-700">Period {p.period}</span>
                    <br/><span className="text-charcoal-400">{formatPeriod(p, true)}</span>
                  </td>
                  {DAYS.map(day => {
                    const slot = getSlot(day, p.period);
                    return (
                      <td key={day} className="py-1 px-2">
                        {slot ? (
                          <div className="p-2 rounded-xl bg-brand-gold/10 border border-brand-gold/20 text-center">
                            <p className="font-semibold text-xs text-charcoal-900">{slot.subject_name}</p>
                            <p className="text-xs text-charcoal-400 mt-0.5">{slot.teacher_name}</p>
                            {slot.start_time && <p className="text-xs text-charcoal-300">{slot.start_time}–{slot.end_time}</p>}
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center min-h-[2.5rem]"/>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
