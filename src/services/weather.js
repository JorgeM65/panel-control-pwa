// Comunicación HTTP con Open-Meteo (previsión y geocodificación). Completamente
// gratuita y sin clave.

// Usado por App.jsx (fetchWeather). Comprueba res.ok porque así lo hacía ya
// el código original — geocodeCity, en cambio, no lo comprobaba.
export async function getForecast(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('bad response');
  return res.json();
}

// Usado por AjustesTab (buscador de ciudad).
export async function geocodeCity(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es`;
  const res = await fetch(url);
  return res.json();
}
