# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.

## Cambios realizados (última actualización)

### 1. Documentación

- **README.md**: descripción del proyecto, cómo ejecutar, controles, funcionalidades, estructura y enlaces a documentación.
- **CHANGELOG.md**: este archivo; historial de cambios.
- **SECURITY.md**: documento de seguridad y assurance (datos, privacidad, integridad, recursos externos).

### 2. Gráficas de estadísticas

- **Números en las barras**: cada barra muestra su valor (puntuación o duración en min) encima o sobre la barra, para no depender solo de los ejes.
- **Línea de tendencia**: en ambas gráficas (puntuación por partida y duración por partida) se dibuja una línea de tendencia por regresión lineal (trazo discontinuo en rojo), para visualizar la tendencia de rendimiento.

### 3. Obstáculos / muros

- Al recoger cada comida (círculo), se genera **un obstáculo** de **1×1 celda** en una posición aleatoria del grid.
- Los obstáculos no se superponen con la serpiente, la comida ni otros obstáculos.
- Si la serpiente choca con un obstáculo, la partida termina (Game Over).
- Los obstáculos se dibujan como cuadrados grises con borde; se reinician al iniciar una nueva partida.

### 4. Nombre de usuario al iniciar partida

- En la pantalla de inicio se muestra un campo **"Tu nombre"** (obligatorio para empezar; si está vacío se usa "Jugador").
- El nombre se muestra en el header durante la partida (badge junto al logo) y en la pantalla de Game Over ("Nombre, Puntos: X").
- El nombre se guarda en cada partida en el historial de estadísticas (campo `playerName` en `localStorage`).

### 5. Color de la serpiente

- Color base **#38CDEB** (cyan) con gradientes de contraste:
  - Claros: **#5dd4f0**
  - Base: **#38CDEB**
  - Oscuro: **#2ab8d4**
- La cuadrícula del canvas y los efectos al recoger comida (anillos, partículas, flash) usan tonos cyan coherentes (**rgba(56, 205, 235, …)**) en lugar del verde anterior.

---

*Para más detalle sobre seguridad y datos, ver [SECURITY.md](SECURITY.md).*
