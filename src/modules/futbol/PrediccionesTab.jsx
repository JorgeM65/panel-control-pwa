import { useState } from 'react';
import { uid, dateKey } from '../../utils/dates';
import { usePredictions } from '../../hooks/usePredictions';

// Sigue viviendo aquí a propósito (punto 10 del criterio de hooks): es lógica
// de negocio pura, no comunicación HTTP ni ciclo de vida React. El hook la
// recibe como parámetro en vez de poseerla.
function calcPredictionPoints(predHome, predAway, actualHome, actualAway) {
  if (predHome === actualHome && predAway === actualAway) return 3;
  const predOutcome = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
  const actualOutcome = actualHome > actualAway ? 'home' : actualHome < actualAway ? 'away' : 'draw';
  return predOutcome === actualOutcome ? 1 : 0;
}

export function PrediccionesTab({ predicciones, footballMatches, onChange, onDelete, refreshSignal }) {
  const [drafts, setDrafts] = useState({});
  const { resolving } = usePredictions(predicciones, onChange, refreshSignal, calcPredictionPoints);

  const todayKey = dateKey(new Date());
  const predictedIds = new Set(predicciones.map(p => p.matchId));
  const todayMatches = footballMatches.filter(
    m => !predictedIds.has(m.id) && (m.homeScore === null || m.homeScore === '')
  );

  function setDraft(matchId, field, value) {
    setDrafts(d => ({ ...d, [matchId]: { ...d[matchId], [field]: value.replace(/\D/g, '') } }));
  }

  function savePrediction(match) {
    const draft = drafts[match.id];
    if (!draft || draft.home === '' || draft.away === undefined || draft.away === '') return;
    onChange([...predicciones, {
      id: uid(),
      matchId: match.id,
      home: match.home,
      away: match.away,
      competition: match.competition,
      date: match.date,
      predHome: Number(draft.home),
      predAway: Number(draft.away),
      resolved: false,
      actualHome: null,
      actualAway: null,
      points: null,
    }]);
    setDrafts(d => {
      const next = { ...d };
      delete next[match.id];
      return next;
    });
  }

  function removePrediction(id) {
    onDelete(id);
  }

  const resolved = predicciones.filter(p => p.resolved);
  const totalPoints = resolved.reduce((sum, p) => sum + (p.points || 0), 0);
  const exactCount = resolved.filter(p => p.points === 3).length;
  const outcomeCount = resolved.filter(p => p.points === 1).length;
  const accuracy = resolved.length === 0 ? 0 : Math.round(((exactCount + outcomeCount) / resolved.length) * 100);

  const sortedPredicciones = [...predicciones].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="module-panel">
      <div className="stat-grid">
        <div className="stat-box tech-frame">
          <span className="stat-value">{totalPoints}</span>
          <span className="stat-label">Puntos</span>
        </div>
        <div className="stat-box tech-frame">
          <span className="stat-value">{exactCount}</span>
          <span className="stat-label">Marcador exacto</span>
        </div>
        <div className="stat-box tech-frame">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">Acierto</span>
        </div>
      </div>

      {todayMatches.length > 0 && (
        <div className="dash-section">
          <span className="section-label">Partidos de hoy sin predicción</span>
          <ul className="wheel-list">
            {todayMatches.map(m => (
              <li key={m.id} className="wheel-list-item pred-row">
                <span className="wheel-list-text">{m.home} - {m.away}</span>
                <input
                  className="text-input tiny"
                  inputMode="numeric"
                  value={drafts[m.id]?.home || ''}
                  onChange={e => setDraft(m.id, 'home', e.target.value)}
                />
                <span className="score-sep">–</span>
                <input
                  className="text-input tiny"
                  inputMode="numeric"
                  value={drafts[m.id]?.away || ''}
                  onChange={e => setDraft(m.id, 'away', e.target.value)}
                />
                <button type="button" className="add-btn" onClick={() => savePrediction(m)}>✓</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dash-section">
        <span className="section-label">Tus predicciones{resolving ? ' · comprobando…' : ''}</span>
        {predicciones.length === 0 ? (
          <div className="empty-state">Configura ligas o equipos favoritos en Ajustes y predice tus primeros marcadores.</div>
        ) : (
          <ul className="wheel-list">
            {sortedPredicciones.map(p => (
              <li key={p.id} className="wheel-list-item pred-result-row">
                <div className="pred-result-info">
                  <span className="wheel-list-text">{p.home} {p.predHome}-{p.predAway} {p.away}</span>
                  <span className="fecha-meta">
                    {p.resolved
                      ? `Final ${p.actualHome}-${p.actualAway} · ${p.points === 3 ? '🎯 exacto (+3)' : p.points === 1 ? '✓ resultado (+1)' : '✗ fallo'}`
                      : 'Pendiente de jugarse'}
                  </span>
                </div>
                <button type="button" className="remove-btn" onClick={() => removePrediction(p.id)} aria-label="Eliminar predicción">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
