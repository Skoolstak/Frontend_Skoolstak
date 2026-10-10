import React, { useEffect, useState } from 'react';
import api from '../services/api';

const KEY = 'parentChildId';

// Loads the parent's children and remembers which one is selected, so every parent page shows the same child.
export function useParentChild() {
  const [children, setChildren] = useState([]);
  const [childId, setChildIdState] = useState(() => localStorage.getItem(KEY) || '');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.get('/parent/children')
      .then((r) => {
        const list = r.data.children || [];
        setChildren(list);
        setChildIdState((cur) => (list.some((c) => c.id === cur) ? cur : list[0]?.id || ''));
      })
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const setChildId = (id) => {
    localStorage.setItem(KEY, id);
    setChildIdState(id);
  };

  return { children, childId, setChildId, ready };
}

export function ChildPicker({ kids, childId, onChange }) {
  if (kids.length < 2) return null;
  return (
    <div className="mb-4 flex items-center gap-2">
      <label className="text-sm text-charcoal-500">Child</label>
      <select className="input-field w-auto text-sm" value={childId} onChange={(e) => onChange(e.target.value)}>
        {kids.map((c) => (
          <option key={c.id} value={c.id}>{c.name}{c.class_name ? ` — ${c.class_name}` : ''}</option>
        ))}
      </select>
    </div>
  );
}
