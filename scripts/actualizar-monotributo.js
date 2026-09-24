#!/usr/bin/env node
/*
 * Actualiza data/monotributo.json leyendo la tabla de categorías vigentes de ARCA.
 * Uso: node scripts/actualizar-monotributo.js
 * Si ARCA cambia el formato de la página, el script falla y no toca el archivo.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const URL = 'https://www.afip.gob.ar/monotributo/categorias.asp';
const FILE = path.join(__dirname, '..', 'data', 'monotributo.json');

const num = (s) => parseFloat(s.replace(/[^\d,]/g, '').replace(',', '.'));
const firstNum = (s) => num(s.match(/[\d.]+(,\d+)?/)[0]);
const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

(async () => {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = (await res.text()).replace(/<!--[\s\S]*?-->/g, '');

  const vig = text(html).match(/Valores de aplicación desde el (\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!vig) throw new Error('No se encontró la fecha de vigencia');
  const vigenciaDesde = `${vig[3]}-${vig[2].padStart(2, '0')}-${vig[1].padStart(2, '0')}`;

  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((m) => [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => text(c[1])))
    .filter((cells) => /^[A-K]$/.test(cells[0]));
  if (rows.length !== 11) throw new Error(`Se esperaban 11 categorías y hay ${rows.length}`);

  let precioUnitarioMax = null;
  const categorias = rows.map((c) => {
    // Columnas: cat, ingresos, superficie, energía, alquileres, precio unitario, imp. servicios, imp. bienes, SIPA, obra social, total serv., total bienes
    if (c.length !== 12) throw new Error(`Fila ${c[0]} con ${c.length} columnas`);
    precioUnitarioMax = num(c[5]);
    const cat = {
      categoria: c[0],
      ingresosMax: num(c[1]),
      superficieMax: firstNum(c[2]),
      energiaMax: firstNum(c[3]),
      alquileresMax: num(c[4]),
      impuesto: { servicios: num(c[6]), bienes: num(c[7]) },
      sipa: num(c[8]),
      obraSocial: num(c[9]),
      total: { servicios: num(c[10]), bienes: num(c[11]) }
    };
    for (const act of ['servicios', 'bienes']) {
      const suma = Math.round((cat.impuesto[act] + cat.sipa + cat.obraSocial) * 100) / 100;
      if (Math.abs(suma - cat.total[act]) > 0.02) throw new Error(`Total inconsistente en ${cat.categoria} (${act})`);
    }
    return cat;
  });

  const data = {
    actualizado: new Date().toISOString().slice(0, 10),
    vigenciaDesde,
    fuente: URL,
    notas: 'Montos en pesos. Ingresos brutos y alquileres: anuales (últimos 12 meses). Superficie en m2 y energía en kW anuales. Obra social: por titular, se suma el mismo importe por cada adherente.',
    precioUnitarioMax,
    categorias
  };
  fs.writeFileSync(FILE, JSON.stringify(data, null, 1) + '\n');
  console.log(`Monotributo: ${categorias.length} categorías vigentes desde ${vigenciaDesde}`);
})().catch((e) => {
  console.error('Error actualizando monotributo:', e.message);
  process.exit(1);
});
