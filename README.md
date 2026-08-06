# Panel de Control

App personal de control — tareas, calendario, entretenimiento, hábitos, compra,
cápsula del tiempo, notas, datos y un pequeño juego. Todo privado: los datos
viven solo en el navegador de quien la use (`localStorage`), no hay servidor
ni base de datos detrás.

## Probarla en tu ordenador (opcional)

Necesitas [Node.js](https://nodejs.org) 20.19+ o 22.12+ instalado.

```bash
npm install
npm run dev
```

Abre la URL que te indique la terminal (normalmente `http://localhost:5173`).

## Publicarla en GitHub Pages

1. Sube este proyecto a un repositorio de GitHub (público, salvo que tengas
   GitHub Pro/Team/Enterprise).
2. En el repo: **Settings → Pages → Build and deployment → Source**, elige
   **GitHub Actions**.
3. Haz `git push` a la rama `main`. El workflow en
   `.github/workflows/deploy.yml` compila la app y la publica solo
   automáticamente en cada push — no hace falta hacer nada más a mano.
4. Al cabo de un minuto o dos, la URL aparecerá en **Settings → Pages**, con
   el formato `https://tu-usuario.github.io/nombre-del-repo/`.
5. Desde el móvil, abre esa URL en Chrome y usa **Añadir a pantalla de
   inicio** para instalarla como app.

## Tu clave de TMDB

Para ver estrenos reales de cine y streaming, entra en **Ajustes** dentro de
la app y pega ahí tu clave gratuita de [themoviedb.org](https://www.themoviedb.org/settings/api)
(cuenta gratis, "API Read Access Token" o clave v3). Se guarda solo en tu
propio navegador — nunca en el código ni en el repositorio.

## Sobre la seguridad

- El repositorio puede ser público sin problema: no contiene ninguna clave ni
  dato personal, solo la interfaz y la lógica de la app.
- Los datos (tareas, notas, hábitos...) nunca salen de tu dispositivo.
- La Content-Security-Policy en `index.html` limita qué puede cargar y
  contactar la app (solo TheSportsDB, TMDB, Google Fonts e imágenes de TMDB).
- No hay `eval` ni scripts de terceros cargados en tiempo de ejecución: todo
  se compila de antemano con Vite.
- Recomendación extra: activa **Dependabot alerts** en el repo (Settings →
  Code security) para que GitHub te avise si alguna dependencia (React, Vite)
  recibe un parche de seguridad.

## Estructura

```
src/App.jsx           el componente completo de la app
src/storage-shim.js    adapta el almacenamiento a localStorage
src/main.jsx           arranque de React + registro del service worker
public/manifest.json   metadatos de instalación PWA
public/sw.js           caché básica para funcionar offline
public/icon.svg        icono (sustitúyelo por uno tuyo si quieres)
```
