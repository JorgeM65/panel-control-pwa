import { useState, useEffect } from 'react';
import { dateKey } from '../utils/dates';
import { getEventById } from '../services/sports';

// calcPoints se recibe como parámetro a propósito: es lógica de negocio pura
// que sigue viviendo en PrediccionesTab.jsx (no se mueve aquí), el hook solo
// se ocupa de qué predicciones están pendientes, pedir el resultado remoto y
// devolver la lista actualizada.
export function usePredictions(predicciones, onChange, refreshSignal, calcPoints) {
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    async function resolvePending() {
      const todayKey = dateKey(new Date());
      const pending = predicciones.filter(p => !p.resolved && p.date < todayKey);
      if (pending.length === 0) return;
      setResolving(true);
      const updated = [...predicciones];
      for (const p of pending) {
        try {
          const data = await getEventById(p.matchId);
          const ev = data.events && data.events[0];
          if (ev && ev.intHomeScore !== null && ev.intHomeScore !== undefined) {
            const actualHome = Number(ev.intHomeScore);
            const actualAway = Number(ev.intAwayScore);
            const points = calcPoints(p.predHome, p.predAway, actualHome, actualAway);
            const idx = updated.findIndex(u => u.id === p.id);
            if (idx !== -1) updated[idx] = { ...p, resolved: true, actualHome, actualAway, points };
          }
        } catch (e) { /* se reintenta la próxima vez */ }
      }
      onChange(updated);
      setResolving(false);
    }
    resolvePending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  return { resolving };
}
