#!/usr/bin/env node
/*
 * Actualiza data/indices.json con datos oficiales:
 *  - ICL diario: API de estadísticas del BCRA (variable 40).
 *  - IPC nacional nivel general (INDEC): API de series de tiempo de datos.gob.ar.
 * El coeficiente Casa Propia no tiene API: se carga a mano desde el PDF oficial (ver DATOS-A-ACTUALIZAR.md).
 * Uso: node scripts/actualizar-indices.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'indices.json');
const today = new Date().toISOString().slice(0, 10);

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function icl() {
  const out = new Map();
  // La API devuelve como máximo 3000 registros por pedido: se pide por año.
  for (let y = 2020; y <= new Date().getFullYear(); y++) {
    const url = `https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/40?desde=${y}-01-01&hasta=${y}-12-31&limit=3000`;
    const json = await getJson(url);
    for (const r of json.results[0].detalle) out.set(r.fecha, r.valor);
  }
  const fechas = [...out.keys()].sort();
  const desde = fechas[0];
  const valores = [];
  // Serie diaria continua (el BCRA publica todos los días corridos). Si falta un día se repite el anterior.
  for (let d = new Date(desde + 'T00:00:00Z'); d.toISOString().slice(0, 10) <= fechas[fechas.length - 1]; d.setUTCDate(d.getUTCDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    const v = out.has(k) ? out.get(k) : valores[valores.length - 1];
    valores.push(Math.round(v * 1e4) / 1e4);
  }
  return {
    descripcion: 'Índice para Contratos de Locación (base 30/6/2020 = 1), valor diario',
    fuente: 'https://www.bcra.gob.ar/PublicacionesEstadisticas/Principales_variables_datos.asp?serie=7988',
    api: 'https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/40',
    actualizado: today,
    desde,
    hasta: fechas[fechas.length - 1],
    valores
  };
}

async function ipc() {
  const url = 'https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26&limit=1000&format=json&start_date=2016-12-01';
  const json = await getJson(url);
  const niveles = {};
  for (const [fecha, valor] of json.data) if (valor !== null) niveles[fecha.slice(0, 7)] = Math.round(valor * 1e4) / 1e4;
  const meses = Object.keys(niveles).sort();
  return {
    descripcion: 'IPC nacional, nivel general (base diciembre 2016 = 100), valor mensual',
    fuente: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31',
    api: 'https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26',
    actualizado: today,
    desde: meses[0],
    hasta: meses[meses.length - 1],
    niveles
  };
}

(async () => {
  const current = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
  const [iclData, ipcData] = await Promise.all([icl(), ipc()]);
  const data = { ...current, actualizado: today, icl: iclData, ipc: ipcData };
  fs.writeFileSync(FILE, JSON.stringify(data, null, 1) + '\n');
  console.log(`ICL: ${iclData.desde} a ${iclData.hasta} (${iclData.valores.length} días)`);
  console.log(`IPC: ${ipcData.desde} a ${ipcData.hasta}`);
})().catch((e) => {
  console.error('Error actualizando índices:', e.message);
  process.exit(1);
});
