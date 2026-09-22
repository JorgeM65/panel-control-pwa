import { useState, useEffect } from 'react';
import { getForecast } from '../services/weather';

// Se invoca una única vez dentro de App — tanto Home como TiempoTab reciben
// el resultado por props, igual que antes. Si TiempoTab llamara a este hook
// por su cuenta, habría dos peticiones a Open-Meteo en vez de una.
export function useWeather(lat, lon, refreshSignal) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    async function fetchWeather() {
      if (!lat || !lon) {
        setStatus('nocity');
        return;
      }
      setStatus('loading');
      try {
        const result = await getForecast(lat, lon);
        if (!cancelled) {
          setData(result);
          setStatus('ok');
        }
      } catch (e) {
        if (!cancelled) setStatus('error');
      }
    }
    fetchWeather();
    return () => { cancelled = true; };
  }, [lat, lon, refreshSignal]);

  return { data, status };
}
