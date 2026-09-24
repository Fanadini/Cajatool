#!/usr/bin/env node
/*
 * Build de Cajatool: arma cada página de src/pages con las plantillas de
 * src/templates y genera el sitio estático en /dist.
 * Sin dependencias: solo módulos nativos de Node.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
// CAJATOOL_DIST y CAJATOOL_CONFIG permiten builds alternativos (los usan los tests)
const DIST = process.env.CAJATOOL_DIST || path.join(ROOT, 'dist');
const PAGES_DIR = path.join(SRC, 'pages');

const config = JSON.parse(fs.readFileSync(process.env.CAJATOOL_CONFIG || path.join(ROOT, 'config.json'), 'utf8'));
const SITE = config.siteUrl.replace(/\/$/, '');
const warnings = [];

// ---------- utilidades ----------
const readFile = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Reemplaza {{clave}}. Las claves desconocidas quedan intactas y se reportan al final.
function render(str, vars) {
  return str.replace(/\{\{\s*([\w:.-]+)\s*\}\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m
  );
}

function hash(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

function copyDir(from, to, filter = () => true) {
  if (!exists(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst, filter);
    else if (filter(src)) fs.copyFileSync(src, dst);
  }
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function humanDate(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(d);
}

function jsonForScript(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

// ---------- descubrimiento de páginas ----------
function findPages(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) findPages(path.join(dir, entry.name), acc);
  }
  const metaPath = path.join(dir, 'page.json');
  if (exists(metaPath)) {
    const meta = JSON.parse(readFile(metaPath));
    const rel = path.relative(PAGES_DIR, dir).split(path.sep).join('/');
    let route = meta.path;
    if (!route) route = rel === 'index' ? '/' : `/${rel}/`;
    acc.push({ ...meta, dir, route });
  }
  return acc;
}

function outputFile(route) {
  const rel = route.endsWith('/') ? path.join(route, 'index.html') : route;
  return path.join(DIST, rel);
}

// ---------- plantillas ----------
const templates = {};
for (const name of ['head', 'header', 'footer', 'ad-slot']) {
  templates[name] = readFile(path.join(SRC, 'templates', `${name}.html`));
}

const css = minifyCss(readFile(path.join(SRC, 'assets', 'css', 'styles.css')));
const assetVersion = (rel) => hash(readFile(path.join(SRC, 'assets', rel)));

// Con adsenseClientId se carga el script de AdSense en el <head> (verificación y anuncios automáticos) y se genera ads.txt.
// Los bloques fijos (ad-slot.html) solo se insertan si además adsEnabled es true y el bloque tiene su ID.
const adsScript = Boolean(config.adsenseClientId);
const adsOn = Boolean(config.adsEnabled && config.adsenseClientId);

function adSlot(name) {
  if (!adsOn || !(config.adSlots && config.adSlots[name])) return '';
  return render(templates['ad-slot'], {
    slotName: name,
    adsenseClientId: config.adsenseClientId,
    adSlotId: (config.adSlots && config.adSlots[name]) || ''
  });
}

function adsenseHead() {
  if (!adsScript) return '';
  return (
    '<script>(function(){var c;try{c=localStorage.getItem("ct-consent")}catch(e){}' +
    'if(c!=="accepted"){(window.adsbygoogle=window.adsbygoogle||[]).requestNonPersonalizedAds=1}})();</script>\n' +
    `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${escapeHtml(config.adsenseClientId)}" crossorigin="anonymous"></script>`
  );
}

function analyticsHead() {
  if (!config.analyticsId) return '';
  const id = escapeHtml(config.analyticsId);
  return (
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>\n` +
    `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","${id}");</script>`
  );
}

// Íconos SVG por categoría (se usan en tarjetas y en el footer)
const categoryIcons = {
  alquiler: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  laboral: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  impuestos: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  utilidades: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'
};
function icon(cat) {
  return `<svg class="icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${categoryIcons[cat] || categoryIcons.utilidades}</svg>`;
}

// Botón de donaciones (Cafecito). Propio, sin imágenes externas. Vacío si no hay cafecitoUrl.
function cafecitoButton() {
  if (!config.cafecitoUrl) return '';
  return (
    `<a class="btn-cafecito" href="${escapeHtml(config.cafecitoUrl)}" rel="noopener" target="_blank">` +
    '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v3M12 3v3"/></svg>' +
    '<span>Invitame un Cafecito</span></a>'
  );
}

// ---------- bloques generados ----------
function breadcrumbItems(page) {
  const items = [{ name: 'Inicio', url: '/' }];
  if (page.category) {
    const cat = config.categories.find((c) => c.id === page.category);
    if (cat) items.push({ name: cat.name, url: `/#${cat.id}` });
  }
  if (page.route !== '/') items.push({ name: page.breadcrumb || page.h1, url: page.route });
  return items;
}

function breadcrumbsHtml(page) {
  if (page.route === '/' || page.type === 'error') return '';
  const items = breadcrumbItems(page);
  const lis = items
    .map((it, i) =>
      i === items.length - 1
        ? `<li aria-current="page">${escapeHtml(it.name)}</li>`
        : `<li><a href="${it.url}">${escapeHtml(it.name)}</a></li>`
    )
    .join('');
  return `<nav class="breadcrumbs" aria-label="Ruta de navegación"><ol>${lis}</ol></nav>`;
}

function faqHtml(page) {
  if (!page.faq || !page.faq.length) return '';
  const items = page.faq
    .map(
      (f) =>
        `<details class="faq-item"><summary>${escapeHtml(f.q)}</summary><div class="faq-answer"><p>${f.a}</p></div></details>`
    )
    .join('\n');
  return `<section class="faq" aria-labelledby="faq-title"><h2 id="faq-title">Preguntas frecuentes</h2>\n${items}\n</section>`;
}

function relatedHtml(page, byRoute) {
  const list = (page.related || []).map((r) => byRoute[r]).filter(Boolean);
  const missing = (page.related || []).filter((r) => !byRoute[r]);
  if (missing.length) warnings.push(`${page.route}: relacionadas aún no creadas (se omiten): ${missing.join(', ')}`);
  if (!list.length) return '';
  const cards = list.map((p) => card(p)).join('\n');
  return `<section class="related" aria-labelledby="related-title"><h2 id="related-title">Herramientas relacionadas</h2><div class="cards">${cards}</div></section>`;
}

function card(p) {
  const c = p.card;
  return (
    `<a class="card" href="${p.route}" data-search="${escapeHtml((c.name + ' ' + c.desc + ' ' + (c.keywords || '')).toLowerCase())}">` +
    `<span class="card-icon">${icon(p.category)}</span>` +
    `<span class="card-body"><span class="card-title">${escapeHtml(c.name)}</span>` +
    `<span class="card-desc">${escapeHtml(c.desc)}</span></span></a>`
  );
}

function toolCardsHtml(tools) {
  return config.categories
    .map((cat) => {
      const list = tools.filter((t) => t.category === cat.id);
      if (!list.length) return '';
      return (
        `<section class="category" id="${cat.id}" aria-labelledby="cat-${cat.id}">` +
        `<h2 id="cat-${cat.id}">${escapeHtml(cat.name)}</h2>` +
        `<div class="cards">${list.map(card).join('\n')}</div></section>`
      );
    })
    .join('\n');
}

function footerToolsHtml(tools) {
  return tools.map((t) => `<li><a href="${t.route}">${escapeHtml(t.card.name)}</a></li>`).join('');
}

function navHtml(tools) {
  return config.categories
    .filter((c) => tools.some((t) => t.category === c.id))
    .map((c) => `<li><a href="/#${c.id}">${escapeHtml(c.name.split(' ')[0])}</a></li>`)
    .join('');
}

// ---------- JSON-LD ----------
function jsonLd(page) {
  const url = SITE + page.route;
  const graph = [];
  if (page.type === 'home') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      name: config.siteName,
      url: `${SITE}/`,
      inLanguage: 'es-AR',
      description: page.description
    });
    graph.push({
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: config.siteName,
      url: `${SITE}/`,
      logo: `${SITE}/assets/img/logo.png`,
      email: config.contactEmail
    });
  } else if (page.type === 'tool') {
    graph.push({
      '@type': 'WebApplication',
      name: page.h1,
      url,
      description: page.description,
      applicationCategory: page.appCategory || 'UtilitiesApplication',
      operatingSystem: 'Cualquiera (navegador web)',
      browserRequirements: 'Requiere JavaScript',
      inLanguage: 'es-AR',
      isAccessibleForFree: true,
      dateModified: page.updated,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'ARS' },
      publisher: { '@id': `${SITE}/#organization`, '@type': 'Organization', name: config.siteName }
    });
  } else if (page.type !== 'error') {
    graph.push({
      '@type': 'WebPage',
      name: page.h1,
      url,
      description: page.description,
      inLanguage: 'es-AR',
      dateModified: page.updated
    });
  }
  if (page.faq && page.faq.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: page.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') }
      }))
    });
  }
  if (page.route !== '/' && page.type !== 'error') {
    const items = breadcrumbItems(page);
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        item: SITE + it.url
      }))
    });
  }
  if (!graph.length) return '';
  return `<script type="application/ld+json">${jsonForScript({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

// ---------- build ----------
function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const pages = findPages(PAGES_DIR).sort((a, b) => a.route.localeCompare(b.route));
  const byRoute = Object.fromEntries(pages.map((p) => [p.route, p]));
  const tools = pages
    .filter((p) => p.card)
    .sort((a, b) => (a.card.order || 99) - (b.card.order || 99));

  // Datos: se copian a /dist/data y se pueden incrustar en la página con {{data:nombre}}
  const dataVars = {};
  const dataJson = {};
  const DATA_DIR = path.join(ROOT, 'data');
  if (exists(DATA_DIR)) {
    for (const f of fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'))) {
      const name = f.replace(/\.json$/, '');
      const json = JSON.parse(readFile(path.join(DATA_DIR, f)));
      dataJson[name] = json;
      dataVars[`data:${name}`] = `<script type="application/json" id="data-${name}">${jsonForScript(json)}</script>`;
    }
    copyDir(DATA_DIR, path.join(DIST, 'data'));
  }

  const globals = {
    siteName: config.siteName,
    siteUrl: SITE,
    year: String(config.year),
    contactEmail: config.contactEmail,
    css,
    commonJsVersion: hash(assetVersion('js/common.js') + assetVersion('js/format.js')),
    nav: navHtml(tools),
    footerTools: footerToolsHtml(tools),
    toolCards: toolCardsHtml(tools),
    cafecito: cafecitoButton(),
    adsenseHead: adsenseHead(),
    analyticsHead: analyticsHead(),
    'ad:resultado': adSlot('resultado'),
    'ad:medio': adSlot('medio'),
    'ad:prefooter': adSlot('prefooter'),
    ...dataVars
  };

  for (const page of pages) {
    const canonical = SITE + page.route;
    const vars = {
      ...globals,
      title: escapeHtml(page.title),
      description: escapeHtml(page.description),
      canonical,
      robots: page.type === 'error' ? 'noindex, follow' : 'index, follow',
      ogType: page.type === 'home' ? 'website' : 'article',
      ogImage: `${SITE}/assets/img/og-default.png`,
      h1: escapeHtml(page.h1),
      updated: page.updated || '',
      updatedHuman: page.updated ? humanDate(page.updated) : '',
      jsonld: jsonLd(page)
    };

    // prerender.js opcional: devuelve variables extra generadas en el build (ej. tablas a partir de /data)
    const prerender = path.join(page.dir, 'prerender.js');
    if (exists(prerender)) Object.assign(vars, require(prerender)({ data: dataJson, config, escapeHtml }));

    const contentPath = path.join(page.dir, 'content.html');
    const content = render(readFile(contentPath), vars);

    const extraFiles = fs
      .readdirSync(page.dir)
      .filter((f) => !['page.json', 'content.html', 'prerender.js'].includes(f) && !f.endsWith('.md'));
    const outFile = outputFile(page.route);
    const outDir = path.dirname(outFile);
    fs.mkdirSync(outDir, { recursive: true });

    // Scripts de la página: se incluyen en el orden definido en page.json (scripts)
    const pageScripts = (page.scripts || [])
      .map((s) => {
        const isAbs = s.startsWith('/');
        const srcPath = isAbs ? path.join(SRC, s.replace(/^\/assets\//, 'assets/')) : path.join(page.dir, s);
        return `<script src="${s}?v=${hash(readFile(srcPath))}" defer></script>`;
      })
      .join('\n');

    const updatedBlock =
      page.updated && page.type !== 'home' && page.type !== 'error'
        ? `<p class="updated">Última actualización: <time datetime="${page.updated}">${vars.updatedHuman}</time></p>`
        : '';
    const donateBlock =
      page.type === 'tool' && config.cafecitoUrl
        ? `<aside class="donate" aria-label="Apoyar a ${escapeHtml(config.siteName)}"><p><strong>¿Te sirvió esta herramienta?</strong> ${escapeHtml(config.siteName)} es gratis y sin registro. Si querés ayudar a mantenerlo, podés invitarnos un café.</p>${globals.cafecito}</aside>`
        : '';

    const html = [
      render(templates.head, vars),
      render(templates.header, vars),
      '<main id="contenido" class="container">',
      breadcrumbsHtml(page),
      content,
      faqHtml(page),
      relatedHtml(page, byRoute),
      donateBlock,
      updatedBlock,
      '</main>',
      page.type === 'tool' ? adSlot('prefooter') : '',
      render(templates.footer, vars),
      pageScripts,
      '</body>\n</html>\n'
    ]
      .filter(Boolean)
      .join('\n');

    const leftover = html.match(/\{\{\s*[\w:.-]+\s*\}\}/g);
    if (leftover) throw new Error(`${page.route}: placeholders sin resolver: ${[...new Set(leftover)].join(', ')}`);

    if (page.title.length > 60) warnings.push(`${page.route}: title de ${page.title.length} caracteres (máx. 60)`);
    if (page.description.length > 155) warnings.push(`${page.route}: description de ${page.description.length} caracteres (máx. 155)`);

    fs.writeFileSync(outFile, html);
    for (const f of extraFiles) fs.copyFileSync(path.join(page.dir, f), path.join(outDir, f));
  }

  // Assets comunes (el CSS se incrusta en cada página, pero se copia igual)
  copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));

  // CNAME
  if (exists(path.join(ROOT, 'CNAME'))) fs.copyFileSync(path.join(ROOT, 'CNAME'), path.join(DIST, 'CNAME'));

  // sitemap.xml
  const urls = pages
    .filter((p) => p.type !== 'error' && !p.noindex)
    .map(
      (p) =>
        `  <url>\n    <loc>${SITE}${p.route}</loc>\n` +
        (p.updated ? `    <lastmod>${p.updated}</lastmod>\n` : '') +
        `  </url>`
    )
    .join('\n');
  fs.writeFileSync(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );

  // robots.txt
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

  // ads.txt
  const pub = (config.adsenseClientId || '').replace(/^ca-/, '');
  fs.writeFileSync(
    path.join(DIST, 'ads.txt'),
    pub
      ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
      : '# Completar adsenseClientId en config.json para generar la línea de Google AdSense.\n# google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n'
  );

  // .nojekyll para que GitHub Pages sirva todo tal cual
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

  console.log(`Build OK: ${pages.length} páginas en /dist (AdSense: ${adsScript ? 'script activo' : 'sin script'}, bloques ${adsOn ? 'activados' : 'desactivados'}).`);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
}

build();
