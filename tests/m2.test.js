const assert = require('assert');
const M = require('../src/pages/vivienda/valor-metro-cuadrado/calc.js');
const real = require('../data/m2-caba.json');
const fake = { series: { '2-usado': { periodo: '2026-T2', provisorio: true, barrios: { Total: { usd: 2300, anioAnterior: 2200 }, Palermo: { usd: 3100, anioAnterior: 2900 } } } } };

test('superficie homogeneizada: 50 m² cubiertos + 6 semicubiertos (50 %) + 4 descubiertos (30 %) = 54,2 m²', () => {
  assert.strictEqual(M.superficie({ cubierta: 50, semicubierta: 6, descubierta: 4 }), 54.2);
  assert.strictEqual(M.superficie({ cubierta: 50, semicubierta: 6, descubierta: 4, pctSemi: 100, pctDesc: 50 }), 58);
});

test('USD 150.000 por 54,2 m² → USD 2.767,53 el m²; 10,72 % debajo del promedio de Palermo', () => {
  const r = M.calcular({ precio: 150000, cubierta: 50, semicubierta: 6, descubierta: 4, barrio: 'Palermo', serie: '2-usado' }, fake);
  assert.strictEqual(r.usdM2, 2767.53);
  assert.strictEqual(r.diferenciaPct, -10.72);
  assert.strictEqual(r.valorEstimado, Math.round(3100 * 54.2));
  assert.strictEqual(r.referencia.variacionAnual, 6.9);
});

test('sin precio: estima el valor con el promedio del barrio; barrio sin dato usa el promedio de la Ciudad', () => {
  const r = M.calcular({ cubierta: 40, barrio: 'Palermo', serie: '2-usado' }, fake);
  assert.strictEqual(r.usdM2, null);
  assert.strictEqual(r.valorEstimado, 124000);
  const s = M.calcular({ cubierta: 40, barrio: 'Villa Soldati', serie: '2-usado' }, fake);
  assert.strictEqual(s.referencia.barrio, 'Total');
  assert.strictEqual(s.referencia.sinDato, true);
});

test('datos oficiales cargados: 4 series con promedio de la Ciudad y fuente del IEC', () => {
  assert.deepStrictEqual(Object.keys(real.series).sort(), ['2-estrenar', '2-usado', '3-estrenar', '3-usado']);
  for (const s of Object.values(real.series)) {
    assert.ok(/^\d{4}-T[1-4]$/.test(s.periodo));
    assert.ok(s.barrios.Total.usd > 500 && s.barrios.Total.usd < 10000);
  }
  assert.ok(real.fuente.startsWith('https://www.estadisticaciudad.gob.ar/'));
});

test('validaciones', () => {
  assert.throws(() => M.calcular({ cubierta: 0, precio: 1 }));
  assert.throws(() => M.calcular({ cubierta: 50 })); // sin precio ni barrio
});
