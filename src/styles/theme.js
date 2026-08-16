// Estilos de la app, extraídos tal cual de App.jsx (Fase 2 de la refactorización).
// CSS-in-JS puro, sin interpolación de variables — movimiento mecánico, sin cambios de diseño.
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
.drawer-group { margin-bottom: 4px; }
.drawer-group-label {
  display: block; padding: 12px 18px 4px; font-family: var(--font-mono); font-size: 9.5px;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-dim); opacity: 0.65;
}
.drawer-group-list { list-style: none; margin: 0; padding: 0; }
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
.section-head-actions { display: flex; align-items: center; gap: 10px; }
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

.fecha-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.fecha-item { display: flex; align-items: center; gap: 10px; background: var(--item-bg); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.fecha-item.today { border-color: var(--cyan); border-width: 2px; }
.fecha-icon { font-size: 18px; flex-shrink: 0; }
.fecha-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.fecha-nombre { font-size: 14px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fecha-meta { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); }

.pred-row { gap: 6px; }
.pred-result-row { align-items: flex-start; }
.pred-result-info { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }

.stats-team-card { background: var(--item-bg); border: 1px solid var(--border); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.stats-team-name { font-size: 14px; color: var(--text); font-weight: 600; }
.stats-form-strip { display: flex; gap: 4px; }
.form-badge { width: 22px; height: 22px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--bg); }
.form-w { background: var(--green); }
.form-d { background: var(--amber); }
.form-l { background: var(--red); }
.table-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.table-row { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 8px; background: var(--item-bg); border: 1px solid var(--border); }
.table-row.favorite { border-color: var(--cyan); border-width: 2px; }
.table-pos { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); width: 20px; flex-shrink: 0; }
.table-team { flex: 1; font-size: 13px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.table-pts { font-family: var(--font-mono); font-size: 11px; color: var(--cyan); flex-shrink: 0; }

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

export default styles;
