# Snake — Juego clásico

Juego de la serpiente en JavaScript (Canvas), con obstáculos dinámicos, estadísticas y menú de usuario.

## Cómo ejecutar

- Abre `index.html` en un navegador moderno, o
- Sirve la carpeta con un servidor local (por ejemplo `npx serve .`) y accede a la URL indicada.

## Controles

En escritorio:

| Tecla | Acción |
|-------|--------|
| **Flechas** o **W A S D** | Mover la serpiente |
| **Espacio** | Pausar / reanudar |
| **Esc** | Reiniciar (durante partida) |

En móvil:

- **Botones táctiles** (flechas virtuales debajo del tablero) para mover la serpiente.

## Funcionalidades

- **Nombre de usuario**: al iniciar partida se solicita el nombre; se muestra en el header y en la pantalla de Game Over. Por defecto: "Jugador".
- **Obstáculos**: cada vez que la serpiente come un círculo (comida), aparece un muro aleatorio de 1×1 celda en color brillante (**#EB8DFC** y matices). Chocar con un muro termina la partida.
- **Serpiente**: color base **#38CDEB** (cyan) con gradientes de contraste.
- **Estadísticas**: botón "Estadísticas" en el header. Muestra partidas jugadas, mejor puntuación, puntuación media, total de puntos, y dos gráficas (puntuación y duración por partida) con **números en las barras** y **línea de tendencia**.
- **Persistencia**: récord y historial de partidas (últimas 100) en `localStorage`; cada partida guarda puntuación, nombre, fecha y duración.
- **Mejor jugador**: en la pantalla de inicio se muestra automáticamente el nombre del jugador con mayor puntuación registrada y se pre-rellena el campo de nombre con ese valor.
- **Ventana de reglas**: botón "Reglas del juego" en el pie de página que abre una ventana con las reglas básicas, incluyendo el comportamiento de los bloques aleatorios.

## Estructura del proyecto

```
snake-game-js/
├── index.html       # Entrada, overlays (inicio, game over, pausa, estadísticas)
├── css/
│   └── styles.css   # Estilos globales y del menú de estadísticas
├── js/
│   ├── game.js      # Lógica del juego: serpiente, comida, obstáculos, colisiones, estadísticas
│   └── stats.js     # Menú de estadísticas: KPIs y gráficas (Canvas)
├── README.md
├── CHANGELOG.md     # Historial de cambios
└── SECURITY.md      # Seguridad y assurance
```

## Tecnologías

- HTML5, CSS3, JavaScript (vanilla)
- Canvas API para el juego y las gráficas
- `localStorage` para récord e historial de partidas

## Documentación complementaria

- [CHANGELOG.md](CHANGELOG.md) — Cambios realizados por versión.
- [SECURITY.md](SECURITY.md) — Seguridad, privacidad y assurance de la aplicación.
