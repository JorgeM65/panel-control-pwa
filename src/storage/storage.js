// Adaptador fino sobre window.storage — mismo contrato exacto que ya usaba
// App.jsx directamente, sin asumir ningún formato. Quien llama sigue siendo
// quien decide si serializa a JSON (como hace App.jsx) o guarda un valor
// simple (como hace JuegoTab.jsx con el récord) — esta capa no lo cambia,
// solo centraliza el punto de acceso a window.storage.
//
// window.storage.get lanza una excepción si la clave no existe (así lo
// implementa storage-shim.js); getItem la conserva tal cual para no alterar
// el manejo de errores que ya hace cada llamador con try/catch.

export async function getItem(key) {
  return window.storage.get(key, false);
}

export async function setItem(key, value) {
  return window.storage.set(key, value, false);
}

// Ninguna parte de la app llama todavía a esto, pero window.storage.delete
// existe en el contrato real (storage-shim.js lo implementa), así que se
// incluye por completitud del adaptador.
export async function removeItem(key) {
  return window.storage.delete(key, false);
}
