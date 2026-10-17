# Kori Labs · landing temporal

Página de presentación de una sola sección ("Estamos preparando la mesa…") hecha con HTML y CSS nativos.
Sin frameworks, sin JavaScript, sin proceso de compilación.

## Estructura

```
index.html          Contenido de la página (textos, logo, escena, redes sociales)
css/styles.css      Estilos (colores y tipografía en variables al inicio)
assets/favicon.svg  Icono de la pestaña
assets/pattern.svg  Patrón de gatitos del fondo
.nojekyll           Evita que GitHub Pages procese el sitio con Jekyll
```

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
