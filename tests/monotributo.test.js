const assert = require('assert');
const M = require('../src/pages/impuestos/monotributo/calc.js');
const data = require('../data/monotributo.json');

test('la escala tiene 11 categorías (A–K) con topes crecientes y totales consistentes', () => {
  assert.deepStrictEqual(data.categorias.map((c) => c.categoria).join(''), 'ABCDEFGHIJK');
  for (let i = 1; i < 11; i++) assert.ok(data.categorias[i].ingresosMax > data.categorias[i - 1].ingresosMax);
  assert.ok(data.fuente.startsWith('https://www.afip.gob.ar/'));
});

test('servicios con $ 10.000.000 anuales → categoría A, cuota $ 49.527,18 (ARCA, vigente desde 1/8/2026)', () => {
  const r = M.calcular({ ingresos: 10000000, actividad: 'servicios' }, data);
  assert.strictEqual(r.categoria, 'A');
  assert.strictEqual(r.cuota.total, 49527.18);
  assert.strictEqual(r.anual, 594326.16);
});

test('venta de bienes con $ 30.000.000 → categoría D, cuota $ 82.564,81', () => {
  const r = M.calcular({ ingresos: 30000000, actividad: 'bienes' }, data);
  assert.strictEqual(r.categoria, 'D');
  assert.strictEqual(r.cuota.total, 82564.81);
});

test('la superficie puede subir la categoría: $ 20 M con 70 m² → D (por ingresos sería C)', () => {
  assert.strictEqual(M.calcular({ ingresos: 20000000, actividad: 'servicios' }, data).categoria, 'C');
  const r = M.calcular({ ingresos: 20000000, actividad: 'servicios', superficie: 70 }, data);
  assert.strictEqual(r.categoria, 'D');
  assert.strictEqual(r.limitante, 'superficie afectada');
});

test('el tope exacto de una categoría todavía entra en ella', () => {
  assert.strictEqual(M.calcular({ ingresos: 12009410.45, actividad: 'servicios' }, data).categoria, 'A');
  assert.strictEqual(M.calcular({ ingresos: 12009410.46, actividad: 'servicios' }, data).categoria, 'B');
});

test('servicios desde la Ley 27.743 pueden llegar a K: $ 120 M → K, cuota $ 1.614.446,04', () => {
  const r = M.calcular({ ingresos: 120000000, actividad: 'servicios' }, data);
  assert.strictEqual(r.categoria, 'K');
  assert.strictEqual(r.cuota.total, 1614446.04);
});

test('en relación de dependencia solo se paga el impuesto integrado', () => {
  const r = M.calcular({ ingresos: 35000000, actividad: 'servicios', relacionDependencia: true }, data);
  assert.strictEqual(r.categoria, 'E');
  assert.deepStrictEqual(r.cuota, { impuesto: 55857.73, sipa: 0, obraSocial: 0, total: 55857.73 });
});

test('cada adherente suma una cuota de obra social; jubilados no pagan obra social', () => {
  const b = data.categorias[1];
  const r = M.calcular({ ingresos: 15000000, actividad: 'servicios', adherentes: 2 }, data);
  assert.strictEqual(r.cuota.total, Math.round((b.impuesto.servicios + b.sipa + b.obraSocial * 3) * 100) / 100);
  const j = M.calcular({ ingresos: 15000000, actividad: 'servicios', jubilado: true }, data);
  assert.strictEqual(j.cuota.obraSocial, 0);
});

test('exclusiones: supera el tope de K o el precio unitario máximo', () => {
  assert.ok(M.calcular({ ingresos: 130000000, actividad: 'servicios' }, data).excluido);
  assert.ok(M.calcular({ ingresos: 5000000, actividad: 'bienes', precioUnitario: 800000 }, data).excluido);
  assert.ok(!M.calcular({ ingresos: 5000000, actividad: 'servicios', precioUnitario: 800000 }, data).excluido);
});
