# Seguridad y assurance

Este documento describe las prácticas de seguridad y assurance del proyecto **Snake — Juego clásico**, para que la aplicación sea segura para quienes accedan a ella.

## Alcance

- La aplicación es **100% cliente**: se ejecuta en el navegador del usuario. No existe backend propio ni envío de datos a servidores del proyecto.
- El objetivo de este documento es ofrecer **transparencia** sobre el uso de datos, la integridad del código y los recursos externos.

## Datos y privacidad

### Qué se almacena

- Todo se almacena **solo en el navegador** del usuario (`localStorage`):
  - **Récord de puntuación** (clave: `snake-high-score`).
  - **Historial de partidas** (clave: `snake-game-stats`): array de las últimas 100 partidas. Cada entrada incluye:
    - `score`, `playerName`, `date` (ISO), `duration` (segundos).

### Qué no se hace

- No se recopilan **datos personales** más allá del nombre que el usuario escribe voluntariamente en la pantalla de inicio (y que solo se guarda en su dispositivo).
- No hay **cookies** de seguimiento, **analytics** ni envío de información a servidores externos.
- Todo permanece en el **dispositivo del usuario**.

## Integridad y uso seguro de datos

- Los datos mostrados en el menú de estadísticas provienen únicamente de `localStorage` y de estructuras controladas por la aplicación (números, fechas, nombre de usuario).
- La lectura del historial está protegida con `try/catch`: si los datos están corruptos o manipulados, se usa un array vacío y la aplicación no falla ni ejecuta código inyectado.
- No se inserta en el DOM contenido arbitrario desde el almacenamiento; las puntuaciones y el nombre se muestran mediante propiedades seguras (por ejemplo `textContent`), no con `innerHTML`.

## Seguridad del código

- No se utiliza `eval()`, `new Function()` ni carga dinámica de scripts desde cadenas.
- Los únicos scripts de la aplicación son los archivos locales referenciados en el HTML (`js/game.js`, `js/stats.js`). No se incluyen scripts de terceros; los únicos recursos externos son las fuentes de Google (CSS).

## Recursos externos

- **Google Fonts** (fuentes): se cargan por HTTPS desde `fonts.googleapis.com` y `fonts.gstatic.com`. Son hojas de estilo y fuentes; no tienen capacidad de ejecutar código en esta aplicación.

## Recomendaciones para el usuario

- Ejecutar la aplicación desde un **origen de confianza** (por ejemplo, el propio repositorio o un sitio que controle el usuario).
- Si se aloja en un servidor, usar **HTTPS** para evitar manipulación en tránsito (aunque la app no envía datos al servidor).

## Mantenimiento del assurance

- Se recomienda revisar este documento cuando se añadan funcionalidades que afecten a datos, almacenamiento o recursos externos.
- Cualquier problema de seguridad puede reportarse mediante los canales habituales del proyecto (por ejemplo, issues del repositorio).
