import { useState } from 'react';
import { uid, dateKey, formatShort } from '../../utils/dates';

export function NotasTab({ notas, onChange, onDelete }) {
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  function addNota() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange([{ id: uid(), text: trimmed, updatedAt: dateKey(new Date()) }, ...notas]);
    setText('');
  }

  function removeNota(id) {
    onDelete(id);
  }

  function startEdit(n) {
    setEditingId(n.id);
    setEditText(n.text);
  }
  function cancelEdit() {
    setEditingId(null);
  }
  function saveEdit(id) {
    const trimmed = editText.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    onChange(notas.map(n => (n.id === id ? { ...n, text: trimmed, updatedAt: dateKey(new Date()) } : n)));
    setEditingId(null);
  }

  return (
    <div className="module-panel">
      <div className="add-row">
        <textarea
          className="text-input"
          placeholder="Escribe una nota…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="button" className="primary-btn nota-add-btn" onClick={addNota}>Añadir nota</button>
      </div>

      {notas.length === 0 ? (
        <div className="empty-state">Sin notas todavía. Apunta lo primero que se te ocurra.</div>
      ) : (
        <ul className="nota-list">
          {notas.map(n => (
            <li key={n.id} className="nota-item">
              {editingId === n.id ? (
                <div className="task-edit-row">
                  <textarea className="text-input" value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                  <div className="task-edit-actions">
                    <button type="button" className="ghost-btn" onClick={cancelEdit}>Cancelar</button>
                    <button type="button" className="primary-btn" onClick={() => saveEdit(n.id)}>Guardar</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="nota-text">{n.text}</p>
                  <div className="nota-foot">
                    <span className="nota-date">{formatShort(n.updatedAt)}</span>
                    <button type="button" className="edit-btn" onClick={() => startEdit(n)} aria-label="Editar nota">✎</button>
                    <button type="button" className="remove-btn" onClick={() => removeNota(n.id)} aria-label="Eliminar nota">×</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
