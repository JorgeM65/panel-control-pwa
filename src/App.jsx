import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DIAS, DIAS_CORTO, MESES, PRIORIDADES, LIGAS_FUTBOL,
  NAV_ITEMS, NAV_GROUPS, DEFAULT_ENTRETENIMIENTO, DEFAULT_TIEMPO,
  DEFAULT_NOTIFICACIONES, CATEGORIAS_GASTO,
} from './constants';
import {
  uid, startOfWeek, addDays, dateKey, utcToLocal, formatFullDate, formatShort,
  daysUntil, nextOccurrence, yearsFor, eventsOnDate,
} from './utils/dates';
import styles from './styles/theme';
import { Notificaciones } from './utils/notifications';
import { CompraTab } from './modules/compra/CompraTab';
import { JuegoTab } from './modules/juego/JuegoTab';
import { NotasTab } from './modules/notas/NotasTab';
import { CapsulaTab } from './modules/capsula/CapsulaTab';
import { DatosTab } from './modules/datos/DatosTab';
import { RuletaTab } from './modules/ruleta/RuletaTab';
import { FechasTab } from './modules/fechas/FechasTab';
import { TiempoTab } from './modules/tiempo/TiempoTab';
import { AjustesTab } from './modules/ajustes/AjustesTab';
import { EstrenosTab } from './modules/estrenos/EstrenosTab';
import { FutbolTab } from './modules/futbol/FutbolTab';

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

function FinanzasTab({ gastos, onChange, onDelete }) {
  const [concepto, setConcepto] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [categoria, setCategoria] = useState('otros');
  const [fecha, setFecha] = useState(dateKey(new Date()));

  function addGasto() {
    const trimmed = concepto.trim();
    const monto = Number(cantidad);
    if (!trimmed || !cantidad || isNaN(monto) || monto <= 0) return;
    onChange([...gastos, { id: uid(), concepto: trimmed, cantidad: monto, categoria, fecha }]);
    setConcepto('');
    setCantidad('');
  }

  function removeGasto(id) {
    onDelete(id);
  }

  const mesActual = dateKey(new Date()).slice(0, 7);
  const gastosMes = gastos.filter(g => g.fecha.slice(0, 7) === mesActual);
  const totalMes = gastosMes.reduce((sum, g) => sum + g.cantidad, 0);

  const porCategoria = CATEGORIAS_GASTO
    .map(c => ({ ...c, total: gastosMes.filter(g => g.categoria === c.id).reduce((sum, g) => sum + g.cantidad, 0) }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const sorted = [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="module-panel">
      <div className="stat-box tech-frame">
        <span className="stat-value">{totalMes.toFixed(2)}€</span>
        <span className="stat-label">Gastado este mes</span>
      </div>

      <div className="config-panel">
        <input className="text-input" placeholder="Concepto…" value={concepto} onChange={e => setConcepto(e.target.value)} />
        <div className="team-search-row">
          <input
            className="text-input"
            inputMode="decimal"
            placeholder="Importe (€)"
            value={cantidad}
            onChange={e => setCantidad(e.target.value.replace(/[^\d.]/g, ''))}
          />
          <input className="text-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </div>
        <div className="chip-row">
          {CATEGORIAS_GASTO.map(c => (
            <button
              key={c.id}
              type="button"
              className={`toggle-chip ${categoria === c.id ? 'active' : ''}`}
              onClick={() => setCategoria(c.id)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <button type="button" className="primary-btn" onClick={addGasto}>Añadir gasto</button>
      </div>

      {porCategoria.length > 0 && (
        <div className="dash-section">
          <span className="section-label">Por categoría este mes</span>
          <ul className="wheel-list">
            {porCategoria.map(c => (
              <li key={c.id} className="wheel-list-item">
                <span className="wheel-list-text">{c.icon} {c.label}</span>
                <span className="fecha-meta">{c.total.toFixed(2)}€</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dash-section">
        <span className="section-label">Historial</span>
        {sorted.length === 0 ? (
          <div className="empty-state">Sin gastos todavía. Apunta el primero arriba.</div>
        ) : (
          <ul className="wheel-list">
            {sorted.map(g => {
              const cat = CATEGORIAS_GASTO.find(c => c.id === g.categoria);
              return (
                <li key={g.id} className="wheel-list-item">
                  <span className="wheel-list-text">{cat ? cat.icon : ''} {g.concepto}</span>
                  <span className="fecha-meta">{formatShort(g.fecha)} · {g.cantidad.toFixed(2)}€</span>
                  <button type="button" className="remove-btn" onClick={() => removeGasto(g.id)} aria-label="Eliminar gasto">×</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Home({ tasks, events, habits, compra, capsulas, footballMatches, footballConfig, weatherData, fechas, onNavigate, onCompleteTask, onToggleHabit }) {
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
  const todayFechas = (fechas || []).filter(f => nextOccurrence(f.fecha) === todayKey);

  const futbolConfigured = footballConfig.leagues.length > 0 || footballConfig.teams.length > 0;

  const ICON = { event: '📅', match: '⚽', capsule: '⏳', habit: '🔥', fecha: '🎂' };
  const dayEntries = [];
  todayFechas.forEach(f => dayEntries.push({ type: 'fecha', key: `f-${f.id}`, time: '', label: f.nombre }));
  todayEvents.forEach(ev => dayEntries.push({ type: 'event', key: `ev-${ev.id}`, time: ev.time, label: ev.title }));
  footballMatches.forEach(m => dayEntries.push({ type: 'match', key: `m-${m.id}`, time: m.time, label: `${m.home} - ${m.away}` }));
  if (readyCapsule) dayEntries.push({ type: 'capsule', key: 'cap', time: '', label: 'Cápsula lista para abrir' });
  habitsPending.forEach(h => dayEntries.push({ type: 'habit', key: `h-${h.id}`, time: '', label: `${h.name} sin marcar hoy`, habitId: h.id }));
  dayEntries.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  function goTo(type) {
    if (type === 'event') onNavigate('calendario');
    else if (type === 'match') onNavigate('futbol');
    else if (type === 'capsule') onNavigate('capsula');
    else if (type === 'fecha') onNavigate('fechas');
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
          <button type="button" className="quick-chip" onClick={() => onNavigate('futbol')}>
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
  const [fechas, setFechas] = useState([]);
  const [predicciones, setPredicciones] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('idle');
  const [refreshSignal, setRefreshSignal] = useState(0);
  function triggerRefresh() {
    setRefreshSignal(s => s + 1);
  }
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
      const [t, e, ent, h, c, cap, n, tm, r, notif, fch, pred, gst] = await Promise.all([
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
        load('fechas', []),
        load('predicciones', []),
        load('gastos', []),
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
        setFechas(fch);
        setPredicciones(pred);
        setGastos(gst);
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
          const url = `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${todayKey}&l=${liga.idLeague}`;
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
  }, [entertainment.futbol.leagues, entertainment.futbol.teams, refreshSignal]);

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
  }, [tiempo.lat, tiempo.lon, refreshSignal]);

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
  function updateFechas(next) { setFechas(next); persist('fechas', next); }
  function updatePredicciones(next) { setPredicciones(next); persist('predicciones', next); }
  function updateGastos(next) { setGastos(next); persist('gastos', next); }

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
  function deleteFecha(id) {
    const prev = fechas;
    updateFechas(fechas.filter(f => f.id !== id));
    showToast('Fecha eliminada', { label: 'Deshacer', onClick: () => updateFechas(prev) });
  }
  function deletePrediccion(id) {
    const prev = predicciones;
    updatePredicciones(predicciones.filter(p => p.id !== id));
    showToast('Predicción eliminada', { label: 'Deshacer', onClick: () => updatePredicciones(prev) });
  }
  function deleteGasto(id) {
    const prev = gastos;
    updateGastos(gastos.filter(g => g.id !== id));
    showToast('Gasto eliminado', { label: 'Deshacer', onClick: () => updateGastos(prev) });
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
            fechas={fechas}
            weatherData={weatherData}
            onNavigate={setActiveView}
            onCompleteTask={completeTaskFromHome}
            onToggleHabit={toggleHabitFromHome}
          />
        )}
        {activeView === 'tareas' && <TareasTab tasks={tasks} onChange={updateTasks} onDelete={deleteTask} />}
        {activeView === 'calendario' && <CalendarioTab events={events} onChange={updateEvents} onDelete={deleteEvent} />}
        {activeView === 'futbol' && (
          <FutbolTab
            data={entertainment}
            matches={footballMatches}
            matchesStatus={footballStatus}
            predicciones={predicciones}
            onChangePredicciones={updatePredicciones}
            onDeletePrediccion={deletePrediccion}
            onNavigate={setActiveView}
            refreshSignal={refreshSignal}
            onRefresh={triggerRefresh}
          />
        )}
        {activeView === 'estrenos' && (
          <EstrenosTab
            config={entertainment.estrenos}
            onNavigate={setActiveView}
            refreshSignal={refreshSignal}
            onRefresh={triggerRefresh}
          />
        )}
        {activeView === 'habitos' && <HabitosTab habits={habits} onChange={updateHabits} onDelete={deleteHabit} />}
        {activeView === 'compra' && <CompraTab items={compra} onChange={updateCompra} onClearAll={clearCompra} />}
        {activeView === 'capsula' && <CapsulaTab capsules={capsulas} onChange={updateCapsulas} onDelete={deleteCapsula} />}
        {activeView === 'fechas' && <FechasTab fechas={fechas} onChange={updateFechas} onDelete={deleteFecha} />}
        {activeView === 'finanzas' && <FinanzasTab gastos={gastos} onChange={updateGastos} onDelete={deleteGasto} />}
        {activeView === 'datos' && <DatosTab tasks={tasks} habits={habits} capsulas={capsulas} />}
        {activeView === 'juego' && <JuegoTab />}
        {activeView === 'notas' && <NotasTab notas={notas} onChange={updateNotas} onDelete={deleteNota} />}
        {activeView === 'ruleta' && <RuletaTab items={ruleta} onChange={updateRuleta} onDelete={deleteRuletaOption} />}
        {activeView === 'tiempo' && (
          <TiempoTab tiempo={tiempo} data={weatherData} status={weatherStatus} onNavigate={setActiveView} onRefresh={triggerRefresh} />
        )}
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
            fechas={fechas}
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
              {NAV_GROUPS.map(group => (
                <li key={group.label} className="drawer-group">
                  <span className="drawer-group-label">{group.label}</span>
                  <ul className="drawer-group-list">
                    {group.items.map(key => {
                      const item = NAV_ITEMS.find(i => i.key === key);
                      if (!item) return null;
                      return (
                        <li key={item.key}>
                          <button
                            type="button"
                            className={`drawer-item ${activeView === item.key ? 'active' : ''}`}
                            onClick={() => { setActiveView(item.key); setDrawerOpen(false); }}
                          >
                            <span className="drawer-icon">{item.icon}</span> {item.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
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
