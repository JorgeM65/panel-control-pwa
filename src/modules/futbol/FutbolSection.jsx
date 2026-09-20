import { dateKey, formatShort } from '../../utils/dates';

export function FutbolSection({ config, matches, status, onNavigate, onRefresh }) {
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
