import { useState, useRef } from 'react';
import { LIGAS_FUTBOL, PLATAFORMAS } from '../../constants';
import { buildMorningSummary, buildEveningSummary, Notificaciones } from '../../utils/notifications';
import { searchTeams as searchTeamsService } from '../../services/sports';
import { geocodeCity } from '../../services/weather';
import { exportBackup, downloadBackupFile, validateBackup, summarizeBackup, importBackup } from '../../utils/backup';

const RESUMEN_LABELS = [
  { key: 'tareas', label: 'Tareas' },
  { key: 'calendario', label: 'Eventos' },
  { key: 'entretenimiento', label: 'Fútbol y Estrenos' },
  { key: 'habitos', label: 'Hábitos' },
  { key: 'compra', label: 'Lista de la compra' },
  { key: 'capsulas', label: 'Cápsulas del tiempo' },
  { key: 'notas', label: 'Notas' },
  { key: 'tiempo', label: 'Ciudad del tiempo' },
  { key: 'ruleta', label: 'Opciones de la ruleta' },
  { key: 'notificaciones', label: 'Notificaciones' },
  { key: 'fechas', label: 'Fechas importantes' },
  { key: 'predicciones', label: 'Predicciones de fútbol' },
  { key: 'gastos', label: 'Gastos' },
  { key: 'juego_best', label: 'Récord de Esquiva' },
];

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
  const teamSearchIdRef = useRef(0);
  const citySearchIdRef = useRef(0);
  const [exportMsg, setExportMsg] = useState('');
  const [pendingBackup, setPendingBackup] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

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
    const requestId = ++teamSearchIdRef.current;
    setSearching(true);
    try {
      const data = await searchTeamsService(q);
      if (requestId === teamSearchIdRef.current) {
        setTeamResults((data.teams || []).slice(0, 5));
      }
    } catch (e) {
      if (requestId === teamSearchIdRef.current) {
        setTeamResults([]);
      }
    }
    if (requestId === teamSearchIdRef.current) {
      setSearching(false);
    }
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
    const requestId = ++citySearchIdRef.current;
    setSearchingCity(true);
    try {
      const data = await geocodeCity(q);
      if (requestId === citySearchIdRef.current) {
        setCityResults(data.results || []);
      }
    } catch (e) {
      if (requestId === citySearchIdRef.current) {
        setCityResults([]);
      }
    }
    if (requestId === citySearchIdRef.current) {
      setSearchingCity(false);
    }
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

  async function handleExport() {
    setExportMsg('Generando copia de seguridad…');
    try {
      const json = await exportBackup();
      downloadBackupFile(json);
      setExportMsg('Copia descargada correctamente.');
    } catch (e) {
      setExportMsg('No se pudo generar la copia de seguridad. Inténtalo de nuevo.');
    }
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImportError('');
    setPendingBackup(null);
    setImportSummary(null);
    const reader = new FileReader();
    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (err) {
        setImportError('El archivo no es un JSON válido.');
        return;
      }
      const result = validateBackup(parsed);
      if (!result.valid) {
        setImportError(result.error);
        return;
      }
      setPendingBackup(parsed);
      setImportSummary(summarizeBackup(parsed));
    };
    reader.onerror = () => {
      setImportError('No se ha podido leer el archivo.');
    };
    reader.readAsText(file);
  }

  function cancelImport() {
    setPendingBackup(null);
    setImportSummary(null);
    setImportError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function confirmImport() {
    if (!pendingBackup) return;
    setImporting(true);
    setImportError('');
    let safetyJson;
    try {
      safetyJson = await exportBackup();
    } catch (e) {
      setImporting(false);
      setImportError('No se ha podido crear la copia de seguridad de tus datos actuales. La importación no se realizará.');
      return;
    }
    downloadBackupFile(safetyJson, 'panel-control-backup-pre-restauracion');
    const result = await importBackup(pendingBackup);
    if (!result.ok) {
      setImporting(false);
      setImportError(`La restauración se ha detenido porque no se pudo escribir "${result.failedKey}". Se ha generado una copia de seguridad previa.`);
      return;
    }
    window.location.reload();
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

      <div className="settings-block">
        <span className="section-label">Datos · Copia de seguridad</span>
        <span className="config-title">
          Exporta todos tus datos para guardarlos o restaurarlos en otro momento. El archivo incluye tus datos personales y la configuración de la app, incluida tu clave de API de TMDB si la tienes guardada — trátalo con cuidado y no lo compartas públicamente.
        </span>
        <button type="button" className="ghost-btn" onClick={handleExport}>Exportar datos</button>
        {exportMsg && <span className="config-title">{exportMsg}</span>}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button type="button" className="ghost-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
          Importar datos
        </button>
        {importError && <span className="config-title">{importError}</span>}

        {pendingBackup && importSummary && (
          <div className="config-panel">
            <span className="config-title">
              Backup del {new Date(pendingBackup.exportedAt).toLocaleDateString('es-ES')} — la importación reemplazará tus datos actuales.
            </span>
            <ul className="wheel-list">
              {RESUMEN_LABELS.map(({ key, label }) => (
                <li key={key} className="wheel-list-item">
                  <span className="wheel-list-text">{label}</span>
                  <span className="fecha-meta">{importSummary[key]}</span>
                </li>
              ))}
            </ul>
            <div className="task-edit-actions">
              <button type="button" className="ghost-btn" onClick={cancelImport} disabled={importing}>Cancelar</button>
              <button type="button" className="primary-btn" onClick={confirmImport} disabled={importing}>
                {importing ? 'Restaurando…' : 'Confirmar importación'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
