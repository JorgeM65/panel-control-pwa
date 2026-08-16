// Utilidades puras de fecha, extraídas tal cual de App.jsx (Fase 2).
// Ninguna depende de useState/useEffect/DOM/fetch — mismo resultado para los
// mismos argumentos siempre. No se ha cambiado ninguna implementación.

import { DIAS, MESES, MESES3 } from '../constants';

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// TheSportsDB devuelve dateEvent/strTime en UTC. Los convertimos a hora local
// del dispositivo — y ojo, la FECHA también puede cambiar (un partido a las
// 23:30 UTC puede caer ya en el día siguiente en España).
export function utcToLocal(dateEvent, strTime) {
  if (!strTime) return { time: '', date: dateEvent };
  const utcDate = new Date(`${dateEvent}T${strTime}Z`);
  if (isNaN(utcDate.getTime())) return { time: strTime.slice(0, 5), date: dateEvent };
  return {
    time: utcDate.toTimeString().slice(0, 5),
    date: dateKey(utcDate),
  };
}

export function formatFullDate(dk) {
  const [y, m, d] = dk.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = DIAS[(dateObj.getDay() + 6) % 7];
  return `${dayName} ${d} de ${MESES[m - 1]}`;
}

export function formatShort(dk) {
  const [, m, d] = dk.split('-').map(Number);
  return `${d} ${MESES3[m - 1]}`;
}

export function daysUntil(dk) {
  const [y, m, d] = dk.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  return Math.ceil((target - new Date(new Date().toDateString())) / 86400000);
}

// Para una fecha importante (cumpleaños, aniversario...) guardada como
// 'YYYY-MM-DD', calcula la próxima vez que cae ese mismo día-mes a partir
// de hoy (este año si no ha pasado ya, si no el que viene).
export function nextOccurrence(fecha) {
  const [, m, d] = fecha.split('-').map(Number);
  const todayKey = dateKey(new Date());
  let year = new Date().getFullYear();
  let candidate = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  if (candidate < todayKey) {
    year += 1;
    candidate = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return candidate;
}

export function yearsFor(fecha, next) {
  const [y] = fecha.split('-').map(Number);
  const [ny] = next.split('-').map(Number);
  const diff = ny - y;
  return diff > 0 ? diff : null;
}

export function eventsOnDate(events, dk) {
  const dayIndex = (new Date(dk + 'T00:00:00').getDay() + 6) % 7;
  return events
    .filter(e => {
      if (e.date === dk) return true;
      if (e.recurring) {
        const eventDayIndex = (new Date(e.date + 'T00:00:00').getDay() + 6) % 7;
        return eventDayIndex === dayIndex && dk > e.date;
      }
      return false;
    })
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
}
