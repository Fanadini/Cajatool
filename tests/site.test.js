/* Chequeos del sitio generado: SEO, enlaces internos rotos y JSON-LD válido. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
execFileSync(process.execPath, [path.join(ROOT, 'build.js')], { stdio: 'pipe' });

function htmlFiles(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}
const pages = htmlFiles(DIST).map((file) => ({
  file,
  rel: '/' + path.relative(DIST, file).split(path.sep).join('/'),
  html: fs.readFileSync(file, 'utf8')
}));
const get = (html, re) => (html.match(re) || [])[1];
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

test(`se generaron ${pages.length} páginas HTML`, () => assert.ok(pages.length >= 6));

test('cada página tiene lang es-AR, un solo H1, title ≤ 60 y description ≤ 155', () => {
  for (const p of pages) {
    assert.ok(p.html.includes('<html lang="es-AR">'), `${p.rel}: falta lang`);
    assert.strictEqual((p.html.match(/<h1[\s>]/g) || []).length, 1, `${p.rel}: debe tener un H1`);
    const title = decode(get(p.html, /<title>([^<]*)<\/title>/) || '');
    const desc = decode(get(p.html, /<meta name="description" content="([^"]*)"/) || '');
    assert.ok(title && title.length <= 60, `${p.rel}: title "${title}" (${title.length})`);
    assert.ok(desc && desc.length <= 155, `${p.rel}: description (${desc.length})`);
  }
});

test('titles y descriptions no se repiten', () => {
  for (const key of ['title', 'description']) {
    const re = key === 'title' ? /<title>([^<]*)<\/title>/ : /<meta name="description" content="([^"]*)"/;
    const seen = {};
    for (const p of pages) {
      const v = get(p.html, re);
      assert.ok(!seen[v], `${key} duplicado en ${p.rel} y ${seen[v]}`);
      seen[v] = p.rel;
    }
  }
});

test('canonical, Open Graph y Twitter Card presentes', () => {
  for (const p of pages) {
    for (const tag of ['rel="canonical"', 'property="og:title"', 'property="og:image"', 'name="twitter:card"']) {
      assert.ok(p.html.includes(tag), `${p.rel}: falta ${tag}`);
    }
  }
});

test('los JSON-LD son JSON válido y las herramientas tienen WebApplication + FAQPage + BreadcrumbList', () => {
  for (const p of pages) {
    const blocks = [...p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    const types = [];
    for (const b of blocks) {
      const data = JSON.parse(b[1]);
      for (const n of data['@graph'] || [data]) types.push(n['@type']);
    }
    if (p.html.includes('class="tool"')) {
      for (const t of ['WebApplication', 'FAQPage', 'BreadcrumbList']) assert.ok(types.includes(t), `${p.rel}: falta ${t}`);
    }
  }
});

test('no hay enlaces internos rotos', () => {
  const broken = [];
  for (const p of pages) {
    for (const m of p.html.matchAll(/(?:href|src)="(\/[^"#?]*)[^"]*"/g)) {
      const url = m[1];
      let target = path.join(DIST, url);
      if (url.endsWith('/')) target = path.join(target, 'index.html');
      if (!fs.existsSync(target)) broken.push(`${p.rel} → ${url}`);
    }
  }
  assert.deepStrictEqual(broken, []);
});

test('sitemap incluye todas las páginas indexables y excluye 404', () => {
  const sm = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  assert.ok(!sm.includes('404'));
  for (const p of pages.filter((p) => !p.rel.endsWith('404.html'))) {
    const url = 'https://cajatool.com' + p.rel.replace(/index\.html$/, '');
    assert.ok(sm.includes(`<loc>${url}</loc>`), `sitemap sin ${url}`);
  }
});

test('robots.txt, ads.txt y CNAME existen', () => {
  assert.ok(fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8').includes('Sitemap: https://cajatool.com/sitemap.xml'));
  assert.ok(fs.existsSync(path.join(DIST, 'ads.txt')));
  assert.strictEqual(fs.readFileSync(path.join(DIST, 'CNAME'), 'utf8').trim(), 'cajatool.com');
});

test('AdSense según config: script solo con adsenseClientId y bloques solo con adsEnabled', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
  const adsTxt = fs.readFileSync(path.join(DIST, 'ads.txt'), 'utf8');
  for (const p of pages) {
    assert.strictEqual(p.html.includes('adsbygoogle.js?client=' + cfg.adsenseClientId), Boolean(cfg.adsenseClientId), p.rel);
    if (!cfg.adsEnabled) assert.ok(!p.html.includes('class="ad-slot'), `${p.rel}: hay bloques con anuncios desactivados`);
  }
  if (cfg.adsenseClientId) assert.strictEqual(adsTxt.trim(), `google.com, ${cfg.adsenseClientId.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0`);
});

// ---------- Estructura obligatoria de cada herramienta ----------
const tools = pages.filter((p) => p.html.includes('class="tool"'));
const words = (s) => s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const graphOf = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((b) => JSON.parse(b[1])['@graph']);

test(`hay 6 herramientas y cada una cumple la estructura (H1, herramienta arriba, texto, FAQ, relacionadas, fecha)`, () => {
  assert.strictEqual(tools.length, 6);
  for (const p of tools) {
    const h = p.html;
    const iH1 = h.indexOf('<h1'), iTool = h.indexOf('class="tool"'), iArt = h.indexOf('<article');
    assert.ok(iH1 < iTool && iTool < iArt, `${p.rel}: orden H1 → herramienta → texto`);
    assert.match(get(h, /<h1>([^<]*)<\/h1>/), /20\d\d|gratis|Conversor/, `${p.rel}: H1 con la búsqueda objetivo`);
    const n = words(h.slice(iArt, h.indexOf('</article>')));
    assert.ok(n >= 600 && n <= 1000, `${p.rel}: el texto tiene ${n} palabras (600–1000)`);
    const faqs = (h.match(/class="faq-item"/g) || []).length;
    assert.ok(faqs >= 4 && faqs <= 6, `${p.rel}: ${faqs} preguntas frecuentes`);
    assert.ok(h.includes('id="related-title"'), `${p.rel}: falta "Herramientas relacionadas"`);
    assert.ok(/Última actualización: <time datetime="\d{4}-\d{2}-\d{2}"/.test(h), `${p.rel}: falta la fecha de actualización`);
    assert.ok(/data-copy=|data-share=/.test(h), `${p.rel}: falta copiar o compartir`);
    assert.ok(/href="https:\/\/(www\.)?(argentina\.gob\.ar|afip\.gob\.ar|bcra\.gob\.ar|indec\.gob\.ar|iana\.org|hidro\.gob\.ar)/.test(h) || p.rel.includes('generador-qr'), `${p.rel}: falta enlace a la fuente oficial`);
  }
});

test('schemas: WebApplication, FAQPage y BreadcrumbList completos y coherentes con lo visible', () => {
  for (const p of tools) {
    const g = graphOf(p.html);
    const app = g.find((n) => n['@type'] === 'WebApplication');
    for (const k of ['name', 'url', 'description', 'applicationCategory', 'operatingSystem', 'offers']) assert.ok(app[k], `${p.rel}: WebApplication sin ${k}`);
    assert.strictEqual(app.offers.price, '0');
    const faq = g.find((n) => n['@type'] === 'FAQPage');
    assert.strictEqual(faq.mainEntity.length, (p.html.match(/class="faq-item"/g) || []).length, `${p.rel}: FAQ del schema ≠ FAQ visible`);
    for (const q of faq.mainEntity) assert.ok(q['@type'] === 'Question' && q.name && q.acceptedAnswer.text, `${p.rel}: pregunta incompleta`);
    const bc = g.find((n) => n['@type'] === 'BreadcrumbList');
    bc.itemListElement.forEach((it, i) => {
      assert.strictEqual(it.position, i + 1);
      assert.ok(it.item.startsWith('https://cajatool.com/'), `${p.rel}: breadcrumb sin URL absoluta`);
    });
    assert.strictEqual(bc.itemListElement.at(-1).item, get(p.html, /rel="canonical" href="([^"]+)"/), `${p.rel}: el último breadcrumb debe ser la página`);
    const visibles = (p.html.match(/<nav class="breadcrumbs"[\s\S]*?<\/nav>/)[0].match(/<li/g) || []).length;
    assert.strictEqual(visibles, bc.itemListElement.length, `${p.rel}: breadcrumbs visibles ≠ schema`);
  }
});

test('con AdSense activado: script en el head, 3 anuncios por herramienta y nunca encima de la herramienta', () => {
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cajatool-ads-'));
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
  Object.assign(cfg, { adsEnabled: true, adsenseClientId: 'ca-pub-1234567890123456', adSlots: { resultado: '1', medio: '2', prefooter: '3' } });
  fs.writeFileSync(path.join(tmp, 'config.json'), JSON.stringify(cfg));
  const out = path.join(tmp, 'dist');
  execFileSync(process.execPath, [path.join(ROOT, 'build.js')], { stdio: 'pipe', env: { ...process.env, CAJATOOL_CONFIG: path.join(tmp, 'config.json'), CAJATOOL_DIST: out } });
  assert.strictEqual(fs.readFileSync(path.join(out, 'ads.txt'), 'utf8').trim(), 'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0');
  for (const p of tools) {
    const h = fs.readFileSync(path.join(out, p.rel), 'utf8');
    assert.ok(h.indexOf('adsbygoogle.js') < h.indexOf('</head>'), `${p.rel}: script fuera del head`);
    const slots = [...h.matchAll(/class="ad-slot ad-slot--(\w+)"/g)].map((m) => m[1]);
    assert.deepStrictEqual(slots, ['resultado', 'medio', 'prefooter'], p.rel);
    const finTool = h.indexOf('</section>', h.indexOf('class="tool"'));
    assert.ok(h.indexOf('class="ad-slot') > finTool, `${p.rel}: hay un anuncio antes o dentro de la herramienta`);
    assert.ok(h.lastIndexOf('class="ad-slot') < h.indexOf('<footer'), `${p.rel}: anuncio después del footer`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('botón de Cafecito: en el footer de todas las páginas y al final de cada herramienta', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
  if (!cfg.cafecitoUrl) return;
  for (const p of pages) {
    const footer = p.html.slice(p.html.indexOf('<footer'));
    assert.ok(footer.includes(`href="${cfg.cafecitoUrl}" rel="noopener" target="_blank"`), `${p.rel}: falta en el footer`);
  }
  for (const p of tools) assert.ok(p.html.includes('class="donate"'), `${p.rel}: falta el bloque de donación`);
  assert.ok(!pages.some((p) => p.html.includes('cdn.cafecito.app')), 'no se cargan imágenes externas');
});
