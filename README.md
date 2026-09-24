# Cajatools

Herramientas y calculadoras gratuitas en español (Argentina). Sitio estático en HTML, CSS y JavaScript vanilla, generado con un build en Node sin dependencias y publicado en GitHub Pages en **https://cajatools.com**.

## Uso local

```bash
node build.js        # genera /dist
node tests/run.js    # build + tests (calculadoras, SEO, enlaces)
npx serve dist       # servir /dist en http://localhost:3000
```

Requiere Node 18 o superior. No hay `npm install`: el proyecto no tiene dependencias.

## Estructura

```
src/templates/   head, header, footer y ad-slot (se incrustan en el HTML final)
src/pages/       una carpeta por página: page.json (metadatos, FAQ, relacionadas), content.html y JS propio
src/assets/      css (se incrusta minificado), js comunes, img, vendor (librerías locales)
data/            índices y escalas en JSON, con "actualizado" y "fuente"
tests/           tests en Node sin frameworks (node tests/run.js)
build.js         arma /dist, sitemap.xml, robots.txt y ads.txt
config.json      URL del sitio, email, AdSense, Analytics y categorías
```

### Agregar una página

1. Crear `src/pages/<categoria>/<slug>/` con `page.json` y `content.html`.
2. En `page.json`: `type` (`tool` | `page`), `title` (≤ 60), `description` (≤ 155), `h1`, `category`, `updated`, `faq`, `related`, `scripts` y `card` (para que aparezca en la home y el footer).
3. En `content.html` se pueden usar `{{h1}}`, `{{updatedHuman}}`, `{{data:<archivo>}}` (incrusta `data/<archivo>.json`) y los espacios de anuncios `{{ad:resultado}}` y `{{ad:medio}}`.

## Publicidad (AdSense)

Está preparada y desactivada. Para activarla, en `config.json`:

```json
"adsEnabled": true,
"adsenseClientId": "ca-pub-XXXXXXXXXXXXXXXX",
"adSlots": { "resultado": "1234567890", "medio": "…", "prefooter": "…" }
```

El build agrega el script de AdSense en el `<head>`, inserta los bloques debajo del resultado, a mitad del texto y antes del footer (nunca encima de la herramienta) y genera `ads.txt`. Los contenedores tienen alto mínimo reservado para evitar saltos de layout. Si el visitante elige "Solo necesarias" en el banner de cookies, se piden anuncios no personalizados.

Google Analytics se activa completando `analyticsId` (formato `G-XXXXXXX`).

## Datos que cambian

Los índices y escalas viven en `/data/*.json`, cada uno con `actualizado` y `fuente`.

- **ICL e IPC**: `node scripts/actualizar-indices.js` los baja de las APIs oficiales del BCRA y de datos.gob.ar (INDEC). El workflow `actualizar-indices.yml` lo corre todos los lunes, commitea si hay datos nuevos y vuelve a publicar el sitio. También se puede correr a mano desde **Actions → Actualizar índices → Run workflow**.
- **Casa Propia**: carga manual desde el PDF oficial (ver DATOS-A-ACTUALIZAR.md).
 Los valores sin verificar están marcados con `"TODO_VERIFICAR": true` y listados en [DATOS-A-ACTUALIZAR.md](DATOS-A-ACTUALIZAR.md).

## Deploy

Cada push a `main` corre `.github/workflows/deploy.yml`: build, tests y publicación de `/dist` en GitHub Pages. El `CNAME` se copia a `/dist`.

### 1. Activar GitHub Pages

1. En el repositorio: **Settings → Pages**.
2. En **Build and deployment → Source**, elegir **GitHub Actions**.
3. En **Custom domain**, escribir `cajatools.com` y guardar.

### 2. DNS en Cloudflare

En el panel de Cloudflare del dominio, **DNS → Records**:

| Tipo | Nombre | Contenido | Proxy |
|---|---|---|---|
| A | `@` | `185.199.108.153` | Solo DNS (nube gris) |
| A | `@` | `185.199.109.153` | Solo DNS |
| A | `@` | `185.199.110.153` | Solo DNS |
| A | `@` | `185.199.111.153` | Solo DNS |
| CNAME | `www` | `fanadini.github.io` | Solo DNS |

Opcional (IPv6): registros AAAA en `@` con `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` y `2606:50c0:8003::153`.

Dejá el proxy desactivado (nube gris) hasta que GitHub emita el certificado. Si después activás el proxy de Cloudflare, poné **SSL/TLS → Full (strict)** para evitar redirecciones infinitas.

### 3. HTTPS

Cuando el DNS propague (de minutos a unas horas), en **Settings → Pages** aparece el dominio verificado. Marcá **Enforce HTTPS**. Recomendado: verificar el dominio en **Settings (de tu cuenta) → Pages → Add a domain** para evitar que otro lo tome.

### 4. Google Search Console

1. Entrar a https://search.google.com/search-console y agregar una propiedad de tipo **Dominio** con `cajatools.com`.
2. Copiar el registro TXT que da Google y crearlo en Cloudflare (**DNS → Add record → TXT**, nombre `@`).
3. Volver a Search Console y presionar **Verificar**.
4. En **Sitemaps**, enviar `https://cajatools.com/sitemap.xml`.
5. Opcional: usar **Inspección de URLs** para pedir la indexación de las páginas principales.
