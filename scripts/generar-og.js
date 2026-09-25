#!/usr/bin/env node
/*
 * Genera las imágenes para compartir (Open Graph, 1200×630) de cada herramienta en src/assets/img/og/.
 * Requiere Playwright con Chromium (solo para desarrollo; el build no lo necesita).
 * Uso: node scripts/generar-og.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) {
    console.error('Instalá Playwright para generar las imágenes: npm i -g playwright && npx playwright install chromium');
    process.exit(1);
  }
}

const ROOT = path.join(__dirname, '..');
const PAGES = path.join(ROOT, 'src', 'pages');
const OUT = path.join(ROOT, 'src', 'assets', 'img', 'og');
const logo = fs.readFileSync(path.join(ROOT, 'src', 'assets', 'img', 'favicon.svg'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function pages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) pages(path.join(dir, e.name), acc);
  const f = path.join(dir, 'page.json');
  if (fs.existsSync(f)) {
    const meta = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (meta.card) acc.push({ slug: path.relative(PAGES, dir).split(path.sep).join('-'), meta });
  }
  return acc;
}

const html = (m) => `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;box-sizing:border-box;padding:70px 80px;background:#0f766e;color:#fff;font-family:system-ui,'DejaVu Sans',sans-serif;display:flex;flex-direction:column;justify-content:space-between">
  <div style="display:flex;align-items:center;gap:20px">
    <div style="width:84px;height:84px;background:#fff;border-radius:20px;display:grid;place-items:center">${logo.replace('<svg', '<svg width="64" height="64"')}</div>
    <div style="font-size:52px;font-weight:800">Caja<span style="color:#f5a524">tool</span></div>
  </div>
  <div>
    <div style="font-size:78px;font-weight:800;line-height:1.08;letter-spacing:-1px">${esc(m.card.name)}</div>
    <div style="font-size:38px;margin-top:22px;opacity:.93;line-height:1.3;max-width:1000px">${esc(m.card.desc)}</div>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:30px;opacity:.9"><span>Calculadora gratis · Argentina 2026</span><span>cajatool.com</span></div>
</div></body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const list = pages(PAGES);
  for (const { slug, meta } of list) {
    await page.setContent(html(meta));
    await page.screenshot({ path: path.join(OUT, `${slug}.png`) });
  }
  await browser.close();
  console.log(`${list.length} imágenes generadas en src/assets/img/og/`);
})();
