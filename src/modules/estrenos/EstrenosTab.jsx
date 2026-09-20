import { useState, useEffect } from 'react';
import { PLATAFORMAS } from '../../constants';
import { dateKey } from '../../utils/dates';

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

export function EstrenosTab({ config, onNavigate, refreshSignal, onRefresh }) {
  return (
    <div className="module-panel">
      <EstrenosSection config={config} onNavigate={onNavigate} refreshSignal={refreshSignal} onRefresh={onRefresh} />
    </div>
  );
}
