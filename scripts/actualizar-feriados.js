#!/usr/bin/env node
/*
 * Actualiza data/feriados.json con el calendario oficial de feriados (argentina.gob.ar) del año actual y el siguiente.
 * Uso: node scripts/actualizar-feriados.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'feriados.json');
const URL = (y) => `https://www.argentina.gob.ar/sites/default/files/holidays-${y}-es.json`;

(async () => {
  const current = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : { anios: {} };
  const y = new Date().getFullYear();
  for (const anio of [y, y + 1]) {
    const res = await fetch(URL(anio));
    if (!res.ok) { console.log(`${anio}: todavía no publicado (HTTP ${res.status})`); continue; }
    const json = await res.json();
    const dias = json.mainEntity.itemListElement
      ? json.mainEntity.itemListElement.map((x) => x.item)
      : json.mainEntity.map((x) => x.item);
    current.anios[anio] = dias
      .map((d) => ({ fecha: d.startDate, nombre: d.name.replace(/\.$/, '').replace(/\s+/g, ' ').trim(), tipo: d.additionalProperty.value }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    console.log(`${anio}: ${current.anios[anio].length} días (${json.dateModified})`);
  }
  if (!Object.keys(current.anios).length) throw new Error('No se pudo obtener ningún calendario');
  current.actualizado = new Date().toISOString().slice(0, 10);
  current.fuente = 'https://www.argentina.gob.ar/feriados';
  current.tipos = { inamovible: 'Feriado inamovible', trasladable: 'Feriado trasladable', turistico: 'Día no laborable con fines turísticos', no_laborable: 'Día no laborable (solo para quienes profesan esa religión)' };
  fs.writeFileSync(FILE, JSON.stringify(current, null, 1) + '\n');
})().catch((e) => { console.error('Error actualizando feriados:', e.message); process.exit(1); });
