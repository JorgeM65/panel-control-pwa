import { useState, useEffect, useRef } from 'react';
import { uid } from '../../utils/dates';
import { RULETA_COLORS } from '../../constants';

export function RuletaTab({ items, onChange, onDelete }) {
  const [text, setText] = useState('');
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  function addItem() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange([...items, { id: uid(), text: trimmed }]);
    setText('');
  }

  function removeItem(id) {
    onDelete(id);
  }

  function spin() {
    if (items.length < 2 || spinning) return;
    setWinner(null);
    setSpinning(true);

    // El ganador se decide aquí, con Math.random() puro — cada opción tiene
    // exactamente 1 entre N de probabilidad, sin memoria de giros anteriores.
    // La animación de abajo solo calcula cuánto girar para SEÑALAR ese
    // resultado ya decidido; nunca al revés.
    const n = items.length;
    const winnerIndex = Math.floor(Math.random() * n);
    const segmentSize = 360 / n;
    const jitter = (Math.random() - 0.5) * segmentSize * 0.7;
    const targetAngle = (winnerIndex + 0.5) * segmentSize + jitter;
    const theta = (360 - targetAngle + 360) % 360;
    const currentAngle = rotation % 360;
    const forwardDelta = (theta - currentAngle + 360) % 360;
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const newRotation = rotation + forwardDelta + 360 * fullSpins;

    setRotation(newRotation);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setWinner(items[winnerIndex]);
      setSpinning(false);
    }, 4200);
  }

  const segmentSize = items.length > 0 ? 360 / items.length : 360;
  const gradient = items.length > 0
    ? `conic-gradient(${items.map((it, i) => `${RULETA_COLORS[i % RULETA_COLORS.length]} ${i * segmentSize}deg ${(i + 1) * segmentSize}deg`).join(', ')})`
    : 'var(--item-bg)';

  return (
    <div className="module-panel">
      <div className="team-search-row">
        <input
          className="text-input"
          placeholder="Añadir opción…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        <button type="button" className="add-btn" onClick={addItem}>+</button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Añade al menos dos opciones para poder girar la ruleta.</div>
      ) : (
        <>
          <div className="wheel-wrap">
            <div className="wheel-pointer" />
            <div className="wheel" style={{ background: gradient, transform: `rotate(${rotation}deg)` }} />
          </div>

          <button
            type="button"
            className="primary-btn wheel-spin-btn"
            onClick={spin}
            disabled={items.length < 2 || spinning}
          >
            {spinning ? 'Girando…' : 'Girar'}
          </button>

          {items.length < 2 && (
            <div className="empty-state">Añade al menos una opción más para girar.</div>
          )}

          {winner && !spinning && (
            <div className="wheel-result">
              <span className="wheel-result-label">Ha salido</span>
              <span className="wheel-result-text">{winner.text}</span>
            </div>
          )}

          <ul className="wheel-list">
            {items.map((it, i) => (
              <li key={it.id} className="wheel-list-item">
                <span className="wheel-swatch" style={{ background: RULETA_COLORS[i % RULETA_COLORS.length] }} />
                <span className="wheel-list-text">{it.text}</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeItem(it.id)}
                  disabled={spinning}
                  aria-label="Quitar opción"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
