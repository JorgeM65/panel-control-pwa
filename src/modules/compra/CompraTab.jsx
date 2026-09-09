import { useState, useEffect, useRef } from 'react';
import { uid } from '../../utils/dates';

export function CompraTab({ items, onChange, onClearAll }) {
  const [text, setText] = useState('');
  const [checking, setChecking] = useState([]);
  const itemsRef = useRef(items);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => () => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
  }, []);

  function addItem() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange([...items, { id: uid(), text: trimmed }]);
    setText('');
  }

  function checkItem(id) {
    setChecking(c => [...c, id]);
    const t = setTimeout(() => {
      onChange(itemsRef.current.filter(i => i.id !== id));
      setChecking(c => c.filter(x => x !== id));
    }, 450);
    timeoutsRef.current.push(t);
  }

  function clearAll() {
    onClearAll();
  }

  return (
    <div className="module-panel">
      <div className="team-search-row">
        <input
          className="text-input"
          placeholder="Añadir a la lista…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        <button type="button" className="add-btn" onClick={addItem}>+</button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Lista vacía. Añade lo que necesites comprar.</div>
      ) : (
        <>
          <ul className="task-list">
            {items.map(it => (
              <li key={it.id} className={`task-item ${checking.includes(it.id) ? 'done' : ''}`}>
                <button type="button" className="checkbox" onClick={() => checkItem(it.id)} aria-label="Comprado">
                  {checking.includes(it.id) && <span>✓</span>}
                </button>
                <span className="task-text">{it.text}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="add-event-btn" onClick={clearAll}>Vaciar lista</button>
        </>
      )}
    </div>
  );
}
