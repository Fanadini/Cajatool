const assert = require('assert');
const P = require('../src/pages/finanzas/plazo-fijo/calc.js');
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} esperado ${b}, obtenido ${a}`);

test('$ 1.000.000 a 30 días con 19,72 % TNA → $ 16.208,22 de interés', () => {
  const r = P.calcular({ capital: 1000000, dias: 30, tna: 19.72, inflacionMensual: 1.89 });
  assert.strictEqual(r.interes, Math.round(1000000 * 0.1972 * 30 / 365 * 100) / 100);
  assert.strictEqual(r.interes, 16208.22);
  assert.strictEqual(r.leGana, false); // 1,62 % < 1,89 % de inflación
});

test('le gana a la inflación cuando la tasa del período supera a la inflación', () => {
  const r = P.calcular({ capital: 500000, dias: 30, tna: 30, inflacionMensual: 2 });
  assert.strictEqual(r.leGana, true);
  near(r.rendimientoReal, ((1 + 0.30 * 30 / 365) / 1.02 - 1) * 100, 0.01);
});

test('renovando 12 veces a 30 días se capitaliza: la TEA supera a la TNA', () => {
  const r = P.calcular({ capital: 1000000, dias: 30, tna: 24, inflacionMensual: 0, renovar: true, meses: 12 });
  assert.strictEqual(r.filas.length, 12);
  near(r.montoFinal, 1000000 * Math.pow(1 + 0.24 * 30 / 365, 12), 0.02);
  near(r.tea, (Math.pow(1 + 0.24 * 30 / 365, 365 / 30) - 1) * 100, 0.01);
  assert.ok(r.tea > 24);
});

test('365 días sin renovar: interés simple igual a la TNA', () => {
  const r = P.calcular({ capital: 100000, dias: 365, tna: 20, inflacionMensual: 0 });
  assert.strictEqual(r.interes, 20000);
  assert.strictEqual(r.rendimiento, 20);
});

test('validaciones: plazo mínimo de 30 días y capital positivo', () => {
  assert.throws(() => P.calcular({ capital: 1000, dias: 15, tna: 20 }));
  assert.throws(() => P.calcular({ capital: 0, dias: 30, tna: 20 }));
});
