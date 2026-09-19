import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DIAS, DIAS_CORTO, MESES, PRIORIDADES, LIGAS_FUTBOL, PLATAFORMAS,
  NAV_ITEMS, NAV_GROUPS, DEFAULT_ENTRETENIMIENTO, DEFAULT_TIEMPO,
  DEFAULT_NOTIFICACIONES, CATEGORIAS_GASTO,
} from './constants';
import {
  uid, startOfWeek, addDays, dateKey, utcToLocal, formatFullDate, formatShort,
  daysUntil, nextOccurrence, yearsFor, eventsOnDate,
} from './utils/dates';
import styles from './styles/theme';
import { CompraTab } from './modules/compra/CompraTab';
import { JuegoTab } from './modules/juego/JuegoTab';
import { NotasTab } from './modules/notas/NotasTab';
import { CapsulaTab } from './modules/capsula/CapsulaTab';
import { DatosTab } from './modules/datos/DatosTab';
import { RuletaTab } from './modules/ruleta/RuletaTab';
import { FechasTab } from './modules/fechas/FechasTab';

function calcPredictionPoints(predHome, predAway, actualHome, actualAway) {
  if (predHome === actualHome && predAway === actualAway) return 3;
  const predOutcome = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
  const actualOutcome = actualHome > actualAway ? 'home' : actualHome < actualAway ? 'away' : 'draw';
  return predOutcome === actualOutcome ? 1 : 0;
}

function buildMorningSummary(tasks, events, footballMatches, footballTeams, fechas) {
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

function FutbolSection({ config, matches, status, onNavigate, onRefresh }) {
  const todayKey = dateKey(new Date());

  return (
    <div>
      <div className="section-head">
        <span className="section-label">Partidos de hoy</span>
        <div className="section-head-actions">
          <button type="button" className="gear-btn" onClick={onRefresh}>🔄</button>
          <button type="button" className="gear-btn" onClick={() => onNavigate('ajustes')}>Ajustes ⚙</button>
        </div>
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

function EstrenosSection({ config, onNavigate, refreshSignal, onRefresh }) {
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
  }, [config.apiKey, config.providers, sub, refreshSignal]);

  return (
    <div>
      <div className="section-head">
        <span className="section-label">Estrenos</span>
        <div className="section-head-actions">
          <button type="button" className="gear-btn" onClick={onRefresh}>🔄</button>
          <button type="button" className="gear-btn" onClick={() => onNavigate('ajustes')}>Ajustes ⚙</button>
        </div>
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

function FutbolTab({ data, matches, matchesStatus, predicciones, onChangePredicciones, onDeletePrediccion, onNavigate, refreshSignal, onRefresh }) {
  const [sub, setSub] = useState('partidos');
  return (
    <div className="module-panel">
      <div className="sub-tabs">
        <button type="button" className={`sub-tab ${sub === 'partidos' ? 'active' : ''}`} onClick={() => setSub('partidos')}>Partidos</button>
        <button type="button" className={`sub-tab ${sub === 'predicciones' ? 'active' : ''}`} onClick={() => setSub('predicciones')}>Predicciones</button>
        <button type="button" className={`sub-tab ${sub === 'estadisticas' ? 'active' : ''}`} onClick={() => setSub('estadisticas')}>Estadísticas</button>
      </div>
      {sub === 'partidos' && (
        <FutbolSection config={data.futbol} matches={matches} status={matchesStatus} onNavigate={onNavigate} onRefresh={onRefresh} />
      )}
      {sub === 'predicciones' && (
        <PrediccionesTab
          predicciones={predicciones}
          footballMatches={matches}
          onChange={onChangePredicciones}
          onDelete={onDeletePrediccion}
          refreshSignal={refreshSignal}
        />
      )}
      {sub === 'estadisticas' && <EstadisticasTab futbolConfig={data.futbol} />}
    </div>
  );
}

function EstrenosTab({ config, onNavigate, refreshSignal, onRefresh }) {
  return (
    <div className="module-panel">
      <EstrenosSection config={config} onNavigate={onNavigate} refreshSignal={refreshSignal} onRefresh={onRefresh} />
    </div>
  );
}

function AjustesTab({
  entertainment, onChangeEntertainment, tiempo, onChangeTiempo,
  notificaciones, onChangeNotificaciones, tasks, events, habits, footballMatches, fechas,
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
    const s = buildMorningSummary(tasks, events, footballMatches, futbol.teams, fechas);
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

function TiempoTab({ tiempo, data, status, onNavigate, onRefresh }) {
  return (
    <div className="module-panel">
      <div className="section-head">
        <span className="section-label">{tiempo.city || 'Tiempo'}</span>
        <div className="section-head-actions">
          <button type="button" className="gear-btn" onClick={onRefresh}>🔄</button>
          <button type="button" className="gear-btn" onClick={() => onNavigate('ajustes')}>Ajustes ⚙</button>
        </div>
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

function PrediccionesTab({ predicciones, footballMatches, onChange, onDelete, refreshSignal }) {
  const [drafts, setDrafts] = useState({});
  const [resolving, setResolving] = useState(false);

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

  useEffect(() => {
    async function resolvePending() {
      const pending = predicciones.filter(p => !p.resolved && p.date < todayKey);
      if (pending.length === 0) return;
      setResolving(true);
      const updated = [...predicciones];
      for (const p of pending) {
        try {
          const res = await fetch(`https://www.thesportsdb.com/api/v1/json/123/lookupevent.php?id=${p.matchId}`);
          const data = await res.json();
          const ev = data.events && data.events[0];
          if (ev && ev.intHomeScore !== null && ev.intHomeScore !== undefined) {
            const actualHome = Number(ev.intHomeScore);
            const actualAway = Number(ev.intAwayScore);
            const points = calcPredictionPoints(p.predHome, p.predAway, actualHome, actualAway);
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

function computeForm(results, teamName) {
  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  const form = [];
  results.slice(0, 5).forEach(r => {
    const isHome = r.home === teamName;
    const myScore = isHome ? r.homeScore : r.awayScore;
    const oppScore = isHome ? r.awayScore : r.homeScore;
    gf += myScore;
    ga += oppScore;
    if (myScore > oppScore) { w++; form.push('W'); }
    else if (myScore < oppScore) { l++; form.push('L'); }
    else { d++; form.push('D'); }
  });
  return { w, d, l, gf, ga, form };
}

function EstadisticasTab({ futbolConfig }) {
  const [sub, setSub] = useState('equipos');
  const [teamStats, setTeamStats] = useState({});
  const [tables, setTables] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function fetchTeamStats() {
      for (const team of futbolConfig.teams) {
        setTeamStats(s => ({ ...s, [team.id]: { status: 'loading', results: [] } }));
        try {
          const res = await fetch(`https://www.thesportsdb.com/api/v1/json/123/eventslast.php?id=${team.id}`);
          const data = await res.json();
          const results = (data.results || [])
            .filter(ev => ev.intHomeScore !== null && ev.intHomeScore !== undefined)
            .map(ev => ({
              id: ev.idEvent, home: ev.strHomeTeam, away: ev.strAwayTeam,
              homeScore: Number(ev.intHomeScore), awayScore: Number(ev.intAwayScore), date: ev.dateEvent,
            }));
          if (!cancelled) setTeamStats(s => ({ ...s, [team.id]: { status: 'ok', results } }));
        } catch (e) {
          if (!cancelled) setTeamStats(s => ({ ...s, [team.id]: { status: 'error', results: [] } }));
        }
      }
    }
    if (futbolConfig.teams.length > 0) fetchTeamStats();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [futbolConfig.teams]);

  useEffect(() => {
    let cancelled = false;
    async function fetchTables() {
      for (const leagueId of futbolConfig.leagues) {
        const liga = LIGAS_FUTBOL.find(l => l.id === leagueId);
        if (!liga || !liga.idLeague || liga.id === 'champions') continue;
        setTables(s => ({ ...s, [leagueId]: { status: 'loading', rows: [] } }));
        try {
          const res = await fetch(`https://www.thesportsdb.com/api/v1/json/123/lookuptable.php?l=${liga.idLeague}`);
          const data = await res.json();
          if (!cancelled) setTables(s => ({ ...s, [leagueId]: { status: 'ok', rows: data.table || [] } }));
        } catch (e) {
          if (!cancelled) setTables(s => ({ ...s, [leagueId]: { status: 'error', rows: [] } }));
        }
      }
    }
    if (futbolConfig.leagues.length > 0) fetchTables();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [futbolConfig.leagues]);

  const leaguesWithTable = futbolConfig.leagues.filter(l => {
    const liga = LIGAS_FUTBOL.find(x => x.id === l);
    return liga && liga.idLeague && liga.id !== 'champions';
  });

  return (
    <div className="module-panel">
      <div className="sub-tabs">
        <button type="button" className={`sub-tab ${sub === 'equipos' ? 'active' : ''}`} onClick={() => setSub('equipos')}>Mis equipos</button>
        <button type="button" className={`sub-tab ${sub === 'clasificacion' ? 'active' : ''}`} onClick={() => setSub('clasificacion')}>Clasificación</button>
      </div>

      {sub === 'equipos' ? (
        futbolConfig.teams.length === 0 ? (
          <div className="empty-state">Añade equipos favoritos en Ajustes para ver su forma reciente.</div>
        ) : (
          <div className="module-panel">
            {futbolConfig.teams.map(team => {
              const ts = teamStats[team.id];
              const record = ts && ts.status === 'ok' ? computeForm(ts.results, team.name) : null;
              return (
                <div key={team.id} className="stats-team-card">
                  <span className="stats-team-name">{team.name}</span>
                  {!ts || ts.status === 'loading' ? (
                    <span className="fecha-meta">Cargando…</span>
                  ) : ts.status === 'error' ? (
                    <span className="fecha-meta">No se pudo cargar.</span>
                  ) : !record || record.form.length === 0 ? (
                    <span className="fecha-meta">Sin partidos recientes.</span>
                  ) : (
                    <>
                      <div className="stats-form-strip">
                        {record.form.map((r, i) => (
                          <span key={i} className={`form-badge form-${r.toLowerCase()}`}>{r}</span>
                        ))}
                      </div>
                      <span className="fecha-meta">{record.w}V {record.d}E {record.l}D · {record.gf}-{record.ga} goles</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : leaguesWithTable.length === 0 ? (
        <div className="empty-state">Añade alguna liga en Ajustes (Champions League no tiene tabla clásica).</div>
      ) : (
        <div className="module-panel">
          {leaguesWithTable.map(leagueId => {
            const liga = LIGAS_FUTBOL.find(l => l.id === leagueId);
            const t = tables[leagueId];
            return (
              <div key={leagueId} className="dash-section">
                <span className="section-label">{liga.name}</span>
                {!t || t.status === 'loading' ? (
                  <div className="empty-state">Cargando clasificación…</div>
                ) : t.status === 'error' ? (
                  <div className="empty-state">No se pudo cargar.</div>
                ) : (
                  <ul className="table-list">
                    {t.rows.slice(0, 10).map((row, i) => {
                      const isFavorite = futbolConfig.teams.some(fav => fav.name === row.strTeam);
                      return (
                        <li key={row.idTeam || i} className={`table-row ${isFavorite ? 'favorite' : ''}`}>
                          <span className="table-pos">{row.intRank || i + 1}</span>
                          <span className="table-team">{row.strTeam}</span>
                          <span className="table-pts">{row.intPoints ?? '-'} pts</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
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
