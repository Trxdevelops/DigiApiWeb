# DigiArchivo

Explorador de Digimon que consume la [Digi-API](https://digi-api.com) con `fetch` y `async/await`. Está hecho con **Vite** y **JavaScript con módulos ES**, sin frameworks.

> Práctica **M2 · Async Odyssey** (U2 · JavaScript avanzado y herramientas del frontend).

## Qué hace

- Lista los 1488 Digimon de la API en páginas de 24, cada uno con su nivel y su atributo.
- Busca por nombre y filtra por nivel y por atributo (el filtrado lo hace la propia API).
- Muestra una barra con el reparto de atributos de los Digimon que hay en pantalla.
- Abre la ficha de cada Digimon con su descripción, técnicas, familias y línea evolutiva. Desde la ficha se puede saltar a cualquiera de sus evoluciones.
- El botón «Eclosionar un Digi-Huevo» abre un Digimon al azar.
- Tiene estados de carga, de error (con botón «Reintentar») y de búsqueda vacía.
- **Bonus:** guarda las respuestas en una caché de `localStorage` para no repetir peticiones.

## Cómo arrancarlo

Hace falta Node.js 20.19 o superior (o 22.12+), que es lo que pide Vite 8.

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción en dist/
npm run preview   # sirve la build de dist/
```

## Estructura

```
DigiApi/
├── index.html              # Maquetación base
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.js             # Punto de entrada: estado, eventos y coordinación de módulos
    ├── config.js           # Constantes: URL de la API, tamaño de página, caché y traducciones
    ├── api/
    │   ├── digimonApi.js   # Peticiones con fetch + async/await, response.ok y errores
    │   └── cache.js        # Caché en localStorage con caducidad (bonus)
    ├── logic/
    │   └── digimon.js      # Transformación de datos con map / filter / reduce
    ├── ui/
    │   ├── render.js       # Pinta tarjetas, ficha, barra de atributos y paginación
    │   └── states.js       # Estados de carga, error y vacío
    ├── assets/
    │   └── digiegg.svg     # Imagen de reserva cuando falla una imagen
    └── styles/
        └── main.css
```

Cada capa tiene una sola responsabilidad: `api` no toca el DOM, `logic` ni hace peticiones ni toca el DOM, y `ui` solo pinta los datos que recibe. `main.js` es el único módulo que los conecta.

## Cómo se cumple el enunciado

### Asincronía

- `getJSON()` (en `src/api/digimonApi.js`) usa `async/await` con `try/catch`, comprueba `response.ok` y lanza un `ApiError` con un mensaje claro para cada caso: sin conexión, más de 8 segundos sin respuesta (`AbortSignal.timeout`), 400/404, 429, errores 5xx y JSON inválido.
- Las 24 fichas de cada página se piden en paralelo con `Promise.allSettled`. Si alguna falla, el resto se pinta igual y esa tarjeta sale con los datos básicos del listado.
- Mientras carga, la rejilla muestra tarjetas «esqueleto» y un texto de estado con `aria-live`. La ficha tiene su propio indicador de carga.
- Si se pasan páginas muy rápido, las respuestas antiguas se descartan (cada carga lleva un número) para que no pisen a la más reciente.

### Transformación de datos

Está todo en `src/logic/digimon.js`, sin bucles `for`:

- `map` y `filter` limpian el listado y la ficha (`normalizeList`, `normalizeDigimon`): quitan valores vacíos, eligen la imagen y la descripción y dan valores por defecto.
- `reduce` agrupa las evoluciones repetidas (el mismo Digimon con varias condiciones) y cuenta los atributos de la página (`countAttributes`).
- También se usan `flatMap`, `find`, `some`, `slice` y `join` donde encajan.

### Robustez

La API real tiene datos raros. Estos son los casos encontrados y cómo los maneja la app:

| Caso real de la Digi-API | Qué hace la app |
| --- | --- |
| Una búsqueda sin resultados responde sin el campo `content` | `toArray()` devuelve `[]` y se muestra el estado vacío |
| Un Digimon que no existe responde **400** `{"message":"Digimon not found"}` | Mensaje de error en la ficha con «Reintentar» |
| `pageable.totalPages` no es fiable (con 48 resultados dice 1 página cuando hay 2) | El número de páginas se calcula con `totalElements` |
| Digimon sin nivel, atributo, tipo o descripción | Se muestran como «desconocido» o con un aviso |
| Descripción solo en japonés | Se muestra con `lang="ja"` y una nota |
| Varios niveles o atributos a la vez | Se pintan todos |
| Imagen o icono que no carga | Se cambia por el huevo de reserva (o se quita el icono) |
| `localStorage` lleno o bloqueado | La app sigue funcionando sin caché |

Además, todo el texto que viene de la API se escapa antes de insertarlo en el HTML.

### Bonus: caché en localStorage

`src/api/cache.js` guarda cada respuesta junto con la hora en la que llegó, usando la URL como clave. Antes de cada `fetch` se consulta la caché. Las entradas caducan a las 24 horas y las caducadas se borran al arrancar. El pie de página indica cuántas respuestas hay guardadas y tiene un botón para vaciar la caché. Si `localStorage` se llena, se vacía la caché de la app y se vuelve a intentar.

### Originalidad

La interfaz imita la pantalla LCD de las mascotas virtuales de 1997 de las que nació Digimon: una carcasa amarilla de plástico, la trama de puntos de la pantalla, la tipografía de matriz de puntos DotGothic16 y animaciones «a saltos», como los sprites de esas pantallas. Al saltar a una evolución, el Digimon aparece primero como una silueta que parpadea, como en una digievolución. Cada atributo tiene su color, y la combinación está comprobada para que se distinga también con daltonismo.

Accesibilidad: se puede usar con teclado, el foco es visible, se respeta `prefers-reduced-motion` y la ficha es un `<dialog>` nativo.

## API utilizada

[Digi-API](https://digi-api.com): gratuita, sin clave y con CORS abierto.

| Endpoint | Uso |
| --- | --- |
| `GET /api/v1/digimon?page=&pageSize=&name=&level=&attribute=` | Listado paginado con filtros |
| `GET /api/v1/digimon/{id}` | Ficha completa de un Digimon |

## Declaración de uso de IA

Este proyecto se ha desarrollado con ayuda de **Claude** (Anthropic), un asistente de IA.

- **Qué ha hecho la IA:** a partir del enunciado de la práctica, ha generado la estructura del proyecto Vite, el código de los módulos (`api`, `logic`, `ui` y `main`), los estilos y este README. También ha comprobado cómo responde de verdad la Digi-API (errores 400, listas vacías sin `content`, `totalPages` incorrecto, Digimon sin nivel ni atributo) para preparar la app ante esos casos. Además, la ha probado en un navegador automatizado: carga, errores de red, timeout, caché, búsqueda vacía y vista móvil.
- **Responsabilidad del autor:** elegir la API y la temática, y revisar, entender y saber explicar todo el código entregado.

## Créditos

- Datos e imágenes: [Digi-API](https://digi-api.com). Digimon es una marca registrada de sus propietarios; este es un proyecto académico sin ánimo de lucro.
- Tipografías: [DotGothic16](https://fonts.google.com/specimen/DotGothic16) y [M PLUS Rounded 1c](https://fonts.google.com/specimen/M+PLUS+Rounded+1c), con licencia SIL Open Font License.
