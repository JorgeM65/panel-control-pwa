import { useState } from 'react';
import { uid, nextOccurrence, daysUntil, yearsFor } from '../../utils/dates';

const TIPO_LABEL = { cumpleanos: 'Cumpleaños', aniversario: 'Aniversario', otro: 'Otro' };
const TIPO_ICON = { cumpleanos: '🎂', aniversario: '💫', otro: '📌' };

export function FechasTab({ fechas, onChange, onDelete }) {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [tipo, setTipo] = useState('cumpleanos');

  function addFecha() {
    const trimmed = nombre.trim();
    if (!trimmed || !fecha) return;
    onChange([...fechas, { id: uid(), nombre: trimmed, fecha, tipo }]);
    setNombre('');
    setFecha('');
  }

  function removeFecha(id) {
    onDelete(id);
  }

  const withDays = fechas
    .map(f => {
      const next = nextOccurrence(f.fecha);
      return { ...f, next, days: daysUntil(next), years: yearsFor(f.fecha, next) };
    })
    .sort((a, b) => a.days - b.days);

  return (
    <div className="module-panel">
      <div className="config-panel">
        <input className="text-input" placeholder="Nombre…" value={nombre} onChange={e => setNombre(e.target.value)} />
        <input className="text-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        <div className="chip-row">
          {Object.entries(TIPO_LABEL).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`toggle-chip ${tipo === key ? 'active' : ''}`}
              onClick={() => setTipo(key)}
            >
              {TIPO_ICON[key]} {label}
            </button>
          ))}
        </div>
        <button type="button" className="primary-btn" onClick={addFecha}>Añadir fecha</button>
      </div>

      {withDays.length === 0 ? (
        <div className="empty-state">Añade cumpleaños o aniversarios para no olvidarlos.</div>
      ) : (
        <ul className="fecha-list">
          {withDays.map(f => (
            <li key={f.id} className={`fecha-item ${f.days === 0 ? 'today' : ''}`}>
              <span className="fecha-icon">{TIPO_ICON[f.tipo]}</span>
              <div className="fecha-info">
                <span className="fecha-nombre">{f.nombre}</span>
                <span className="fecha-meta">
                  {f.days === 0 ? '¡Hoy!' : f.days === 1 ? 'Mañana' : `En ${f.days} días`}
                  {f.years !== null ? ` · ${f.years} años` : ''}
                </span>
              </div>
              <button type="button" className="remove-btn" onClick={() => removeFecha(f.id)} aria-label="Eliminar fecha">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
