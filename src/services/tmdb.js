// Comunicación HTTP con TMDB. La app es una PWA cliente sin backend, así que
// la clave del usuario viaja igual que siempre — este servicio no cambia ese
// mecanismo, solo mueve el fetch.

// TMDB tiene dos tipos de credencial: la clave v3 (una cadena corta) y el
// "API Read Access Token" v4 (un JWT largo con puntos, tipo eyJ...). Cada una
// se envía de forma distinta — si no se acierta cuál es, TMDB devuelve un 401
// aunque la clave sea correcta.
function buildAuth(apiKey) {
  const isV4Token = apiKey.includes('.');
  const headers = isV4Token ? { Authorization: `Bearer ${apiKey}` } : {};
  const keyParam = isV4Token ? '' : `&api_key=${apiKey}`;
  return { headers, keyParam };
}

// Usado por EstrenosTab (sub-pestaña "Cine").
export async function getNowPlaying(apiKey) {
  const { headers, keyParam } = buildAuth(apiKey);
  const url = `https://api.themoviedb.org/3/movie/now_playing?region=ES&language=es-ES&page=1${keyParam}`;
  const res = await fetch(url, { headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.status_message || `error ${res.status}`);
  }
  return data;
}

// Usado por EstrenosTab (sub-pestaña "Streaming"). providers y todayDate los
// calcula el componente (el fallback a todas las plataformas, y la fecha de
// hoy) — son decisiones de la app, no parte de la comunicación HTTP en sí.
export async function discoverByProviders(apiKey, providers, todayDate) {
  const { headers, keyParam } = buildAuth(apiKey);
  // primary_release_date.lte evita mostrar películas con fecha de estreno
  // futura (que aún no están realmente disponibles), y
  // watch_monetization_types=flatrate se ciñe a lo incluido en la
  // suscripción, sin mezclar alquiler o compra.
  const url = `https://api.themoviedb.org/3/discover/movie?watch_region=ES&with_watch_providers=${providers}&watch_monetization_types=flatrate&sort_by=primary_release_date.desc&primary_release_date.lte=${todayDate}&language=es-ES&page=1${keyParam}`;
  const res = await fetch(url, { headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.status_message || `error ${res.status}`);
  }
  return data;
}
