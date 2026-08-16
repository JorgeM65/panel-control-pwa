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
.weather-day-temps { display: flex; flex-direction: column; align-items: center; font-family
