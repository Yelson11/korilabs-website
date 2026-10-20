# Kori Labs · landing temporal

Página de presentación de una sola sección ("Estamos preparando la mesa…") hecha con HTML y CSS nativos.
Sin frameworks, sin JavaScript, sin proceso de compilación.

## Estructura

```
index.html          Contenido de la página (textos, logo, escena, redes sociales)
css/styles.css      Estilos (colores y tipografía en variables al inicio)
assets/favicon.svg  Icono de la pestaña: cambia solo de color (verde en navegador claro, crema en oscuro)
assets/apple-touch-icon.png  Icono al guardar el sitio en la pantalla de inicio del iPhone
favicon.ico         Respaldo para navegadores que no usan el icono SVG
assets/pattern.svg  Patrón de gatitos del fondo
.nojekyll           Evita que GitHub Pages procese el sitio con Jekyll

juegos/index.html          Sección "Juegos": por ahora redirige a PINTO
juegos/pinto/index.html    Página de PINTO (caja 3D, cómo se juega, cartas)
juegos/pinto/box3d.js      Giro y arrastre de la caja 3D (sin dependencias)
juegos/pinto/img/          Caras de la caja, cartas, logo e imagen para redes (og-pinto.jpg)
css/pinto.css              Estilos de la página de PINTO
css/home.css               Estilos de la portada (se carga después de styles.css)
assets/pinto-caja.webp     Caja de PINTO para la tarjeta de la portada
```

## Sección Juegos

- El menú de la cabecera y el botón "Conoce PINTO" de la portada llevan a `juegos/`, que por ahora redirige
  a `juegos/pinto/`. Cuando haya más juegos, cambia `juegos/index.html` por un listado.
- **Caja 3D:** son seis imágenes (`img/caja-*.webp`) montadas con CSS 3D. Si cambia el diseño de la caja,
  reemplaza esas imágenes manteniendo las proporciones (ancho 758 · alto 1057 · fondo 244).
- **Cartas:** `img/cartas/*.webp`, exportadas del "Deck v1.0" de Figma.
- **Caché:** los enlaces a CSS y JS llevan `?v=N`. Al cambiar esos archivos, sube el número para que los
  navegadores descarguen la versión nueva en vez de usar la guardada.

## Suscripción (Sender)

La portada tiene una sección `#suscribete` (y un enlace "Suscríbete" en el menú). El formulario lo pone Sender:

- El `<script>` universal de la cuenta está en el `<head>` de `index.html`.
- El formulario es el `<div class="sender-form-field" data-sender-form-id="dNk3wL">` de la sección `#suscribete`.
- Su aspecto (colores, campos, mensaje de gracias) se cambia en el editor de Sender; al guardar allí, la página
  muestra la versión nueva sola. Solo hay que tocar el código si se usa **otro** formulario (otro ID).

El correo de bienvenida con el regalo se envía desde una automatización de Sender (no desde este sitio).

## Cambiar el contenido

Todo el texto está en `index.html`:

- **Titular:** el `<h1 class="hero__title">`.
- **Mensaje breve:** el párrafo `hero__lead`.
- **Lema:** el párrafo `hero__motto`.
- **Colores:** variables `--forest`, `--cream`, `--peach`… al inicio de `css/styles.css`.

## Añadir una red social

Hazlo solo cuando el perfil ya exista.

1. **Icono.** Dentro del bloque `<svg width="0" …>` del inicio de `index.html`, añade un `<symbol>` con
   viewBox `0 0 24 24` y el id `icon-<red>` (por ejemplo `icon-tiktok`). Usa `currentColor`
   para que el icono tome el color del botón y cambie con hover y foco.
2. **Enlace.** En la lista `social__list`, copia el bloque `<li>` de Instagram y cambia tres cosas:
   - el `href` por la URL del perfil,
   - `<use href="#icon-instagram"/>` por `<use href="#icon-<red>"/>`,
   - el texto oculto (`visually-hidden`), por ejemplo "TikTok de Kori Labs (se abre en una pestaña nueva)".
3. Mantén `target="_blank"` y `rel="noopener noreferrer"` en todos los enlaces externos.

Los estilos (tamaño, hover, foco, separación) se aplican solos; no hay que tocar el CSS.

## Tipografía

El sitio carga **Istok Web** desde Google Fonts (ver los `<link>` del `<head>`). Si prefieres no depender de un
servicio externo, descarga los archivos de la fuente, ponlos en `assets/fonts/` y reemplaza el `<link>` de Google
Fonts por un `@font-face` en `css/styles.css`. Mientras la fuente carga (o si falla), se usa la fuente del sistema.

## Probar en local

Abre `index.html` en el navegador, o sirve la carpeta con `python3 -m http.server`.

## Publicación (GitHub Pages)

En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
Cada cambio que se suba a `main` se publica automáticamente en uno o dos minutos.
