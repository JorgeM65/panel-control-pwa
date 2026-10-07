// Partidos que todavía permiten hacer una predicción: no tienen ninguna
// predicción asociada (p.matchId === m.id) y aún no tienen marcador.
//
// Única fuente de verdad para PrediccionesTab y para el Home — los dos deben
// considerar exactamente los mismos partidos como "sin predicción".
//
// No compara fechas a propósito: footballMatches (useFootball) ya solo contiene
// partidos de hoy en hora local, así que una comparación propia aquí sería una
// segunda regla que podría acabar discrepando de la pestaña.
export function getMatchesWithoutPrediction(matches, predicciones) {
  const predictedIds = new Set(predicciones.map(p => p.matchId));
  return matches.filter(
    m => !predictedIds.has(m.id) && (m.homeScore === null || m.homeScore === '')
  );
}
