import { useState } from 'react';
import { uid, dateKey, formatShort, daysUntil } from '../../utils/dates';

export function CapsulaTab({ capsules, onChange, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [openDate, setOpenDate] = useState('');

  const todayKey = dateKey(new Date());

  function createCapsule() {
    if (!message.trim() || !openDate) return;
    onChange([...capsules, {
      id: uid(),
      message: message.trim(),
      sealedAt: todayKey,
      openDate,
      opened: false,
      openedAt: null,
    }]);
    setMessage('');
    setOpenDate('');
    setShowForm(false);
  }

  function openCapsule(id) {
    onChange(capsules.map(c => (c.id === id ? { ...c, opened: true, openedAt: todayKey } : c)));
  }

  function removeCapsule(id) {
    onDelete(id);
  }

  const sorted = [...capsules].sort((a, b) => a.openDate.localeCompare(b.openDate));

  return (
    <div className="module-panel">
      <div className="section-head">
        <span className="section-label">Cápsula del tiempo</span>
        <button type="button" className="gear-btn" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancelar' : '+ Nueva cápsula'}
        </button>
      </div>

      {showForm && (
        <div className="config-panel">
          <textarea
            className="text-input"
            placeholder="Escribe algo para tu yo del futuro…"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <input
            className="text-input"
            type="date"
            min={todayKey}
            value={openDate}
            onChange={e => setOpenDate(e.target.value)}
          />
          <button type="button" className="primary-btn" onClick={createCapsule}>Sellar cápsula</button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="empty-state">Escribe algo hoy y léelo dentro de un tiempo. Tu primera cápsula te espera.</div>
      ) : (
        <ul className="capsule-list">
          {sorted.map(c => {
            const days = daysUntil(c.openDate);
            const ready = days <= 0;
            return (
              <li key={c.id} className={`capsule-item ${c.opened ? 'opened' : ready ? 'ready' : 'sealed'}`}>
                {c.opened ? (
                  <>
                    <p className="capsule-message">{c.message}</p>
                    <span className="capsule-meta">Escrita el {formatShort(c.sealedAt)} · abierta el {formatShort(c.openedAt)}</span>
                  </>
                ) : ready ? (
                  <>
                    <span className="capsule-meta">🔓 Lista desde el {formatShort(c.openDate)}</span>
                    <button type="button" className="primary-btn" onClick={() => openCapsule(c.id)}>Abrir cápsula</button>
                  </>
                ) : (
                  <span className="capsule-meta">🔒 Se abre el {formatShort(c.openDate)} · {days} días</span>
                )}
                <button type="button" className="remove-btn capsule-remove" onClick={() => removeCapsule(c.id)} aria-label="Eliminar cápsula">×</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
