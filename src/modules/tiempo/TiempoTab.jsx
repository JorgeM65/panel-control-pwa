import { DIAS_CORTO } from '../../constants';

// Helper local, solo lo usa este componente. Cuando exista services/weather.js
// en la Fase 5 puede pasar a vivir allí junto al resto de lógica de la API.
export function weatherIcon(code) {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 85 && code <= 86) return '❄️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

export function TiempoTab({ tiempo, data, status, onNavigate, onRefresh }) {
  return (
    <div className="module-panel">
      <div className="section-head">
        <span className="section-label">{tiempo.city || 'Tiempo'}</span>
        <div className="section-head-actions">
          <button type="button" className="gear-btn" onClick={onRefresh}>🔄</button>
          <button type="button" className="gear-btn" onClick={() => onNavigate('ajustes')}>Ajustes ⚙</button>
        </div>
      </div>

      {status === 'nocity' ? (
        <div className="empty-state">Configura tu ciudad en Ajustes para ver el tiempo.</div>
      ) : status === 'loading' ? (
        <div className="empty-state">Cargando previsión…</div>
      ) : status === 'error' ? (
        <div className="empty-state">No se ha podido conectar. Inténtalo de nuevo.</div>
      ) : data ? (
        <>
          <div className="weather-now">
            <span className="weather-now-icon">{weatherIcon(data.current.weather_code)}</span>
            <span className="weather-now-temp">{Math.round(data.current.temperature_2m)}°</span>
          </div>
          <div className="weather-days">
            {data.daily.time.slice(0, 6).map((d, i) => (
              <div key={d} className="weather-day">
                <span className="weather-day-label">
                  {i === 0 ? 'Hoy' : DIAS_CORTO[(new Date(`${d}T00:00:00`).getDay() + 6) % 7]}
                </span>
                <span className="weather-day-icon">{weatherIcon(data.daily.weather_code[i])}</span>
                <span className="weather-day-temps">
                  <span className="weather-max">{Math.round(data.daily.temperature_2m_max[i])}°</span>
                  <span className="weather-min">{Math.round(data.daily.temperature_2m_min[i])}°</span>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
