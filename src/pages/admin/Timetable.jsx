import React, { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { PageHeader, SelectField, EmptyState } from '../../components/shared';
import api from '../../services/api';

const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const PERIODS = [1,2,3,4,5,6,7,8];

const PERIOD_LABELS = {
  1: '7:30 – 8:15',
  2: '8:15 – 9:00',
  3: '9:00 – 9:45',
  4: '9:45 – 10:30',
  5: '10:45 – 11:30', // after break
  6: '11:30 – 12:15',
  7: '12:15 – 1:00',
  8: '2:00 – 2:45',
};

export default function TimetablePage() {
  const [classes,   setClasses]   = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [slots,     setSlots]     = useState([]);
  const [classId,   setClassId]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [editCell,  setEditCell]  = useState(null); // { day, period }
  const [cellForm,  setCellForm]  = useState({ subject: '', teacher_id: '', room: '' });
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    api.get('/classes').then(r => { const list = r.data.classes||[]; setClasses(list); if(list.length) setClassId(list[0].id); });
    api.get('/staff').then(r => setTeachers((r.data.staff||[]).filter(t => t.role==='teacher')));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if(classId) loadSlots(); }, [classId]);

  async function loadSlots() {
    setLoading(true);
    try { const { data } = await api.get(`/timetable?class_id=${classId}`); setSlots(data.slots||[]); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  }

  function getSlot(day, period) {
    return slots.find(s => s.day === day && s.period === period);
  }

  function openEdit(day, period) {
    const s = getSlot(day, period);
    setCellForm({ subject: s?.subject||'', teacher_id: s?.teacher_id||'', room: s?.room||'' });
    setEditCell({ day, period });
  }

  async function handleSaveCell(e) {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/timetable', { class_id: classId, day: editCell.day, period: editCell.period, ...cellForm });
      loadSlots(); setEditCell(null);
    } catch(err) { console.error(err); } finally { setSaving(false); }
  }

  async function handleClearCell(day, period) {
    const s = getSlot(day, period);
    if(!s) return;
    try { await api.delete(`/timetable/${s.id}`); loadSlots(); }
    catch(e) { console.error(e); }
  }

  return (
    <div>
      <PageHeader title="Timetable" subtitle="Build and manage class schedules." />

      {/* Class selector */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-charcoal-700">Class:</label>
        <SelectField value={classId} onChange={e => setClassId(e.target.value)}
          options={classes.map(c => ({ value: c.id, label: c.name }))} className="w-48" />
      </div>

      {!classId ? (
        <EmptyState icon={CalendarDays} title="Select a class" description="Choose a class to view or edit its timetable." />
      ) : loading ? (
        <div className="card animate-pulse h-64" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-sand-200">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-charcoal-500 w-28">Period</th>
                {DAYS.map(d => (
                  <th key={d} className="text-left px-3 py-2.5 text-xs font-semibold text-charcoal-500">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(period => (
                <tr key={period} className="border-b border-sand-100">
                  <td className="px-3 py-3 text-xs text-charcoal-500 whitespace-nowrap">
                    <span className="font-semibold text-charcoal-700">P{period}</span><br/>
                    <span>{PERIOD_LABELS[period]}</span>
                  </td>
                  {DAYS.map(day => {
                    const slot = getSlot(day, period);
                    return (
                      <td key={day} className="px-2 py-2">
                        {slot ? (
                          <div
                            className="bg-brand-gold/10 border border-brand-gold/20 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-brand-gold/20 transition-colors"
                            onClick={() => openEdit(day, period)}
                          >
                            <p className="font-semibold text-charcoal-900 text-xs">{slot.subject}</p>
                            {slot.teacher_name && <p className="text-xs text-charcoal-500">{slot.teacher_name}</p>}
                            {slot.room && <p className="text-xs text-charcoal-400">{slot.room}</p>}
                          </div>
                        ) : (
                          <button
                            onClick={() => openEdit(day, period)}
                            className="w-full h-14 rounded-lg border border-dashed border-sand-300 text-charcoal-300 hover:border-brand-gold hover:text-brand-gold transition-colors text-xs"
                          >+ Add</button>
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

      {/* Edit cell modal */}
      {editCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm" onClick={() => setEditCell(null)} />
          <div className="relative bg-white rounded-2xl shadow-card-hover w-full max-w-sm p-6">
            <h3 className="font-bold text-charcoal-900 mb-4">{editCell.day} — Period {editCell.period}</h3>
            <form onSubmit={handleSaveCell} className="space-y-3">
              <div>
                <label className="label">Subject <span className="text-danger">*</span></label>
                <input className="input-field" value={cellForm.subject} onChange={e => setCellForm(f=>({...f,subject:e.target.value}))} required placeholder="E.g. Mathematics" />
              </div>
              <div>
                <label className="label">Teacher</label>
                <SelectField value={cellForm.teacher_id} onChange={e => setCellForm(f=>({...f,teacher_id:e.target.value}))}
                  options={teachers.map(t => ({ value: t.user_profile_id, label: `${t.first_name} ${t.last_name}` }))} placeholder="Select teacher…" />
              </div>
              <div>
                <label className="label">Room</label>
                <input className="input-field" value={cellForm.room} onChange={e => setCellForm(f=>({...f,room:e.target.value}))} placeholder="E.g. Room 4A" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={() => { handleClearCell(editCell.day, editCell.period); setEditCell(null); }}
                  className="text-sm text-danger hover:underline">Clear Slot</button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditCell(null)} className="btn-secondary text-sm">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                    {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
