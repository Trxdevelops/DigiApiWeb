# DigiArchivo

Explorador de Digimon que utiliza la Digi-API mediante fetch y async/await. Está hecho con Vite y JavaScript usando módulos ES, sin frameworks.

Práctica M2 · Async Odyssey (U2 · JavaScript avanzado y herramientas del frontend).

## Qué hace

Muestra los 1488 Digimon de la API en páginas de 24, con su nivel y atributo.
Permite buscar por nombre y filtrar por nivel y atributo.

Muestra una barra con el reparto de atributos de los Digimon de la página actual.

Permite abrir la ficha de cada Digimon para ver su descripción, técnicas, familias y evoluciones.

Se puede acceder a otros Digimon desde su línea evolutiva.

Incluye un botón para abrir un Digimon aleatorio.

 Tiene estados de carga, error y búsqueda sin resultados.

Guarda las respuestas en localStorage durante 24 horas para evitar repetir peticiones.

## Cómo arrancarlo

Hace falta Node.js.

npm install
npm run dev
npm run build
npm run preview
## Estructura

El proyecto está dividido en varios módulos para tener el código organizado.

main.js se encarga del estado de la aplicación y de conectar los distintos módulos. config.js contiene las constantes y la configuración general.

En api/ están las peticiones a la API y la caché. En logic/digimon.js se transforman y organizan los datos que devuelve la API. En ui/ está el código que muestra las tarjetas, las fichas y los distintos estados de la aplicación.

Los estilos están en styles/main.css y los recursos gráficos en assets/ y public/.

## Cómo se cumple el enunciado

### Asincronía

Las peticiones se hacen usando fetch y async/await. La función getJSON() comprueba las respuestas y gestiona los errores, incluyendo problemas de conexión, tiempos de espera, errores HTTP y respuestas JSON inválidas.

Las fichas de cada página se cargan en paralelo usando Promise.allSettled, de forma que un error en una ficha no impide mostrar las demás.

Mientras se cargan los datos aparecen tarjetas de carga. Si ocurre un error, se muestra un mensaje con la opción de reintentar. También se controlan las peticiones para evitar que una respuesta antigua sustituya a los resultados más recientes.

### Transformación de datos

La transformación de datos está en src/logic/digimon.js. Se utilizan métodos como map, filter y reduce, además de flatMap, find, some, slice y join.

Se usan para limpiar los datos recibidos, agrupar evoluciones repetidas y contar los atributos de los Digimon que aparecen en la página.

### Robustez

La API tiene algunos casos particulares que se han tenido en cuenta durante el desarrollo. Por ejemplo, algunas búsquedas sin resultados no incluyen el campo content, hay Digimon que no tienen todos los datos y el número de páginas que devuelve la API no siempre es correcto.

La aplicación contempla estas situaciones y muestra valores alternativos cuando falta información. También controla los errores al cargar imágenes y los problemas con localStorage, para que la aplicación pueda seguir funcionando.

Las descripciones que solo están disponibles en japonés se muestran en su idioma original. Además, el texto recibido de la API se escapa antes de insertarlo en el HTML.

### Bonus: caché en localStorage

Las respuestas se guardan en localStorage utilizando la URL de cada petición como clave. La caché caduca a las 24 horas y se pueden borrar las respuestas guardadas desde el pie de página.

Si el almacenamiento falla o está lleno, la aplicación intenta recuperarse y sigue funcionando sin la caché.

### Originalidad

La interfaz está inspirada en las mascotas virtuales LCD de los años noventa. Tiene una carcasa amarilla, una pantalla con puntos y una tipografía que recuerda a los dispositivos originales.

También incluye animaciones inspiradas en los sprites de la época. Al acceder a una evolución, el Digimon aparece primero como una silueta que parpadea.

Los colores sirven para diferenciar los atributos. La aplicación también se puede utilizar con teclado, tiene el foco visible y respeta la preferencia de reducir las animaciones. La ficha utiliza un elemento dialog.

## API utilizada

Se utiliza Digi-API, que es gratuita y no necesita una clave de acceso.

El endpoint /api/v1/digimon se utiliza para obtener el listado, buscar Digimon y aplicar filtros. El endpoint /api/v1/digimon/{id} devuelve la información completa de cada Digimon.

## Declaración de uso de IA

Durante el desarrollo se ha utilizado IA como apoyo para resolver dudas, revisar partes del código y comprobar posibles errores.

El código se ha revisado después de aplicar las sugerencias, comprobando que los módulos funcionan juntos y que la aplicación responde correctamente ante distintos casos de error. También se ha comprobado el comportamiento de la API y de la caché.

La revisión final del proyecto es responsabilidad del autor, que debe conocer el funcionamiento del código y poder explicar las decisiones tomadas durante su desarrollo.

## Créditos

Los datos y las imágenes pertenecen a Digi-API. Digimon es una marca registrada de sus respectivos propietarios. Este proyecto es académico y no tiene ánimo de lucro.

Las tipografías utilizadas son DotGothic16 y M PLUS Rounded 1c, ambas bajo la licencia SIL Open Font License.