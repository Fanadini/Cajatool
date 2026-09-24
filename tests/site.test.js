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
    const url = 'https://cajatools.com' + p.rel.replace(/index\.html$/, '');
    assert.ok(sm.includes(`<loc>${url}</loc>`), `sitemap sin ${url}`);
  }
});

test('robots.txt, ads.txt y CNAME existen', () => {
  assert.ok(fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8').includes('Sitemap: https://cajatools.com/sitemap.xml'));
  assert.ok(fs.existsSync(path.join(DIST, 'ads.txt')));
  assert.strictEqual(fs.readFileSync(path.join(DIST, 'CNAME'), 'utf8').trim(), 'cajatools.com');
});

test('con anuncios desactivados no se carga AdSense', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
  if (cfg.adsEnabled) return;
  for (const p of pages) assert.ok(!p.html.includes('adsbygoogle.js'), p.rel);
});
