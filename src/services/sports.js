// Comunicación HTTP con TheSportsDB. La clave "123" es la clave pública de
// pruebas del propio servicio (documentada como de uso libre), no un secreto.
//
// Ninguna de estas llamadas comprobaba res.ok en el código original, así que
// tampoco lo hacen aquí — devuelven el JSON tal cual, y es el consumidor quien
// decide qué campos leer (data.events, data.results, data.table...) exactamente
// como antes.

const BASE = 'https://www.thesportsdb.com/api/v1/json/123';

// Usado por App.jsx (fetchFootball) para los partidos de una liga en un día.
export async function getEventsByDay(dateStr, leagueId) {
  const res = await fetch(`${BASE}/eventsday.php?d=${dateStr}&l=${leagueId}`);
  return res.json();
}

// Usado por App.jsx (fetchFootball) para los próximos partidos de un equipo.
export async function getEventsNextForTeam(teamId) {
  const res = await fetch(`${BASE}/eventsnext.php?id=${teamId}`);
  return res.json();
}

// Usado por EstadisticasTab para la forma reciente de un equipo.
export async function getEventsLastForTeam(teamId) {
  const res = await fetch(`${BASE}/eventslast.php?id=${teamId}`);
  return res.json();
}

// Usado por EstadisticasTab para la clasificación de una liga.
export async function getLeagueTable(leagueId) {
  const res = await fetch(`${BASE}/lookuptable.php?l=${leagueId}`);
  return res.json();
}

// Usado por PrediccionesTab para comprobar el resultado final de un partido.
export async function getEventById(eventId) {
  const res = await fetch(`${BASE}/lookupevent.php?id=${eventId}`);
  return res.json();
}

// Usado por AjustesTab para buscar equipos por nombre.
export async function searchTeams(query) {
  const res = await fetch(`${BASE}/searchteams.php?t=${encodeURIComponent(query)}`);
  return res.json();
}
