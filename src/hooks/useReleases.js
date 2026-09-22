import { useState, useEffect } from 'react';
import { getNowPlaying, discoverByProviders } from '../services/tmdb';
import { PLATAFORMAS } from '../constants';
import { dateKey } from '../utils/dates';

// sub (cine/streaming) lo decide el componente vía el parámetro — es estado
// de UI, no de este hook.
export function useReleases(apiKey, providersConfig, sub, refreshSignal) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errorDetail, setErrorDetail] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      if (!apiKey) {
        setStatus('nokey');
        return;
      }
      setStatus('loading');
      try {
        let data;
        if (sub === 'cine') {
          data = await getNowPlaying(apiKey);
        } else {
          const providers = providersConfig.length > 0 ? providersConfig.join('|') : PLATAFORMAS.map(p => p.id).join('|');
          const today = dateKey(new Date());
          data = await discoverByProviders(apiKey, providers, today);
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
  }, [apiKey, providersConfig, sub, refreshSignal]);

  return { items, status, errorDetail };
}
