import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { PageHeader, SelectField, EmptyState, TermSelector, Spinner } from '../../components/shared';
import api from '../../services/api';

const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const PERIODS = ['Period 1','Period 2','Period 3','Period 4','Period 5','Period 6','Period 7','Period 8'];

export default function TeacherTimetable() {
  const [term,    setTerm]    = useState({ term:1, year: new Date().getFullYear() });
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/teacher/classes', { params: term })
      .then(r => { setClasses(r.data.classes||[]); setClassId(''); })
      .catch(console.error);
  }, [term]);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    api.get(`/timetable`, { params: { class_id: classId, ...term } })
      .then(r => setSlots(r.data.slots || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [classId, term]);

  function getSlot(day, period) {
    return slots.find(s => s.day === day && s.period === period);
  }

  return (
    <div>
      <PageHeader title="Timetable" subtitle="View class schedules for the term."/>

      <div className="card mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div><label className="block text-xs font-medium text-charcoal-500 mb-1">Term</label><TermSelector value={term} onChange={setTerm} inline/></div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-charcoal-500 mb-1">Class</label>
            <SelectField value={classId} onChange={e=>setClassId(e.target.value)} options={classes.map(c=>({value:c.id,label:c.name}))} placeholder="Select class…"/>
          </div>
        </div>
      </div>

      {!classId ? (
        <EmptyState icon={Calendar} title="Select a class" description="Choose a class to view its timetable."/>
      ) : loading ? (
        <div className="flex justify-center py-16"><Spinner/></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-charcoal-500 font-medium text-xs w-24">Period</th>
                {DAYS.map(d => (
                  <th key={d} className="py-2 px-2 text-charcoal-900 font-semibold text-xs text-center">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period, pi) => (
                <tr key={period} className={pi%2===0?'bg-sand-50':''}>
                  <td className="py-3 pr-4 text-xs text-charcoal-500 font-medium">{period}</td>
                  {DAYS.map(day => {
                    const slot = getSlot(day, pi+1);
                    return (
                      <td key={day} className="py-1 px-2">
                        {slot ? (
                          <div className="p-2 rounded-xl bg-brand-gold/10 border border-brand-gold/20 text-center">
                            <p className="font-semibold text-xs text-charcoal-900 leading-tight">{slot.subject_name}</p>
                            {slot.start_time && <p className="text-xs text-charcoal-400 mt-0.5">{slot.start_time}–{slot.end_time}</p>}
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center">
                            <span className="text-xs text-charcoal-300">—</span>
                          </div>
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
