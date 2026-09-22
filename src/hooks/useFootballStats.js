import { useState, useEffect } from 'react';
import { getEventsLastForTeam, getLeagueTable } from '../services/sports';
import { LIGAS_FUTBOL } from '../constants';

// Los dos efectos viven en un único hook porque siempre se consumen juntos en
// EstadisticasTab, sin reutilización separada en ningún otro sitio — separarlos
// en dos hooks habría sido división artificial.
export function useFootballStats(teams, leagues) {
  const [teamStats, setTeamStats] = useState({});
  const [tables, setTables] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function fetchTeamStats() {
      for (const team of teams) {
        setTeamStats(s => ({ ...s, [team.id]: { status: 'loading', results: [] } }));
        try {
          const data = await getEventsLastForTeam(team.id);
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
    if (teams.length > 0) fetchTeamStats();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams]);

  useEffect(() => {
    let cancelled = false;
    async function fetchTables() {
      for (const leagueId of leagues) {
        const liga = LIGAS_FUTBOL.find(l => l.id === leagueId);
        if (!liga || !liga.idLeague || liga.id === 'champions') continue;
        setTables(s => ({ ...s, [leagueId]: { status: 'loading', rows: [] } }));
        try {
          const data = await getLeagueTable(liga.idLeague);
          if (!cancelled) setTables(s => ({ ...s, [leagueId]: { status: 'ok', rows: data.table || [] } }));
        } catch (e) {
          if (!cancelled) setTables(s => ({ ...s, [leagueId]: { status: 'error', rows: [] } }));
        }
      }
    }
    if (leagues.length > 0) fetchTables();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagues]);

  return { teamStats, tables };
}
