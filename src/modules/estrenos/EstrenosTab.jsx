import { useState, useEffect } from 'react';
import { PLATAFORMAS } from '../../constants';
import { dateKey } from '../../utils/dates';
import { getNowPlaying, discoverByProviders } from '../../services/tmdb';

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
        let data;
        if (sub === 'cine') {
          data = await getNowPlaying(config.apiKey);
        } else {
          const providers = config.providers.length > 0 ? config.providers.join('|') : PLATAFORMAS.map(p => p.id).join('|');
          const today = dateKey(new Date());
          data = await discoverByProviders(config.apiKey, providers, today);
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
