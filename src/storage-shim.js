// El código de App.jsx se escribió originalmente para el entorno de artifacts de
// Claude, que expone un `window.storage` con get/set asíncronos respaldados por
// una base de datos privada del usuario. Fuera de Claude eso no existe.
//
// Este shim implementa el mismo contrato (incluido lanzar un error cuando la
// clave no existe, igual que el original) pero usando localStorage del propio
// navegador. Así todo el código de persistencia de App.jsx funciona sin tocarlo:
// los datos quedan solo en el dispositivo de quien use la app, nunca salen de ahí.
window.storage = {
  async get(key) {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      throw new Error(`Storage key not found: ${key}`);
    }
    return { key, value: raw, shared: false };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value, shared: false };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true, shared: false };
  },
  async list(prefix) {
    const keys = Object.keys(localStorage).filter((k) => !prefix || k.startsWith(prefix));
    return { keys, prefix, shared: false };
  },
};
