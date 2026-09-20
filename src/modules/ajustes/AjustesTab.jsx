import { useState } from 'react';
import { LIGAS_FUTBOL, PLATAFORMAS } from '../../constants';
import { buildMorningSummary, buildEveningSummary, Notificaciones } from '../../utils/notifications';

export function AjustesTab({
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
