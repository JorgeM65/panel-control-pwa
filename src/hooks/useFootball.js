import { useState, useEffect } from 'react';
import { getEventsByDay, getEventsNextForTeam } from '../services/sports';
import { LIGAS_FUTBOL } from '../constants';
import { dateKey, utcToLocal } from '../utils/dates';

// Partidos de hoy (ligas + equipos favoritos). Se invoca una única vez dentro
// de App — FutbolSection, PrediccionesTab y EstadisticasTab reciben el
// resultado por props, igual que antes.
export function useFootball(leagues, teams, refreshSignal) {
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    async function fetchFootball() {
      if (leagues.length === 0 && teams.length === 0) {
        setMatches([]);
        setStatus('ok');
        return;
      }
      setStatus('loading');
      try {
        const todayKey = dateKey(new Date());
        const results = [];
        for (const leagueId of leagues) {
          const liga = LIGAS_FUTBOL.find(l => l.id === leagueId);
          if (!liga) continue;
          const data = await getEventsByDay(todayKey, liga.idLeague);
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
          const data = await getEventsNextForTeam(team.id);
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
          setMatches(results);
          setStatus('ok');
        }
      } catch (e) {
        if (!cancelled) setStatus('error');
      }
    }
    fetchFootball();
    return () => { cancelled = true; };
  }, [leagues, teams, refreshSignal]);

  return { matches, status };
}
