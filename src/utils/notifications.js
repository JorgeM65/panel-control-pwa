// Lógica de notificaciones, extraída tal cual de App.jsx. Compartida entre
// App (aviso de cápsula) y AjustesTab (botones "probar ahora"), por eso vive
// aquí en vez de junto a un solo componente.

import { dateKey, nextOccurrence, eventsOnDate } from './dates';

export function buildMorningSummary(tasks, events, footballMatches, footballTeams, fechas) {
  const todayKey = dateKey(new Date());
  const urgentPending = tasks.filter(t => !t.done && t.priority === 'alta');
  const todayEvents = eventsOnDate(events, todayKey);
  const teamNames = footballTeams.map(t => t.name);
  const teamMatches = footballMatches.filter(m => teamNames.includes(m.home) || teamNames.includes(m.away));
  const todayFechas = (fechas || []).filter(f => nextOccurrence(f.fecha) === todayKey);

  const parts = [];
  if (todayFechas.length > 0) {
    parts.push(`🎂 ${todayFechas.map(f => f.nombre).join(', ')}`);
  }
  if (urgentPending.length > 0) {
    parts.push(`${urgentPending.length} urgente${urgentPending.length === 1 ? '' : 's'}: ${urgentPending.slice(0, 3).map(t => t.text).join(', ')}`);
  }
  if (todayEvents.length > 0) {
    parts.push(`${todayEvents.length} evento${todayEvents.length === 1 ? '' : 's'} hoy`);
  }
  if (teamMatches.length > 0) {
    parts.push(`${teamMatches.length} partido${teamMatches.length === 1 ? '' : 's'} de tus equipos`);
  }
  if (parts.length === 0) return { title: 'Buenos días', body: 'Nada urgente por ahora. Buen día.' };
  return { title: 'Buenos días', body: parts.join(' · ') };
}

export function buildEveningSummary(tasks, habits) {
  const todayKey = dateKey(new Date());
  const pending = tasks.filter(t => !t.done);
  const habitsPending = habits.filter(h => !h.dates.includes(todayKey));
  const parts = [];
  if (pending.length > 0) parts.push(`${pending.length} tarea${pending.length === 1 ? '' : 's'} pendiente${pending.length === 1 ? '' : 's'}`);
  if (habitsPending.length > 0) parts.push(`${habitsPending.length} hábito${habitsPending.length === 1 ? '' : 's'} sin marcar`);
  if (parts.length === 0) return { title: 'Resumen del día', body: 'Todo al día. Buen descanso.' };
  return { title: 'Resumen del día', body: parts.join(' · ') };
}

// Interfaz pensada para calzar con @capacitor/local-notifications el día que la
// app pase a nativo: mismos nombres de función, misma forma de datos. Por ahora,
// en la PWA, solo puede disparar un aviso inmediato (la API web no permite
// programar avisos futuros de forma fiable con la app cerrada) — programar()
// y cancelar() quedan como no-op hasta esa migración.
export const Notificaciones = {
  async solicitarPermiso() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const res = await Notification.requestPermission();
    return res === 'granted';
  },
  async mostrarAhora(title, body) {
    const ok = await this.solicitarPermiso();
    if (!ok) return { ok: false, reason: 'permiso' };
    try {
      // Chrome en Android exige mostrar la notificación a través del service
      // worker cuando la página tiene uno activo (nuestro caso, al ser PWA);
      // el constructor `new Notification()` directo falla ahí en silencio.
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, { body, icon: './icon.svg' });
        return { ok: true };
      }
      new Notification(title, { body, icon: './icon.svg' });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'error', detail: String((e && e.message) || e) };
    }
  },
  async programar() { return false; },
  async cancelar() { return false; },
};
