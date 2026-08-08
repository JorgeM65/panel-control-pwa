import React, { useState, useEffect, useCallback, useRef } from 'react';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_CORTO = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const PRIORIDADES = {
  alta: { label: 'Alta', color: '#E2637A' },
  media: { label: 'Media', color: '#E3AC4C' },
  baja: { label: 'Baja', color: '#58D398' },
};

const LIGAS_FUTBOL = [
  { id: 'laliga', name: 'LaLiga', apiName: 'Spanish La Liga' },
  { id: 'champions', name: 'Champions League', apiName: 'UEFA Champions League' },
  { id: 'premier', name: 'Premier League', apiName: 'English Premier League' },
  { id: 'seriea', name: 'Serie A', apiName: 'Italian Serie A' },
  { id: 'bundesliga', name: 'Bundesliga', apiName: 'German Bundesliga' },
  { id: 'ligue1', name: 'Ligue 1', apiName: 'French Ligue 1' },
];

const PLATAFORMAS = [
  { id: 8, name: 'Netflix' },
  { id: 337, name: 'Disney+' },
  { id: 119, name: 'Prime Video' },
  { id: 1899, name: 'Max' },
  { id: 149, name: 'Movistar Plus+' },
  { id: 63, name: 'Filmin' },
];

const NAV_ITEMS = [
  { key: 'tareas', label: 'Tareas', icon: '✓' },
  { key: 'calendario', label: 'Calendario', icon: '📅' },
  { key: 'entretenimiento', label: 'Entretenimiento', icon: '🎬' },
  { key: 'habitos', label: 'Hábitos', icon: '🔥' },
  { key: 'compra', label: 'Compra', icon: '🛒' },
  { key: 'capsula', label: 'Cápsula', icon: '⏳' },
  { key: 'notas', label: 'Notas', icon: '📝' },
  { key: 'ruleta', label: 'Ruleta', icon: '🎡' },
  { key: 'datos', label: 'Datos', icon: '📊' },
  { key: 'juego', label: 'Juego', icon: '🎮' },
  { key: 'tiempo', label: 'Tiempo', icon: '🌤️' },
  { key: 'ajustes', label: 'Ajustes', icon: '⚙' },
];

const RULETA_COLORS = ['#4DD9CE', '#E3AC4C', '#E2637A', '#58D398', '#9C93E8'];

const DEFAULT_ENTRETENIMIENTO = {
  futbol: { leagues: [], teams: [] },
  estrenos: { apiKey: '', providers: [] },
};

const DEFAULT_TIEMPO = { city: '', lat: null, lon: null };

const DEFAULT_NOTIFICACIONES = {
  manana: { activo: true, hora: '08:00' },
  noche: { activo: true, hora: '21:00' },
  capsula: true,
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// TheSportsDB devuelve dateEvent/strTime en UTC. Los convertimos a hora local
// del dispositivo — y ojo, la FECHA también puede cambiar (un partido a las
// 23:30 UTC puede caer ya en el día siguiente en España).
function utcToLocal(dateEvent, strTime) {
  if (!strTime) return { time: '', date: dateEvent };
  const utcDate = new Date(`${dateEvent}T${strTime}Z`);
  if (isNaN(utcDate.getTime())) return { time: strTime.slice(0, 5), date: dateEvent };
  return {
    time: utcDate.toTimeString().slice(0, 5),
    date: dateKey(utcDate),
  };
}

function formatFullDate(dk) {
  const [y, m, d] = dk.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = DIAS[(dateObj.getDay() + 6) % 7];
  return `${dayName} ${d} de ${MESES[m - 1]}`;
}

function formatShort(dk) {
  const [, m, d] = dk.split('-').map(Number);
  return `${d} ${MESES3[m - 1]}`;
}

function daysUntil(dk) {
  const [y, m, d] = dk.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  return Math.ceil((target - new Date(new Date().toDateString())) / 86400000);
}

function buildMorningSummary(tasks, events, footballMatches, footballTeams) {
  const todayKey = dateKey(new Date());
  const urgentPending = tasks.filter(t => !t.done && t.priority === 'alta');
  const todayEvents = eventsOnDate(events, todayKey);
  const teamNames = footballTeams.map(t => t.name);
  const teamMatches = footballMatches.filter(m => teamNames.includes(m.home) || teamNames.includes(m.away));

  const parts = [];
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

function buildEveningSummary(tasks, habits) {
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
const Notificaciones = {
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

function weatherIcon(code) {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 85 && code <= 86) return '❄️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

function eventsOnDate(events, dk) {
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

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

:root {
  --bg: #0A0F14;
  --surface: #10161C;
  --item-bg: #161F27;
  --border: #232F3A;
  --border-soft: #1A242E;
  --text: #DCE6EC;
  --text-dim: #6E8091;
  --cyan: #4DD9CE;
  --cyan-dim: #235450;
  --violet: #9C93E8;
  --amber: #E3AC4C;
  --red: #E2637A;
  --green: #58D398;
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Work Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background-color: var(--bg);
}

.app-shell {
  min-height: 100vh;
  min-height: 100dvh;
  background-color: var(--bg);
  background-image:
    linear-gradient(rgba(77,217,206,0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(77,217,206,0.045) 1px, transparent 1px);
  background-size: 22px 22px;
  display: flex;
  flex-direction: column;
  font-family: var(--font-body);
  color: var(--text);
  max-width: 480px;
  margin: 0 auto;
  position: relative;
}

.loading {
  color: var(--text);
  font-family: var(--font-mono);
  text-align: center;
  padding: 60px 20px;
}

.app-header {
  padding: 20px 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.header-row { display: flex; align-items: center; gap: 14px; }
.hamburger-btn {
  width: 26px; height: 20px; display: flex; flex-direction: column; justify-content: space-between;
  background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0;
}
.hamburger-btn span { display: block; height: 2px; background: var(--cyan); border-radius: 2px; }
.header-titles { display: flex; flex-direction: column; cursor: pointer; flex: 1; min-width: 0; }
.search-btn { background: none; border: none; color: var(--cyan); font-size: 17px; cursor: pointer; flex-shrink: 0; padding: 4px; }
.eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cyan);
}
.app-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.07em;
  color: var(--text);
  margin: 0;
}
.privacy-note {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.05em;
  color: var(--text-dim);
  margin-top: 4px;
  margin-left: 40px;
}

.app-card {
  flex: 1;
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  margin: 6px 12px 12px;
  border-radius: 18px;
  padding: 18px 16px 28px;
  position: relative;
}

.module-panel { display: flex; flex-direction: column; gap: 14px; }

.view-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.view-back { font-family: var(--font-mono); font-size: 11.5px; background: none; border: none; color: var(--cyan); cursor: pointer; padding: 4px 0; }
.view-title { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-dim); }

.tech-frame { position: relative; }
.tech-frame::before, .tech-frame::after {
  content: ''; position: absolute; width: 8px; height: 8px;
  border-color: var(--cyan); border-style: solid; opacity: 0.55;
}
.tech-frame::before { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
.tech-frame::after { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }

.home-dash { display: flex; flex-direction: column; gap: 18px; }

.kpi-strip { display: flex; gap: 8px; }
.kpi-box { flex: 1; display: flex; flex-direction: column; gap: 4px; background: var(--item-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 6px; text-align: center; }
.kpi-value { font-family: var(--font-mono); font-size: 17px; font-weight: 700; color: var(--cyan); }
.kpi-label { font-family: var(--font-mono); font-size: 7.5px; letter-spacing: 0.02em; color: var(--text-dim); text-transform: uppercase; }

.dash-section { display: flex; flex-direction: column; gap: 8px; }
.dash-section-head { display: flex; align-items: center; justify-content: space-between; }
.dash-link { font-family: var(--font-mono); font-size: 10.5px; background: none; border: none; color: var(--cyan); cursor: pointer; padding: 2px 0; }

.dash-task-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.dash-task-row {
  display: flex; align-items: center; gap: 10px; background: var(--item-bg); border: 1px solid var(--border);
  border-radius: 8px; padding: 9px 12px; cursor: pointer;
}
.dash-task-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--chip-color); flex-shrink: 0; }
.dash-task-text { font-size: 13.5px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.dash-task-check {
  width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid var(--cyan);
  background: transparent; color: var(--cyan); font-size: 12px; cursor: pointer; flex-shrink: 0;
}

.dash-day-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.dash-day-row {
  display: flex; align-items: center; gap: 8px; background: var(--item-bg); border: 1px solid var(--border);
  border-radius: 8px; padding: 9px 12px; cursor: pointer;
}
.dash-day-icon { font-size: 13px; flex-shrink: 0; }
.dash-day-time { font-family: var(--font-mono); font-size: 11px; color: var(--cyan); flex-shrink: 0; }
.dash-day-label { font-size: 13px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }

.quick-row { display: flex; flex-wrap: wrap; gap: 8px; }
.quick-chip {
  font-family: var(--font-mono); font-size: 11px; padding: 8px 12px; border-radius: 999px;
  border: 1px solid var(--border); background: var(--item-bg); color: var(--text-dim); cursor: pointer;
}

.drawer-backdrop {
  position: fixed; inset: 0; background: rgba(5,8,11,0.7); z-index: 70; display: flex;
}
.drawer-panel {
  width: 78%; max-width: 280px; height: 100%; background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; padding: 20px 0;
  animation: drawer-in 0.22s ease;
}
@keyframes drawer-in {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
.drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 0 18px 16px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.drawer-close { background: none; border: none; color: var(--text); font-size: 20px; cursor: pointer; }
.drawer-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1; }
.drawer-item {
  width: 100%; text-align: left; display: flex; align-items: center; gap: 12px;
  background: none; border: none; padding: 13px 18px; font-family: var(--font-body); font-size: 14.5px;
  color: var(--text-dim); cursor: pointer;
}
.drawer-item.active { background: rgba(77,217,206,0.12); color: var(--text); border-left: 3px solid var(--cyan); padding-left: 15px; font-weight: 600; }
.drawer-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
.drawer-future { color: var(--text-dim); opacity: 0.6; font-family: var(--font-mono); font-size: 12px; border-top: 1px dashed var(--border); margin-top: 6px; padding-top: 14px; }

.empty-state {
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--text-dim);
  padding: 26px 10px;
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 10px;
}

.text-input {
  font-family: var(--font-body);
  font-size: 14px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--item-bg);
  color: var(--text);
  width: 100%;
}
.text-input::placeholder { color: var(--text-dim); opacity: 0.8; }
.text-input.small { flex: 1; }
.text-input.tiny { width: 42px; text-align: center; flex: none; padding: 10px 4px; }
textarea.text-input { resize: none; min-height: 46px; font-family: var(--font-body); }

.add-row { display: flex; flex-direction: column; gap: 8px; }
.priority-picker { display: flex; gap: 6px; align-items: center; }
.priority-chip {
  font-family: var(--font-mono);
  font-size: 10.5px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--chip-color);
  color: var(--chip-color);
  background: transparent;
  cursor: pointer;
}
.priority-chip.active { background: var(--chip-color); color: var(--bg); }

.add-btn {
  margin-left: auto;
  width: 32px; height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--cyan);
  color: var(--bg);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}

.task-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.task-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  background: var(--item-bg);
  border-radius: 10px;
  border: 1px solid var(--border);
  transition: opacity 0.4s ease;
}
.task-item.done { opacity: 0.5; }
.task-item.done .task-text { text-decoration: line-through; }
.checkbox {
  width: 20px; height: 20px; border-radius: 6px;
  border: 2px solid var(--cyan);
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  color: var(--cyan);
  font-size: 12px;
}
.task-text { flex: 1; font-size: 14px; }
.priority-tag {
  font-family: var(--font-mono);
  font-size: 9.5px;
  padding: 3px 8px;
  border-radius: 999px;
  color: var(--bg);
  background: var(--chip-color);
  flex-shrink: 0;
}
.remove-btn {
  border: none; background: transparent; color: var(--text-dim);
  font-size: 18px; cursor: pointer; opacity: 0.7; line-height: 1; flex-shrink: 0;
}
.edit-btn {
  border: none; background: transparent; color: var(--cyan);
  font-size: 14px; cursor: pointer; opacity: 0.85; line-height: 1; flex-shrink: 0;
}
.task-edit-row { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.task-edit-actions { display: flex; gap: 8px; justify-content: flex-end; }

.week-nav {
  display: flex; align-items: center; justify-content: space-between;
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.03em;
  padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.week-nav button { background: none; border: none; font-size: 18px; color: var(--cyan); cursor: pointer; }
.day-list { display: flex; flex-direction: column; }
.day-row {
  display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border);
}
.day-row.today { background: rgba(77,217,206,0.08); border-radius: 8px; padding-left: 6px; padding-right: 6px; margin: 0 -6px; }
.day-label { width: 38px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; font-family: var(--font-mono); padding-top: 2px; }
.day-name { font-size: 9.5px; color: var(--text-dim); letter-spacing: 0.04em; }
.day-num { font-size: 16px; font-weight: 600; color: var(--text); }
.day-events { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.event-chip {
  text-align: left; display: flex; gap: 6px; align-items: baseline;
  background: var(--item-bg); border: 1px solid var(--border); border-radius: 8px;
  padding: 6px 10px; font-size: 13px; cursor: pointer; width: 100%; color: var(--text);
}
.event-time { font-family: var(--font-mono); font-size: 11px; color: var(--cyan); flex-shrink: 0; }
.add-event-btn {
  align-self: flex-start; background: none; border: none; font-family: var(--font-mono);
  font-size: 10.5px; color: var(--text-dim); cursor: pointer; padding: 4px 0;
}

.modal-backdrop {
  position: fixed; inset: 0; background: rgba(5,8,11,0.72);
  display: flex; align-items: flex-end; justify-content: center; z-index: 50;
}
.modal {
  background: var(--surface); border: 1px solid var(--border); width: 100%; max-width: 480px;
  border-radius: 18px 18px 0 0; padding: 20px; display: flex; flex-direction: column; gap: 10px;
}
.modal h3 { margin: 0; font-family: var(--font-display); font-size: 16px; color: var(--text); }
.modal-date { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); margin: -6px 0 2px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 6px; }
.primary-btn, .ghost-btn, .danger-btn {
  font-family: var(--font-mono); font-size: 11.5px; padding: 9px 14px; border-radius: 8px; cursor: pointer; border: none;
}
.primary-btn { background: var(--cyan); color: var(--bg); }
.ghost-btn { background: transparent; color: var(--text-dim); border: 1px solid var(--border); }
.danger-btn { background: transparent; color: var(--red); border: 1px solid var(--red); margin-right: auto; }

.sub-tabs { display: flex; gap: 8px; }
.sub-tab {
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.04em; text-transform: uppercase;
  padding: 6px 12px; border-radius: 999px; border: 1px solid var(--border); background: transparent;
  color: var(--text-dim); cursor: pointer;
}
.sub-tab.active { background: var(--cyan); color: var(--bg); border-color: var(--cyan); }

.section-head { display: flex; justify-content: space-between; align-items: center; }
.section-label { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-dim); }
.gear-btn { font-family: var(--font-mono); font-size: 10.5px; background: none; border: none; color: var(--cyan); cursor: pointer; padding: 4px 0; }

.config-panel { display: flex; flex-direction: column; gap: 8px; background: var(--item-bg); border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin: 8px 0; }
.settings-block { display: flex; flex-direction: column; gap: 8px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.settings-block:last-child { border-bottom: none; padding-bottom: 0; }
.config-title { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-dim); }
.chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
.toggle-chip {
  font-family: var(--font-mono); font-size: 11px; padding: 6px 10px; border-radius: 999px;
  border: 1px solid var(--border); background: transparent; color: var(--text-dim); cursor: pointer;
}
.toggle-chip.active { background: var(--cyan); border-color: var(--cyan); color: var(--bg); }
.team-search-row { display: flex; gap: 6px; }
.team-results { display: flex; flex-direction: column; gap: 4px; }
.team-result {
  text-align: left; font-family: var(--font-body); font-size: 13px; padding: 6px 10px;
  border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--text); cursor: pointer;
}
.team-chip {
  display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-mono); font-size: 11px;
  padding: 5px 6px 5px 10px; border-radius: 999px; background: rgba(77,217,206,0.12); border: 1px solid var(--cyan-dim); color: var(--cyan);
}
.team-chip button { background: none; border: none; color: var(--cyan); font-size: 13px; cursor: pointer; opacity: 0.8; }

.match-list { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.match-item { background: var(--item-bg); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.match-competition { font-family: var(--font-mono); font-size: 9.5px; color: var(--cyan); letter-spacing: 0.04em; text-transform: uppercase; }
.match-teams { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13.5px; margin-top: 2px; color: var(--text); }
.match-score { font-family: var(--font-mono); font-size: 13px; color: var(--text); flex-shrink: 0; }
.match-date { font-family: var(--font-mono); font-size: 10px; color: var(--text-dim); }

.movie-list { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.movie-item { display: flex; gap: 10px; align-items: center; background: var(--item-bg); border: 1px solid var(--border); border-radius: 10px; padding: 8px; }
.movie-poster { width: 40px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
.movie-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.movie-title { font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
.movie-date { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-dim); }

.habit-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.habit-item { background: var(--item-bg); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.habit-head { display: flex; align-items: center; gap: 8px; }
.habit-name { flex: 1; font-size: 14px; color: var(--text); }
.habit-streak { font-family: var(--font-mono); font-size: 12px; color: var(--amber); flex-shrink: 0; }
.habit-strip { display: flex; gap: 6px; margin-top: 8px; }
.habit-dot {
  width: 22px; height: 22px; border-radius: 6px; border: 1px solid var(--border);
  background: transparent; cursor: pointer; padding: 0;
}
.habit-dot.today { border-color: var(--cyan); border-width: 2px; }
.habit-dot.done { background: var(--cyan); border-color: var(--cyan); }

.capsule-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.capsule-item { position: relative; padding: 14px 34px 14px 14px; border-radius: 10px; border: 1px solid var(--border); background: var(--item-bg); }
.capsule-item.sealed { background: repeating-linear-gradient(135deg, var(--item-bg), var(--item-bg) 8px, #0D141A 8px, #0D141A 16px); }
.capsule-item.ready { border-color: var(--cyan); border-width: 2px; }
.capsule-message { font-size: 14px; margin: 0 0 6px; white-space: pre-wrap; color: var(--text); }
.capsule-meta { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); display: block; margin-bottom: 6px; }
.capsule-remove { position: absolute; top: 10px; right: 10px; }

.stat-grid { display: flex; gap: 8px; }
.stat-box { flex: 1; display: flex; flex-direction: column; gap: 4px; background: var(--item-bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px 10px; }
.stat-value { font-family: var(--font-mono); font-size: 19px; font-weight: 700; color: var(--cyan); }
.stat-label { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.03em; color: var(--text-dim); text-transform: uppercase; }
.heatmap { display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap; }
.heatmap-cell {
  width: 18px; height: 18px; border-radius: 3px;
  background: rgba(77,217,206, calc(0.08 + var(--intensity) * 0.75));
  border: 1px solid var(--border);
}

.weather-now { display: flex; align-items: center; gap: 12px; padding: 10px 0 18px; }
.weather-now-icon { font-size: 40px; }
.weather-now-temp { font-family: var(--font-display); font-size: 36px; font-weight: 700; color: var(--text); }
.weather-days { display: flex; justify-content: space-between; gap: 6px; }
.weather-day {
  display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1;
  background: var(--item-bg); border: 1px solid var(--border); border-radius: 10px; padding: 10px 4px;
}
.weather-day-label { font-family: var(--font-mono); font-size: 9.5px; color: var(--text-dim); text-transform: uppercase; }
.weather-day-icon { font-size: 18px; }
.weather-day-temps { display: flex; flex-direction: column; align-items: center; font-family: var(--font-mono); font-size: 10.5px; }
.weather-max { color: var(--text); }
.weather-min { color: var(--text-dim); }

.wheel-wrap { position: relative; width: 240px; height: 240px; margin: 6px auto 4px; }
.wheel-pointer {
  position: absolute; top: -8px; left: 50%; transform: translateX(-50%); z-index: 5;
  width: 0; height: 0;
  border-left: 11px solid transparent; border-right: 11px solid transparent;
  border-top: 18px solid var(--cyan);
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
}
.wheel {
  width: 240px; height: 240px; border-radius: 50%; border: 4px solid var(--surface);
  box-shadow: 0 0 0 2px var(--border), 0 10px 28px rgba(0,0,0,0.45);
  transition: transform 4.2s cubic-bezier(0.12, 0.67, 0.1, 0.99);
}
.wheel-spin-btn { display: block; margin: 4px auto 10px; min-width: 140px; text-align: center; }
.wheel-result {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 14px; background: var(--item-bg); border: 1px solid var(--cyan); border-radius: 10px; margin-bottom: 10px;
}
.wheel-result-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-dim); }
.wheel-result-text { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--cyan); text-align: center; }
.wheel-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.wheel-list-item {
  display: flex; align-items: center; gap: 10px; background: var(--item-bg); border: 1px solid var(--border);
  border-radius: 8px; padding: 8px 12px;
}
.wheel-swatch { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
.wheel-list-text { flex: 1; font-size: 13.5px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.game-wrap { position: relative; width: 100%; max-width: 300px; margin: 0 auto; }
.game-canvas { width: 100%; height: auto; display: block; border-radius: 10px; border: 1px solid var(--border); touch-action: none; }
.game-overlay {
  position: absolute; inset: 0; background: rgba(10,15,20,0.85);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  border-radius: 10px; text-align: center; padding: 16px;
}
.game-over-score { font-family: var(--font-mono); font-size: 28px; font-weight: 700; color: var(--cyan); }
.game-over-label { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
.game-best { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); }
.game-score-live { text-align: center; font-family: var(--font-mono); font-size: 15px; color: var(--cyan); margin-top: -6px; }
.game-controls { display: flex; gap: 12px; justify-content: center; margin-top: 4px; }
.game-btn {
  width: 68px; height: 46px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--item-bg); color: var(--cyan); font-size: 22px; cursor: pointer;
}
.game-btn:disabled { opacity: 0.35; cursor: default; }
.game-hint { text-align: center; font-family: var(--font-mono); font-size: 10.5px; color: var(--text-dim); }

.search-backdrop {
  position: fixed; inset: 0; background: rgba(5,8,11,0.75); z-index: 90;
  display: flex; align-items: flex-start; justify-content: center; padding-top: 60px;
}
.search-panel {
  width: 100%; max-width: 480px; max-height: 70vh; margin: 0 12px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
  display: flex; flex-direction: column; overflow: hidden;
}
.search-input-row { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.search-icon { font-size: 15px; flex-shrink: 0; }
.search-input { flex: 1; background: none; border: none; color: var(--text); font-family: var(--font-body); font-size: 15px; outline: none; }
.search-input::placeholder { color: var(--text-dim); }
.search-close { background: none; border: none; color: var(--text-dim); font-size: 20px; cursor: pointer; flex-shrink: 0; }
.search-results { overflow-y: auto; padding: 10px; }
.search-result-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.search-result-item {
  width: 100%; display: flex; align-items: center; gap: 10px; text-align: left;
  background: var(--item-bg); border: 1px solid var(--border); border-radius: 8px;
  padding: 9px 12px; cursor: pointer;
}
.search-result-icon { font-size: 13px; flex-shrink: 0; }
.search-result-text { flex: 1; font-size: 13.5px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search-result-type { font-family: var(--font-mono); font-size: 9.5px; color: var(--text-dim); text-transform: uppercase; flex-shrink: 0; }

.toast {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: var(--surface); border: 1px solid var(--cyan-dim); color: var(--text); font-family: var(--font-mono); font-size: 11.5px;
  padding: 10px 14px 10px 16px; border-radius: 999px; max-width: 88%; z-index: 80;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  display: flex; align-items: center; gap: 12px;
}
.toast-action {
  font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase;
  background: none; border: none; color: var(--cyan); cursor: pointer; flex-shrink: 0; padding: 2px 0;
}

.recurring-toggle {
  display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 12px; color: var(--text-dim); cursor: pointer;
}
.recurring-toggle input { accent-color: var(--cyan); width: 15px; height: 15px; }

.event-recur-icon { color: var(--cyan); font-size: 11px; margin-left: 2px; }

.nota-add-btn { align-self: flex-end; }
.nota-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.nota-item { background: var(--item-bg); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.nota-text { font-size: 13.5px; color: var(--text); white-space: pre-wrap; margin: 0 0 8px; }
.nota-foot { display: flex; align-items: center; gap: 10px; }
.nota-date { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-dim); flex: 1; }

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
  .drawer-panel { animation: none; }
}
`;

function TareasTab({ tasks, onChange, onDelete }) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('media');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState('media');

  function addTask() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange([...tasks, { id: uid(), text: trimmed, priority, done: false, createdAt: Date.now() }]);
    setText('');
  }

  function toggleDone(id) {
    onChange(tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function removeTask(id) {
    onDelete(id);
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditText(t.text);
    setEditPriority(t.priority);
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
    onChange(tasks.map(t => (t.id === id ? { ...t, text: trimmed, priority: editPriority } : t)));
    setEditingId(null);
  }

  const order = { alta: 0, media: 1, baja: 2 };
  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    return a.createdAt - b.createdAt;
  });

  return (
    <div className="module-panel">
      <div className="add-row">
        <input
          className="text-input"
          placeholder="Nueva tarea…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <div className="priority-picker">
          {Object.entries(PRIORIDADES).map(([key, p]) => (
            <button
              key={key}
              type="button"
              className={`priority-chip ${priority === key ? 'active' : ''}`}
              style={{ '--chip-color': p.color }}
              onClick={() => setPriority(key)}
            >
              {p.label}
            </button>
          ))}
          <button type="button" className="add-btn" onClick={addTask} aria-label="Añadir tarea">+</button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">Sin tareas todavía. Añade la primera arriba.</div>
      ) : (
        <ul className="task-list">
          {sorted.map(t => (
            <li key={t.id} className={`task-item ${t.done ? 'done' : ''}`}>
              {editingId === t.id ? (
                <div className="task-edit-row">
                  <input
                    className="text-input"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit(t.id)}
                    autoFocus
                  />
                  <div className="priority-picker">
                    {Object.entries(PRIORIDADES).map(([key, p]) => (
                      <button
                        key={key}
                        type="button"
                        className={`priority-chip ${editPriority === key ? 'active' : ''}`}
                        style={{ '--chip-color': p.color }}
                        onClick={() => setEditPriority(key)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="task-edit-actions">
                    <button type="button" className="ghost-btn" onClick={cancelEdit}>Cancelar</button>
                    <button type="button" className="primary-btn" onClick={() => saveEdit(t.id)}>Guardar</button>
                  </div>
                </div>
              ) : (
                <>
                  <button type="button" className="checkbox" onClick={() => toggleDone(t.id)} aria-label="Completar tarea">
                    {t.done && <span>✓</span>}
                  </button>
                  <span className="task-text">{t.text}</span>
                  <span className="priority-tag" style={{ '--chip-color': PRIORIDADES[t.priority].color }}>
                    {PRIORIDADES[t.priority].label}
                  </span>
                  <button type="button" className="edit-btn" onClick={() => startEdit(t)} aria-label="Editar tarea">✎</button>
                  <button type="button" className="remove-btn" onClick={() => removeTask(t.id)} aria-label="Eliminar tarea">×</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CalendarioTab({ events, onChange, onDelete }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [modal, setModal] = useState(null);

  const today = new Date();
  const monday = addDays(startOfWeek(today), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const todayKey = dateKey(today);

  function openAdd(dk) {
    setModal({ id: null, date: dk, title: '', time: '', note: '', recurring: false });
  }

  function openEdit(ev) {
    setModal({ ...ev });
  }
  function closeModal() {
    setModal(null);
  }
  function saveModal() {
    const title = modal.title.trim();
    if (!title) {
      closeModal();
      return;
    }
    const clean = { ...modal, title };
    if (modal.id) {
      onChange(events.map(e => (e.id === modal.id ? clean : e)));
    } else {
      onChange([...events, { ...clean, id: uid() }]);
    }
    closeModal();
  }
  function deleteModal() {
    if (modal.id) onDelete(modal.id);
    closeModal();
  }

  const weekEnd = addDays(monday, 6);
  const sameMonth = monday.getMonth() === weekEnd.getMonth();
  const rangeLabel = weekOffset === 0
    ? 'Esta semana'
    : sameMonth
      ? `${monday.getDate()} – ${weekEnd.getDate()} de ${MESES[weekEnd.getMonth()]}`
      : `${monday.getDate()} de ${MESES[monday.getMonth()]} – ${weekEnd.getDate()} de ${MESES[weekEnd.getMonth()]}`;

  return (
    <div className="module-panel">
      <div className="week-nav">
        <button type="button" onClick={() => setWeekOffset(w => w - 1)} aria-label="Semana anterior">‹</button>
        <span>{rangeLabel}</span>
        <button type="button" onClick={() => setWeekOffset(w => w + 1)} aria-label="Semana siguiente">›</button>
      </div>

      <div className="day-list">
        {days.map((d, i) => {
          const dk = dateKey(d);
          const isToday = dk === todayKey;
          const dayEvents = eventsOnDate(events, dk);
          return (
            <div key={dk} className={`day-row ${isToday ? 'today' : ''}`}>
              <div className="day-label">
                <span className="day-name">{DIAS_CORTO[i]}</span>
                <span className="day-num">{d.getDate()}</span>
              </div>
              <div className="day-events">
                {dayEvents.map(ev => (
                  <button key={ev.id} type="button" className="event-chip" onClick={() => openEdit(ev)}>
                    {ev.time && <span className="event-time">{ev.time}</span>}
                    <span>{ev.title}</span>
                    {ev.recurring && <span className="event-recur-icon" title="Se repite cada semana">↻</span>}
                  </button>
                ))}
                <button type="button" className="add-event-btn" onClick={() => openAdd(dk)}>+ evento</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{modal.id ? 'Editar evento' : 'Nuevo evento'}</h3>
            <p className="modal-date">
              {modal.recurring
                ? `Se repite cada ${DIAS[(new Date(modal.date + 'T00:00:00').getDay() + 6) % 7]}`
                : formatFullDate(modal.date)}
            </p>
            <input
              className="text-input"
              placeholder="Título"
              value={modal.title}
              onChange={e => setModal({ ...modal, title: e.target.value })}
              autoFocus
            />
            <input
              className="text-input"
              type="time"
              value={modal.time || ''}
              onChange={e => setModal({ ...modal, time: e.target.value })}
            />
            <textarea
              className="text-input"
              placeholder="Nota (opcional)"
              value={modal.note || ''}
              onChange={e => setModal({ ...modal, note: e.target.value })}
            />
            <label className="recurring-toggle">
              <input
                type="checkbox"
                checked={!!modal.recurring}
                onChange={e => setModal({ ...modal, recurring: e.target.checked })}
              />
              Se repite cada semana
            </label>
            <div className="modal-actions">
              {modal.id && <button type="button" className="danger-btn" onClick={deleteModal}>Eliminar</button>}
              <button type="button" className="ghost-btn" onClick={closeModal}>Cancelar</button>
              <button type="button" className="primary-btn" onClick={saveModal}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FutbolSection({ config, matches, status, onNavigate }) {
  const todayKey = dateKey(new Date());

  return (
    <div>
      <div className="section-head">
        <span className="section-label">Partidos de hoy</span>
        <button type="button" className="gear-btn" onClick={() => onNavigate('ajustes')}>Ajustes ⚙</button>
      </div>

      {config.leagues.length === 0 && config.teams.length === 0 ? (
        <div className="empty-state">Elige alguna liga o equipo en Ajustes para ver sus partidos.</div>
      ) : status === 'loading' ? (
        <div className="empty-state">Buscando partidos…</div>
      ) : status === 'error' ? (
        <div className="empty-state">No se ha podido conectar. Revisa tu conexión e inténtalo de nuevo.</div>
      ) : matches.length === 0 ? (
        <div className="empty-state">Hoy no hay partidos de tus ligas o equipos.</div>
      ) : (
        <ul className="match-list">
          {matches.map(m => (
            <li key={m.id} className="match-item">
              <span className="match-competition">{m.competition}</span>
              <div className="match-teams">
                <span>{m.home}</span>
                <span className="match-score">
                  {m.homeScore !== null && m.homeScore !== '' ? `${m.homeScore} - ${m.awayScore}` : (m.time || '–')}
                </span>
                <span>{m.away}</span>
              </div>
              {m.date !== todayKey && <span className="match-date">{formatShort(m.date)}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EstrenosSection({ config, onNavigate }) {
  const [sub, setSub] = useState('cine');
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errorDetail, setErrorDetail] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      if (!config.apiKey) {
        setStatus('nokey');
        return;
      }
      setStatus('loading');
      try {
        // TMDB tiene dos tipos de credencial: la clave v3 (una cadena corta)
        // y el "API Read Access Token" v4 (un JWT largo con puntos, tipo
        // eyJ...). Cada una se envía de forma distinta — si no acertamos
        // cuál es, TMDB devuelve un 401 aunque la clave sea correcta.
        const isV4Token = config.apiKey.includes('.');
        const headers = isV4Token ? { Authorization: `Bearer ${config.apiKey}` } : {};
        const keyParam = isV4Token ? '' : `&api_key=${config.apiKey}`;

        let url;
        if (sub === 'cine') {
          url = `https://api.themoviedb.org/3/movie/now_playing?region=ES&language=es-ES&page=1${keyParam}`;
        } else {
          const providers = config.providers.length > 0 ? config.providers.join('|') : PLATAFORMAS.map(p => p.id).join('|');
          const today = dateKey(new Date());
          // primary_release_date.lte evita mostrar películas con fecha de
          // estreno futura (que aún no están realmente disponibles), y
          // watch_monetization_types=flatrate se ciñe a lo incluido en la
          // suscripción, sin mezclar alquiler o compra.
          url = `https://api.themoviedb.org/3/discover/movie?watch_region=ES&with_watch_providers=${providers}&watch_monetization_types=flatrate&sort_by=primary_release_date.desc&primary_release_date.lte=${today}&language=es-ES&page=1${keyParam}`;
        }
        const res = await fetch(url, { headers });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.status_message || `error ${res.status}`);
        }
        if (!cancelled) {
          setItems((data.results || []).slice(0, 12));
          setStatus('ok');
        }
      } catch (e) {
        if (!cancelled) {
          setErrorDetail(String((e && e.message) || e));
          setStatus('error');
        }
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [config.apiKey, config.providers, sub]);

  return (
    <div>
      <div className="section-head">
        <span className="section-label">Estrenos</span>
        <button type="button" className="gear-btn" onClick={() => onNavigate('ajustes')}>Ajustes ⚙</button>
      </div>

      <div className="sub-tabs">
        <button type="button" className={`sub-tab ${sub === 'cine' ? 'active' : ''}`} onClick={() => setSub('cine')}>Cine</button>
        <button type="button" className={`sub-tab ${sub === 'streaming' ? 'active' : ''}`} onClick={() => setSub('streaming')}>Streaming</button>
      </div>

      {status === 'nokey' ? (
        <div className="empty-state">Conecta tu clave de TMDB en Ajustes para ver estrenos reales.</div>
      ) : status === 'loading' ? (
        <div className="empty-state">Cargando estrenos…</div>
      ) : status === 'error' ? (
        <div className="empty-state">No se ha podido conectar con TMDB{errorDetail ? `: ${errorDetail}` : '.'}</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No hay resultados por ahora.</div>
      ) : (
        <ul className="movie-list">
          {items.map(it => (
            <li key={it.id} className="movie-item">
              {it.poster_path && (
                <img className="movie-poster" src={`https://image.tmdb.org/t/p/w92${it.poster_path}`} alt="" />
              )}
              <div className="movie-info">
                <span className="movie-title">{it.title}</span>
                <span className="movie-date">{it.release_date}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EntretenimientoTab({ data, matches, matchesStatus, onNavigate }) {
  const [sub, setSub] = useState('futbol');
  return (
    <div className="module-panel">
      <div className="sub-tabs">
        <button type="button" className={`sub-tab ${sub === 'futbol' ? 'active' : ''}`} onClick={() => setSub('futbol')}>Fútbol</button>
        <button type="button" className={`sub-tab ${sub === 'estrenos' ? 'active' : ''}`} onClick={() => setSub('estrenos')}>Estrenos</button>
      </div>
      {sub === 'futbol'
        ? <FutbolSection config={data.futbol} matches={matches} status={matchesStatus} onNavigate={onNavigate} />
        : <EstrenosSection config={data.estrenos} onNavigate={onNavigate} />}
    </div>
  );
}

function AjustesTab({
  entertainment, onChangeEntertainment, tiempo, onChangeTiempo,
  notificaciones, onChangeNotificaciones, tasks, events, habits, footballMatches,
}) {
  const [teamQuery, setTeamQuery] = useState('');
  const [teamResults, setTeamResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [keyInput, setKeyInput] = useState(entertainment.estrenos.apiKey || '');
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [searchingCity, setSearchingCity] = useState(false);
  const [testMsg, setTestMsg] = useState('');

  const futbol = entertainment.futbol;
  const estrenos = entertainment.estrenos;

  function describeResult(result) {
    if (result.ok) return 'Aviso enviado — revisa las notificaciones del sistema.';
    if (result.reason === 'permiso') return 'No tienes el permiso de notificaciones concedido en el navegador.';
    return `No se pudo mostrar el aviso (${result.detail || 'error desconocido'}).`;
  }

  async function testMorning() {
    const s = buildMorningSummary(tasks, events, footballMatches, futbol.teams);
    const result = await Notificaciones.mostrarAhora(s.title, s.body);
    setTestMsg(describeResult(result));
  }
  async function testEvening() {
    const s = buildEveningSummary(tasks, habits);
    const result = await Notificaciones.mostrarAhora(s.title, s.body);
    setTestMsg(describeResult(result));
  }

  function toggleLeague(id) {
    const leagues = futbol.leagues.includes(id) ? futbol.leagues.filter(l => l !== id) : [...futbol.leagues, id];
    onChangeEntertainment({ ...entertainment, futbol: { ...futbol, leagues } });
  }

  async function searchTeams() {
    const q = teamQuery.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(q)}`);
      const data = await res.json();
      setTeamResults((data.teams || []).slice(0, 5));
    } catch (e) {
      setTeamResults([]);
    }
    setSearching(false);
  }

  function addTeam(t) {
    if (futbol.teams.some(x => x.id === t.idTeam)) return;
    onChangeEntertainment({ ...entertainment, futbol: { ...futbol, teams: [...futbol.teams, { id: t.idTeam, name: t.strTeam }] } });
    setTeamResults([]);
    setTeamQuery('');
  }

  function removeTeam(id) {
    onChangeEntertainment({ ...entertainment, futbol: { ...futbol, teams: futbol.teams.filter(t => t.id !== id) } });
  }

  function toggleProvider(id) {
    const providers = estrenos.providers.includes(id) ? estrenos.providers.filter(p => p !== id) : [...estrenos.providers, id];
    onChangeEntertainment({ ...entertainment, estrenos: { ...estrenos, providers } });
  }

  function saveKey() {
    onChangeEntertainment({ ...entertainment, estrenos: { ...estrenos, apiKey: keyInput.trim() } });
  }

  async function searchCity() {
    const q = cityQuery.trim();
    if (!q) return;
    setSearchingCity(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=es`);
      const data = await res.json();
      setCityResults(data.results || []);
    } catch (e) {
      setCityResults([]);
    }
    setSearchingCity(false);
  }

  function selectCity(c) {
    onChangeTiempo({
      city: c.admin1 ? `${c.name}, ${c.admin1}` : c.name,
      lat: c.latitude,
      lon: c.longitude,
    });
    setCityResults([]);
    setCityQuery('');
  }

  return (
    <div className="module-panel">
      <div className="settings-block">
        <span className="section-label">Fútbol · Ligas</span>
        <div className="chip-row">
          {LIGAS_FUTBOL.map(l => (
            <button
              key={l.id}
              type="button"
              className={`toggle-chip ${futbol.leagues.includes(l.id) ? 'active' : ''}`}
              onClick={() => toggleLeague(l.id)}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-block">
        <span className="section-label">Fútbol · Equipos favoritos</span>
        <div className="team-search-row">
          <input
            className="text-input"
            placeholder="Buscar equipo…"
            value={teamQuery}
            onChange={e => setTeamQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchTeams()}
          />
          <button type="button" className="add-btn" onClick={searchTeams}>{searching ? '…' : '🔍'}</button>
        </div>
        {teamResults.length > 0 && (
          <div className="team-results">
            {teamResults.map(t => (
              <button key={t.idTeam} type="button" className="team-result" onClick={() => addTeam(t)}>
                + {t.strTeam}
              </button>
            ))}
          </div>
        )}
        {futbol.teams.length > 0 && (
          <div className="chip-row">
            {futbol.teams.map(t => (
              <span key={t.id} className="team-chip">
                {t.name}
                <button type="button" onClick={() => removeTeam(t.id)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="settings-block">
        <span className="section-label">Estrenos · Clave de TMDB</span>
        <div className="team-search-row">
          <input
            className="text-input"
            placeholder="Pega tu API key de TMDB"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
          />
          <button type="button" className="add-btn" onClick={saveKey}>OK</button>
        </div>
      </div>

      <div className="settings-block">
        <span className="section-label">Estrenos · Plataformas</span>
        <div className="chip-row">
          {PLATAFORMAS.map(p => (
            <button
              key={p.id}
              type="button"
              className={`toggle-chip ${estrenos.providers.includes(p.id) ? 'active' : ''}`}
              onClick={() => toggleProvider(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-block">
        <span className="section-label">Tiempo · Ciudad</span>
        <div className="team-search-row">
          <input
            className="text-input"
            placeholder="Buscar ciudad…"
            value={cityQuery}
            onChange={e => setCityQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchCity()}
          />
          <button type="button" className="add-btn" onClick={searchCity}>{searchingCity ? '…' : '🔍'}</button>
        </div>
        {cityResults.length > 0 && (
          <div className="team-results">
            {cityResults.map(c => (
              <button key={c.id} type="button" className="team-result" onClick={() => selectCity(c)}>
                + {c.name}{c.admin1 ? `, ${c.admin1}` : ''}{c.country ? ` (${c.country})` : ''}
              </button>
            ))}
          </div>
        )}
        {tiempo.city && (
          <div className="chip-row">
            <span className="team-chip">
              {tiempo.city}
              <button type="button" onClick={() => onChangeTiempo({ city: '', lat: null, lon: null })}>×</button>
            </span>
          </div>
        )}
      </div>

      <div className="settings-block">
        <span className="section-label">Notificaciones</span>
        <label className="recurring-toggle">
          <input
            type="checkbox"
            checked={notificaciones.manana.activo}
            onChange={e => onChangeNotificaciones({ ...notificaciones, manana: { ...notificaciones.manana, activo: e.target.checked } })}
          />
          Resumen matutino (tareas urgentes, eventos y partidos de hoy)
        </label>
        <input
          type="time"
          className="text-input"
          value={notificaciones.manana.hora}
          disabled={!notificaciones.manana.activo}
          onChange={e => onChangeNotificaciones({ ...notificaciones, manana: { ...notificaciones.manana, hora: e.target.value } })}
        />
        <button type="button" className="ghost-btn" onClick={testMorning}>Probar aviso matutino ahora</button>

        <label className="recurring-toggle">
          <input
            type="checkbox"
            checked={notificaciones.noche.activo}
            onChange={e => onChangeNotificaciones({ ...notificaciones, noche: { ...notificaciones.noche, activo: e.target.checked } })}
          />
          Resumen nocturno (tareas y hábitos pendientes)
        </label>
        <input
          type="time"
          className="text-input"
          value={notificaciones.noche.hora}
          disabled={!notificaciones.noche.activo}
          onChange={e => onChangeNotificaciones({ ...notificaciones, noche: { ...notificaciones.noche, hora: e.target.value } })}
        />
        <button type="button" className="ghost-btn" onClick={testEvening}>Probar aviso nocturno ahora</button>

        <label className="recurring-toggle">
          <input
            type="checkbox"
            checked={notificaciones.capsula}
            onChange={e => onChangeNotificaciones({ ...notificaciones, capsula: e.target.checked })}
          />
          Avisar cuando una cápsula se desbloquee
        </label>

        {testMsg && <span className="config-title">{testMsg}</span>}
        <span className="config-title">
          De momento solo puedes probar el aviso al instante. Que suenen solos a su hora, incluso con la app cerrada, llegará cuando pasemos a la versión nativa.
        </span>
      </div>
    </div>
  );
}

function HabitosTab({ habits, onChange, onDelete }) {
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  function addHabit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange([...habits, { id: uid(), name: trimmed, dates: [] }]);
    setText('');
  }

  function removeHabit(id) {
    onDelete(id);
  }

  function toggleDate(id, dk) {
    onChange(habits.map(h => {
      if (h.id !== id) return h;
      const has = h.dates.includes(dk);
      return { ...h, dates: has ? h.dates.filter(d => d !== dk) : [...h.dates, dk] };
    }));
  }

  function startEdit(h) {
    setEditingId(h.id);
    setEditName(h.name);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(id) {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    onChange(habits.map(h => (h.id === id ? { ...h, name: trimmed } : h)));
    setEditingId(null);
  }

  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => dateKey(addDays(today, i - 6)));
  const todayKey = dateKey(today);

  function calcStreak(dates) {
    const set = new Set(dates);
    let cursor = new Date();
    if (!set.has(dateKey(cursor))) cursor = addDays(cursor, -1);
    let streak = 0;
    while (set.has(dateKey(cursor))) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  return (
    <div className="module-panel">
      <div className="team-search-row">
        <input
          className="text-input"
          placeholder="Nuevo hábito…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addHabit()}
        />
        <button type="button" className="add-btn" onClick={addHabit}>+</button>
      </div>

      {habits.length === 0 ? (
        <div className="empty-state">Añade tu primer hábito para empezar a llevar la racha.</div>
      ) : (
        <ul className="habit-list">
          {habits.map(h => {
            const streak = calcStreak(h.dates);
            return (
              <li key={h.id} className="habit-item">
                {editingId === h.id ? (
                  <div className="task-edit-row">
                    <input
                      className="text-input"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(h.id)}
                      autoFocus
                    />
                    <div className="task-edit-actions">
                      <button type="button" className="ghost-btn" onClick={cancelEdit}>Cancelar</button>
                      <button type="button" className="primary-btn" onClick={() => saveEdit(h.id)}>Guardar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="habit-head">
                      <span className="habit-name">{h.name}</span>
                      {streak > 0 && <span className="habit-streak">🔥 {streak}</span>}
                      <button type="button" className="edit-btn" onClick={() => startEdit(h)} aria-label="Renombrar hábito">✎</button>
                      <button type="button" className="remove-btn" onClick={() => removeHabit(h.id)} aria-label="Eliminar hábito">×</button>
                    </div>
                    <div className="habit-strip">
                      {last7.map(dk => (
                        <button
                          key={dk}
                          type="button"
                          className={`habit-dot ${h.dates.includes(dk) ? 'done' : ''} ${dk === todayKey ? 'today' : ''}`}
                          onClick={() => toggleDate(h.id, dk)}
                          aria-label={dk}
                        />
                      ))}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CompraTab({ items, onChange, onClearAll }) {
  const [text, setText] = useState('');
  const [checking, setChecking] = useState([]);
  const itemsRef = useRef(items);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => () => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
  }, []);

  function addItem() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange([...items, { id: uid(), text: trimmed }]);
    setText('');
  }

  function checkItem(id) {
    setChecking(c => [...c, id]);
    const t = setTimeout(() => {
      onChange(itemsRef.current.filter(i => i.id !== id));
      setChecking(c => c.filter(x => x !== id));
    }, 450);
    timeoutsRef.current.push(t);
  }

  function clearAll() {
    onClearAll();
  }

  return (
    <div className="module-panel">
      <div className="team-search-row">
        <input
          className="text-input"
          placeholder="Añadir a la lista…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        <button type="button" className="add-btn" onClick={addItem}>+</button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Lista vacía. Añade lo que necesites comprar.</div>
      ) : (
        <>
          <ul className="task-list">
            {items.map(it => (
              <li key={it.id} className={`task-item ${checking.includes(it.id) ? 'done' : ''}`}>
                <button type="button" className="checkbox" onClick={() => checkItem(it.id)} aria-label="Comprado">
                  {checking.includes(it.id) && <span>✓</span>}
                </button>
                <span className="task-text">{it.text}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="add-event-btn" onClick={clearAll}>Vaciar lista</button>
        </>
      )}
    </div>
  );
}

function CapsulaTab({ capsules, onChange, onDelete }) {
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

function DatosTab({ tasks, habits, capsulas }) {
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

  const last14 = Array.from({ length: 14 }, (_, i) => dateKey(addDays(new Date(), i - 13)));
  const totalHabits = habits.length;

  function dayIntensity(dk) {
    if (totalHabits === 0) return 0;
    const count = habits.filter(h => h.dates.includes(dk)).length;
    return count / totalHabits;
  }

  const longestStreak = habits.reduce((max, h) => {
    const sortedDates = [...h.dates].sort();
    let longest = 0, current = 0, prevDate = null;
    for (const dk of sortedDates) {
      if (prevDate) {
        const diff = (new Date(dk) - new Date(prevDate)) / 86400000;
        current = diff === 1 ? current + 1 : 1;
      } else {
        current = 1;
      }
      longest = Math.max(longest, current);
      prevDate = dk;
    }
    return Math.max(max, longest);
  }, 0);

  const openedCapsules = capsulas.filter(c => c.opened).length;
  const totalCapsulas = capsulas.length;

  return (
    <div className="module-panel">
      <div className="stat-grid">
        <div className="stat-box tech-frame">
          <span className="stat-value">{completionRate}%</span>
          <span className="stat-label">Tareas completadas</span>
        </div>
        <div className="stat-box tech-frame">
          <span className="stat-value">{longestStreak}</span>
          <span className="stat-label">Racha máxima</span>
        </div>
        <div className="stat-box tech-frame">
          <span className="stat-value">{openedCapsules}/{totalCapsulas}</span>
          <span className="stat-label">Cápsulas abiertas</span>
        </div>
      </div>

      {habits.length > 0 ? (
        <div>
          <span className="section-label">Actividad · últimos 14 días</span>
          <div className="heatmap">
            {last14.map(dk => (
              <div key={dk} className="heatmap-cell" style={{ '--intensity': dayIntensity(dk) }} title={dk} />
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">Usa tareas y hábitos unos días y aquí verás tus patrones.</div>
      )}
    </div>
  );
}

function JuegoTab() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const gameRef = useRef(null);
  const lastTimeRef = useRef(null);
  const touchStartX = useRef(null);
  const [state, setState] = useState('idle');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const W = 300, H = 440;
  const LANES = [W / 6, W / 2, (5 * W) / 6];

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get('juego_best', false);
        if (res) setBest(Number(res.value) || 0);
      } catch (e) { /* sin récord todavía */ }
    })();
    drawFrame();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function drawFrame() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g = gameRef.current;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0A0F14';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(77,217,206,0.15)';
    ctx.lineWidth = 1;
    [W / 3, (2 * W) / 3].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    });
    if (!g) return;
    ctx.fillStyle = '#4DD9CE';
    g.coins.forEach(c => {
      ctx.beginPath();
      ctx.arc(LANES[c.lane], c.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#E2637A';
    g.obstacles.forEach(o => {
      ctx.fillRect(LANES[o.lane] - 22, o.y - 13, 44, 26);
    });
    const px = LANES[g.lane];
    const py = H - 70;
    ctx.fillStyle = '#4DD9CE';
    ctx.shadowColor = 'rgba(77,217,206,0.6)';
    ctx.shadowBlur = 10;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(px - 17, py - 17, 34, 34, 8);
      ctx.fill();
    } else {
      ctx.fillRect(px - 17, py - 17, 34, 34);
    }
    ctx.shadowBlur = 0;
  }

  function loop(ts) {
    const g = gameRef.current;
    if (!g || !g.running) return;
    if (lastTimeRef.current === null) lastTimeRef.current = ts;
    const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = ts;

    g.elapsed += dt;
    g.speed = 160 + g.elapsed * 7;
    g.spawnTimer -= dt;

    if (g.spawnTimer <= 0) {
      const lane = Math.floor(Math.random() * 3);
      if (Math.random() < 0.25) {
        g.coins.push({ lane, y: -20 });
      } else {
        g.obstacles.push({ lane, y: -20 });
      }
      g.spawnTimer = Math.max(0.45, 0.9 - g.elapsed * 0.01);
    }

    g.obstacles.forEach(o => { o.y += g.speed * dt; });
    g.coins.forEach(c => { c.y += g.speed * dt; });

    const playerY = H - 70;
    let crashed = false;
    for (const o of g.obstacles) {
      if (o.lane === g.lane && Math.abs(o.y - playerY) < 22) {
        crashed = true;
        break;
      }
    }
    for (const c of g.coins) {
      if (!c.taken && c.lane === g.lane && Math.abs(c.y - playerY) < 20) {
        c.taken = true;
        g.coinsCollected += 1;
      }
    }
    g.coins = g.coins.filter(c => !c.taken && c.y < H + 20);
    g.obstacles = g.obstacles.filter(o => o.y < H + 20);

    const liveScore = Math.floor(g.elapsed * 10) + g.coinsCollected * 15;
    setScore(liveScore);
    drawFrame();

    if (crashed) {
      g.running = false;
      finishGame(liveScore);
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function startGame() {
    gameRef.current = {
      lane: 1,
      obstacles: [],
      coins: [],
      speed: 160,
      elapsed: 0,
      spawnTimer: 0.6,
      coinsCollected: 0,
      running: true,
    };
    lastTimeRef.current = null;
    setScore(0);
    setState('playing');
    rafRef.current = requestAnimationFrame(loop);
  }

  async function finishGame(finalScore) {
    setState('over');
    if (finalScore > best) {
      setBest(finalScore);
      try {
        await window.storage.set('juego_best', String(finalScore), false);
      } catch (e) { /* no se pudo guardar el récord */ }
    }
  }

  function moveLane(dir) {
    const g = gameRef.current;
    if (!g || !g.running) return;
    g.lane = Math.min(2, Math.max(0, g.lane + dir));
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 30) moveLane(dx > 0 ? 1 : -1);
    touchStartX.current = null;
  }

  return (
    <div className="module-panel">
      <div className="section-head">
        <span className="section-label">Esquiva</span>
        <span className="game-best">Mejor: {best}</span>
      </div>

      <div className="game-wrap">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="game-canvas"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
        {state !== 'playing' && (
          <div className="game-overlay">
            {state === 'over' && (
              <>
                <span className="game-over-score">{score} pts</span>
                <span className="game-over-label">{score >= best && score > 0 ? '¡Nuevo récord!' : 'Fin de la partida'}</span>
              </>
            )}
            <button type="button" className="primary-btn" onClick={startGame}>
              {state === 'idle' ? 'Jugar' : 'Reintentar'}
            </button>
          </div>
        )}
      </div>

      {state === 'playing' && <div className="game-score-live">{score} pts</div>}

      <div className="game-controls">
        <button type="button" className="game-btn" onClick={() => moveLane(-1)} disabled={state !== 'playing'} aria-label="Carril izquierdo">‹</button>
        <button type="button" className="game-btn" onClick={() => moveLane(1)} disabled={state !== 'playing'} aria-label="Carril derecho">›</button>
      </div>
      <p className="game-hint">Desliza o usa los botones para cambiar de carril y esquivar</p>
    </div>
  );
}

function NotasTab({ notas, onChange, onDelete }) {
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

function TiempoTab({ tiempo, data, status, onNavigate }) {
  return (
    <div className="module-panel">
      <div className="section-head">
        <span className="section-label">{tiempo.city || 'Tiempo'}</span>
        <button type="button" className="gear-btn" onClick={() => onNavigate('ajustes')}>Ajustes ⚙</button>
      </div>

      {status === 'nocity' ? (
        <div className="empty-state">Configura tu ciudad en Ajustes para ver el tiempo.</div>
      ) : status === 'loading' ? (
        <div className="empty-state">Cargando previsión…</div>
      ) : status === 'error' ? (
        <div className="empty-state">No se ha podido conectar. Inténtalo de nuevo.</div>
      ) : data ? (
        <>
          <div className="weather-now">
            <span className="weather-now-icon">{weatherIcon(data.current.weather_code)}</span>
            <span className="weather-now-temp">{Math.round(data.current.temperature_2m)}°</span>
          </div>
          <div className="weather-days">
            {data.daily.time.slice(0, 6).map((d, i) => (
              <div key={d} className="weather-day">
                <span className="weather-day-label">
                  {i === 0 ? 'Hoy' : DIAS_CORTO[(new Date(`${d}T00:00:00`).getDay() + 6) % 7]}
                </span>
                <span className="weather-day-icon">{weatherIcon(data.daily.weather_code[i])}</span>
                <span className="weather-day-temps">
                  <span className="weather-max">{Math.round(data.daily.temperature_2m_max[i])}°</span>
                  <span className="weather-min">{Math.round(data.daily.temperature_2m_min[i])}°</span>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function RuletaTab({ items, onChange, onDelete }) {
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

function Home({ tasks, events, habits, compra, capsulas, footballMatches, footballConfig, weatherData, onNavigate, onCompleteTask, onToggleHabit }) {
  const todayKey = dateKey(new Date());
  const order = { alta: 0, media: 1, baja: 2 };

  const pendingTasks = tasks.filter(t => !t.done);
  const urgentTasks = [...pendingTasks].sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 3);
  const doneCount = tasks.filter(t => t.done).length;
  const completionRate = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);

  const todayEvents = eventsOnDate(events, todayKey);

  const habitsToday = habits.filter(h => h.dates.includes(todayKey));
  const habitsPending = habits.filter(h => !h.dates.includes(todayKey));

  const readyCapsule = capsulas.find(c => !c.opened && c.openDate <= todayKey);

  const futbolConfigured = footballConfig.leagues.length > 0 || footballConfig.teams.length > 0;

  const ICON = { event: '📅', match: '⚽', capsule: '⏳', habit: '🔥' };
  const dayEntries = [];
  todayEvents.forEach(ev => dayEntries.push({ type: 'event', key: `ev-${ev.id}`, time: ev.time, label: ev.title }));
  footballMatches.forEach(m => dayEntries.push({ type: 'match', key: `m-${m.id}`, time: m.time, label: `${m.home} - ${m.away}` }));
  if (readyCapsule) dayEntries.push({ type: 'capsule', key: 'cap', time: '', label: 'Cápsula lista para abrir' });
  habitsPending.forEach(h => dayEntries.push({ type: 'habit', key: `h-${h.id}`, time: '', label: `${h.name} sin marcar hoy`, habitId: h.id }));
  dayEntries.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  function goTo(type) {
    if (type === 'event') onNavigate('calendario');
    else if (type === 'match') onNavigate('entretenimiento');
    else if (type === 'capsule') onNavigate('capsula');
    else onNavigate('habitos');
  }

  return (
    <div className="home-dash">
      <div className="kpi-strip">
        <div className="kpi-box tech-frame">
          <span className="kpi-value">{pendingTasks.length}</span>
          <span className="kpi-label">Pendientes</span>
        </div>
        <div className="kpi-box tech-frame">
          <span className="kpi-value">{todayEvents.length}</span>
          <span className="kpi-label">Hoy</span>
        </div>
        <div className="kpi-box tech-frame">
          <span className="kpi-value">{habitsToday.length}/{habits.length}</span>
          <span className="kpi-label">Hábitos</span>
        </div>
        <div className="kpi-box tech-frame">
          <span className="kpi-value">{completionRate}%</span>
          <span className="kpi-label">Productividad</span>
        </div>
      </div>

      <div className="dash-section">
        <div className="dash-section-head">
          <span className="section-label">Tareas urgentes</span>
          <button type="button" className="dash-link" onClick={() => onNavigate('tareas')}>Ver todas ›</button>
        </div>
        {urgentTasks.length === 0 ? (
          <div className="empty-state">Sin tareas pendientes ✓</div>
        ) : (
          <ul className="dash-task-list">
            {urgentTasks.map(t => (
              <li
                key={t.id}
                className="dash-task-row"
                style={{ '--chip-color': PRIORIDADES[t.priority].color }}
                onClick={() => onNavigate('tareas')}
              >
                <span className="dash-task-dot" />
                <span className="dash-task-text">{t.text}</span>
                <button
                  type="button"
                  className="dash-task-check"
                  onClick={(e) => { e.stopPropagation(); onCompleteTask(t.id); }}
                  aria-label="Completar tarea"
                >
                  ✓
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dash-section">
        <div className="dash-section-head">
          <span className="section-label">Resumen del día</span>
        </div>
        {dayEntries.length === 0 ? (
          <div className="empty-state">Día tranquilo. Nada pendiente por ahora.</div>
        ) : (
          <ul className="dash-day-list">
            {dayEntries.slice(0, 6).map(e => (
              <li key={e.key} className="dash-day-row" onClick={() => goTo(e.type)}>
                <span className="dash-day-icon">{ICON[e.type]}</span>
                {e.time && <span className="dash-day-time">{e.time}</span>}
                <span className="dash-day-label">{e.label}</span>
                {e.type === 'habit' && (
                  <button
                    type="button"
                    className="dash-task-check"
                    onClick={(ev) => { ev.stopPropagation(); onToggleHabit(e.habitId); }}
                    aria-label="Marcar hábito de hoy"
                  >
                    ✓
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dash-section">
        <span className="section-label">Accesos rápidos</span>
        <div className="quick-row">
          <button type="button" className="quick-chip" onClick={() => onNavigate('entretenimiento')}>
            ⚽ {futbolConfigured ? `${footballMatches.length} hoy` : 'Fútbol'}
          </button>
          <button type="button" className="quick-chip" onClick={() => onNavigate('compra')}>
            🛒 {compra.length === 0 ? 'Compra' : `${compra.length}`}
          </button>
          <button type="button" className="quick-chip" onClick={() => onNavigate('capsula')}>⏳ Cápsula</button>
          <button type="button" className="quick-chip" onClick={() => onNavigate('notas')}>📝 Notas</button>
          <button type="button" className="quick-chip" onClick={() => onNavigate('datos')}>📊 Datos</button>
          <button type="button" className="quick-chip" onClick={() => onNavigate('juego')}>🎮 Jugar</button>
          <button type="button" className="quick-chip" onClick={() => onNavigate('tiempo')}>
            {weatherData ? `${weatherIcon(weatherData.current.weather_code)} ${Math.round(weatherData.current.temperature_2m)}°` : '🌤️ Tiempo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [entertainment, setEntertainment] = useState(DEFAULT_ENTRETENIMIENTO);
  const [habits, setHabits] = useState([]);
  const [compra, setCompra] = useState([]);
  const [capsulas, setCapsulas] = useState([]);
  const [notas, setNotas] = useState([]);
  const [tiempo, setTiempo] = useState(DEFAULT_TIEMPO);
  const [ruleta, setRuleta] = useState([]);
  const [notificaciones, setNotificaciones] = useState(DEFAULT_NOTIFICACIONES);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('idle');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const [footballMatches, setFootballMatches] = useState([]);
  const [footballStatus, setFootballStatus] = useState('idle');

  function showToast(message, action) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, action });
    toastTimerRef.current = setTimeout(() => setToast(null), action ? 5000 : 2400);
  }

  useEffect(() => {
    let cancelled = false;
    async function load(key, fallback) {
      try {
        const res = await window.storage.get(key, false);
        return res ? JSON.parse(res.value) : fallback;
      } catch (e) {
        return fallback;
      }
    }
    (async () => {
      const [t, e, ent, h, c, cap, n, tm, r, notif] = await Promise.all([
        load('tareas', []),
        load('calendario', []),
        load('entretenimiento', null),
        load('habitos', []),
        load('compra', []),
        load('capsulas', []),
        load('notas', []),
        load('tiempo', null),
        load('ruleta', []),
        load('notificaciones', null),
      ]);
      if (!cancelled) {
        setTasks(t);
        setEvents(e);
        setEntertainment(ent && ent.futbol && ent.estrenos ? ent : DEFAULT_ENTRETENIMIENTO);
        setHabits(h);
        setCompra(c);
        setCapsulas(cap);
        setNotas(n);
        setTiempo(tm && typeof tm.lat !== 'undefined' ? tm : DEFAULT_TIEMPO);
        setRuleta(r);
        setNotificaciones(notif && notif.manana ? notif : DEFAULT_NOTIFICACIONES);
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchFootball() {
      const { leagues, teams } = entertainment.futbol;
      if (leagues.length === 0 && teams.length === 0) {
        setFootballMatches([]);
        setFootballStatus('ok');
        return;
      }
      setFootballStatus('loading');
      try {
        const todayKey = dateKey(new Date());
        const results = [];
        for (const leagueId of leagues) {
          const liga = LIGAS_FUTBOL.find(l => l.id === leagueId);
          if (!liga) continue;
          const url = `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${todayKey}&l=${encodeURIComponent(liga.apiName)}`;
          const res = await fetch(url);
          const data = await res.json();
          (data.events || []).forEach(ev => {
            const { time, date } = utcToLocal(ev.dateEvent, ev.strTime);
            if (date !== todayKey) return;
            results.push({
              id: ev.idEvent, home: ev.strHomeTeam, away: ev.strAwayTeam,
              homeScore: ev.intHomeScore, awayScore: ev.intAwayScore,
              time, competition: liga.name, date,
            });
          });
        }
        for (const team of teams) {
          const url = `https://www.thesportsdb.com/api/v1/json/123/eventsnext.php?id=${team.id}`;
          const res = await fetch(url);
          const data = await res.json();
          (data.events || []).forEach(ev => {
            const { time, date } = utcToLocal(ev.dateEvent, ev.strTime);
            if (date !== todayKey) return;
            if (results.some(r => r.id === ev.idEvent)) return;
            results.push({
              id: ev.idEvent, home: ev.strHomeTeam, away: ev.strAwayTeam,
              homeScore: ev.intHomeScore, awayScore: ev.intAwayScore,
              time, competition: ev.strLeague, date,
            });
          });
        }
        results.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
        if (!cancelled) {
          setFootballMatches(results);
          setFootballStatus('ok');
        }
      } catch (e) {
        if (!cancelled) setFootballStatus('error');
      }
    }
    fetchFootball();
    return () => { cancelled = true; };
  }, [entertainment.futbol.leagues, entertainment.futbol.teams]);

  useEffect(() => {
    let cancelled = false;
    async function fetchWeather() {
      if (!tiempo.lat || !tiempo.lon) {
        setWeatherStatus('nocity');
        return;
      }
      setWeatherStatus('loading');
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${tiempo.lat}&longitude=${tiempo.lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('bad response');
        const data = await res.json();
        if (!cancelled) {
          setWeatherData(data);
          setWeatherStatus('ok');
        }
      } catch (e) {
        if (!cancelled) setWeatherStatus('error');
      }
    }
    fetchWeather();
    return () => { cancelled = true; };
  }, [tiempo.lat, tiempo.lon]);

  const persist = useCallback(async (key, value) => {
    try {
      const res = await window.storage.set(key, JSON.stringify(value), false);
      if (!res) showToast('No se pudo guardar. Inténtalo de nuevo.');
    } catch (e) {
      showToast('No se pudo guardar. Inténtalo de nuevo.');
    }
  }, []);

  function updateTasks(next) { setTasks(next); persist('tareas', next); }
  function updateEvents(next) { setEvents(next); persist('calendario', next); }
  function updateEntertainment(next) { setEntertainment(next); persist('entretenimiento', next); }
  function updateHabits(next) { setHabits(next); persist('habitos', next); }
  function updateCompra(next) { setCompra(next); persist('compra', next); }
  function updateCapsulas(next) { setCapsulas(next); persist('capsulas', next); }
  function updateNotificaciones(next) { setNotificaciones(next); persist('notificaciones', next); }

  const capsulaCheckedRef = useRef(false);
  useEffect(() => {
    if (!loaded || capsulaCheckedRef.current || !notificaciones.capsula) return;
    capsulaCheckedRef.current = true;
    const todayKey = dateKey(new Date());
    const readyToday = capsulas.filter(c => !c.opened && c.openDate === todayKey);
    readyToday.forEach(() => {
      Notificaciones.mostrarAhora('Cápsula del tiempo', 'Tienes una cápsula lista para abrir hoy.');
    });
    // Aviso interino: solo salta si la app está abierta el día que toca.
    // Con la app cerrada, esto llegará cuando pasemos a notificaciones nativas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, capsulas, notificaciones.capsula]);
  function updateNotas(next) { setNotas(next); persist('notas', next); }
  function updateTiempo(next) { setTiempo(next); persist('tiempo', next); }
  function updateRuleta(next) { setRuleta(next); persist('ruleta', next); }

  function deleteTask(id) {
    const prev = tasks;
    updateTasks(tasks.filter(t => t.id !== id));
    showToast('Tarea eliminada', { label: 'Deshacer', onClick: () => updateTasks(prev) });
  }
  function deleteEvent(id) {
    const prev = events;
    updateEvents(events.filter(e => e.id !== id));
    showToast('Evento eliminado', { label: 'Deshacer', onClick: () => updateEvents(prev) });
  }
  function deleteHabit(id) {
    const prev = habits;
    updateHabits(habits.filter(h => h.id !== id));
    showToast('Hábito eliminado', { label: 'Deshacer', onClick: () => updateHabits(prev) });
  }
  function deleteCapsula(id) {
    const prev = capsulas;
    updateCapsulas(capsulas.filter(c => c.id !== id));
    showToast('Cápsula eliminada', { label: 'Deshacer', onClick: () => updateCapsulas(prev) });
  }
  function deleteNota(id) {
    const prev = notas;
    updateNotas(notas.filter(n => n.id !== id));
    showToast('Nota eliminada', { label: 'Deshacer', onClick: () => updateNotas(prev) });
  }
  function clearCompra() {
    const prev = compra;
    updateCompra([]);
    showToast('Lista vaciada', { label: 'Deshacer', onClick: () => updateCompra(prev) });
  }
  function deleteRuletaOption(id) {
    const prev = ruleta;
    updateRuleta(ruleta.filter(r => r.id !== id));
    showToast('Opción eliminada', { label: 'Deshacer', onClick: () => updateRuleta(prev) });
  }

  function completeTaskFromHome(id) {
    updateTasks(tasks.map(t => (t.id === id ? { ...t, done: true } : t)));
  }
  function toggleHabitFromHome(id) {
    const todayKey = dateKey(new Date());
    updateHabits(habits.map(h => {
      if (h.id !== id) return h;
      const has = h.dates.includes(todayKey);
      return { ...h, dates: has ? h.dates.filter(d => d !== todayKey) : [...h.dates, todayKey] };
    }));
  }

  const now = new Date();
  const todayLabel = `${DIAS[(now.getDay() + 6) % 7]}, ${now.getDate()} de ${MESES[now.getMonth()]}`;
  const currentLabel = NAV_ITEMS.find(i => i.key === activeView);

  const searchIndex = [
    ...tasks.map(t => ({ id: `t-${t.id}`, view: 'tareas', icon: '✓', label: t.text, sub: PRIORIDADES[t.priority].label })),
    ...notas.map(n => ({ id: `n-${n.id}`, view: 'notas', icon: '📝', label: n.text, sub: 'Nota' })),
    ...events.map(e => ({ id: `e-${e.id}`, view: 'calendario', icon: '📅', label: e.title, sub: e.time || 'Evento' })),
    ...compra.map(c => ({ id: `c-${c.id}`, view: 'compra', icon: '🛒', label: c.text, sub: 'Compra' })),
    ...habits.map(h => ({ id: `h-${h.id}`, view: 'habitos', icon: '🔥', label: h.name, sub: 'Hábito' })),
  ];
  const searchQueryTrim = searchQuery.trim().toLowerCase();
  const searchResults = searchQueryTrim
    ? searchIndex.filter(it => it.label.toLowerCase().includes(searchQueryTrim)).slice(0, 30)
    : [];

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery('');
  }

  if (!loaded) {
    return (
      <div className="app-shell">
        <style>{styles}</style>
        <div className="loading">Cargando tu panel…</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <style>{styles}</style>
      <header className="app-header">
        <div className="header-row">
          <button type="button" className="hamburger-btn" onClick={() => setDrawerOpen(true)} aria-label="Abrir menú">
            <span></span><span></span><span></span>
          </button>
          <div className="header-titles" onClick={() => setActiveView('home')}>
            <span className="eyebrow">{todayLabel}</span>
            <h1 className="app-title">PANEL</h1>
          </div>
          <button type="button" className="search-btn" onClick={() => setSearchOpen(true)} aria-label="Buscar">🔍</button>
        </div>
        <span className="privacy-note">🔒 privado · solo tú lo ves</span>
      </header>

      <main className="app-card">
        {activeView !== 'home' && (
          <div className="view-head">
            <button type="button" className="view-back" onClick={() => setActiveView('home')}>‹ Inicio</button>
            <span className="view-title">{currentLabel ? currentLabel.label : ''}</span>
          </div>
        )}

        {activeView === 'home' && (
          <Home
            tasks={tasks}
            events={events}
            habits={habits}
            compra={compra}
            capsulas={capsulas}
            footballMatches={footballMatches}
            footballConfig={entertainment.futbol}
            weatherData={weatherData}
            onNavigate={setActiveView}
            onCompleteTask={completeTaskFromHome}
            onToggleHabit={toggleHabitFromHome}
          />
        )}
        {activeView === 'tareas' && <TareasTab tasks={tasks} onChange={updateTasks} onDelete={deleteTask} />}
        {activeView === 'calendario' && <CalendarioTab events={events} onChange={updateEvents} onDelete={deleteEvent} />}
        {activeView === 'entretenimiento' && (
          <EntretenimientoTab data={entertainment} matches={footballMatches} matchesStatus={footballStatus} onNavigate={setActiveView} />
        )}
        {activeView === 'habitos' && <HabitosTab habits={habits} onChange={updateHabits} onDelete={deleteHabit} />}
        {activeView === 'compra' && <CompraTab items={compra} onChange={updateCompra} onClearAll={clearCompra} />}
        {activeView === 'capsula' && <CapsulaTab capsules={capsulas} onChange={updateCapsulas} onDelete={deleteCapsula} />}
        {activeView === 'datos' && <DatosTab tasks={tasks} habits={habits} capsulas={capsulas} />}
        {activeView === 'juego' && <JuegoTab />}
        {activeView === 'notas' && <NotasTab notas={notas} onChange={updateNotas} onDelete={deleteNota} />}
        {activeView === 'ruleta' && <RuletaTab items={ruleta} onChange={updateRuleta} onDelete={deleteRuletaOption} />}
        {activeView === 'tiempo' && <TiempoTab tiempo={tiempo} data={weatherData} status={weatherStatus} onNavigate={setActiveView} />}
        {activeView === 'ajustes' && (
          <AjustesTab
            entertainment={entertainment}
            onChangeEntertainment={updateEntertainment}
            tiempo={tiempo}
            onChangeTiempo={updateTiempo}
            notificaciones={notificaciones}
            onChangeNotificaciones={updateNotificaciones}
            tasks={tasks}
            events={events}
            habits={habits}
            footballMatches={footballMatches}
          />
        )}
      </main>

      {searchOpen && (
        <div className="search-backdrop" onClick={closeSearch}>
          <div className="search-panel" onClick={e => e.stopPropagation()}>
            <div className="search-input-row">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Buscar en todo el panel…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="button" className="search-close" onClick={closeSearch} aria-label="Cerrar búsqueda">×</button>
            </div>
            <div className="search-results">
              {searchQueryTrim === '' ? (
                <div className="empty-state">Escribe para buscar en tareas, notas, calendario, compra y hábitos.</div>
              ) : searchResults.length === 0 ? (
                <div className="empty-state">Sin resultados para "{searchQuery}"</div>
              ) : (
                <ul className="search-result-list">
                  {searchResults.map(r => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="search-result-item"
                        onClick={() => { setActiveView(r.view); closeSearch(); }}
                      >
                        <span className="search-result-icon">{r.icon}</span>
                        <span className="search-result-text">{r.label}</span>
                        <span className="search-result-type">{r.sub}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <nav className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-head">
              <span className="app-title" style={{ fontSize: '19px' }}>PANEL</span>
              <button type="button" className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Cerrar menú">×</button>
            </div>
            <ul className="drawer-list">
              <li>
                <button
                  type="button"
                  className={`drawer-item ${activeView === 'home' ? 'active' : ''}`}
                  onClick={() => { setActiveView('home'); setDrawerOpen(false); }}
                >
                  <span className="drawer-icon">🏠</span> Inicio
                </button>
              </li>
              {NAV_ITEMS.map(item => (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`drawer-item ${activeView === item.key ? 'active' : ''}`}
                    onClick={() => { setActiveView(item.key); setDrawerOpen(false); }}
                  >
                    <span className="drawer-icon">{item.icon}</span> {item.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="drawer-item drawer-future"
                  onClick={() => { showToast('Aquí podrás añadir tus propios apartados en el futuro'); setDrawerOpen(false); }}
                >
                  <span className="drawer-icon">+</span> Añadir apartado
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {toast && (
        <div className="toast">
          <span>{toast.message}</span>
          {toast.action && (
            <button type="button" className="toast-action" onClick={toast.action.onClick}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
