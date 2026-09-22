import { useState } from 'react';
import { LIGAS_FUTBOL } from '../../constants';
import { useFootballStats } from '../../hooks/useFootballStats';

// Sigue viviendo aquí a propósito: es transformación específica de la lógica
// de la app (cálculo de forma reciente), no comunicación HTTP.
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

export function EstadisticasTab({ futbolConfig }) {
  const [sub, setSub] = useState('equipos');
  const { teamStats, tables } = useFootballStats(futbolConfig.teams, futbolConfig.leagues);

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
