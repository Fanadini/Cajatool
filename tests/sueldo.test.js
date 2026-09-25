const assert = require('assert');
const S = require('../src/pages/laboral/sueldo-neto/calc.js');
const data = require('../data/ganancias.json');
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} esperado ${b}, obtenido ${a}`);
const DED = 5585736.93 + 26811537.29; // mínimo no imponible + deducción especial (ARCA, jul–dic 2026)

test('$ 1.000.000 bruto: 17 % de aportes y sin Ganancias → neto $ 830.000', () => {
  const r = S.calcular({ bruto: 1000000, mes: '2026-09' }, data);
  assert.deepStrictEqual(r.aportes, { jubilacion: 110000, pami: 30000, obraSocial: 30000 });
  assert.strictEqual(r.retencion, 0);
  assert.strictEqual(r.neto, 830000);
});

test('$ 5.000.000 bruto soltero (sept 2026): aportes con tope de $ 4.691.748,47 y Ganancias al 23 %', () => {
  const r = S.calcular({ bruto: 5000000, mes: '2026-09' }, data);
  assert.strictEqual(r.topeAplicado, true);
  assert.strictEqual(r.totalAportes, 797597.23); // 11 % + 3 % + 3 % de 4.691.748,47, redondeando cada aporte como en el recibo
  const neta = 5000000 * 13 - 797597.23 * 13 - DED;
  near(r.gananciaNetaAnual, neta, 0.01);
  const impuesto = 2905779.13 + (neta - 19516426.99) * 0.23;
  near(r.retencion, impuesto / 13, 0.01);
  assert.strictEqual(r.alicuotaMarginal, 23);
  near(r.neto, 5000000 - 797597.23 - impuesto / 13, 0.01);
});

test('casado con 2 hijos: las cargas de familia bajan la retención (19 %)', () => {
  const r = S.calcular({ bruto: 5000000, mes: '2026-09', conyuge: true, hijos: 2 }, data);
  const neta = 5000000 * 13 - 797597.23 * 13 - DED - 5260643.86 - 2 * 2652961.9;
  near(r.retencion, (1051718.57 + (neta - 9758213.49) * 0.19) / 13, 0.01);
  assert.strictEqual(r.alicuotaMarginal, 19);
});

test('desde octubre 2026 rige el tope nuevo ($ 4.769.631,49)', () => {
  const r = S.calcular({ bruto: 6000000, mes: '2026-10' }, data);
  assert.strictEqual(r.base, 4769631.49);
  assert.strictEqual(r.tope.norma, 'Resolución ANSES 284/2026');
});

test('umbral de Ganancias: justo debajo no retiene, justo arriba sí', () => {
  const u = S.calcular({ bruto: 1000000, mes: '2026-09' }, data).umbral;
  assert.strictEqual(S.calcular({ bruto: u - 100, mes: '2026-09' }, data).retencion, 0);
  assert.ok(S.calcular({ bruto: u + 1000, mes: '2026-09' }, data).retencion > 0);
});

test('escala: tramo exacto y validación', () => {
  assert.strictEqual(S.impuestoEscala(2168491.89, data.escala).impuesto, 2168491.89 * 0.05);
  assert.throws(() => S.calcular({ bruto: 0 }, data));
});
