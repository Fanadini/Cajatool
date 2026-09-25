const assert = require('assert');
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} esperado ${b}, obtenido ${a}`);
const P = require('../src/pages/finanzas/simulador-prestamo/calc.js');
const D = require('../src/pages/finanzas/dolar-tarjeta/calc.js');
const V = require('../src/pages/impuestos/calculadora-iva/calc.js');
const H = require('../src/pages/laboral/horas-extra/calc.js');

// Préstamo
test('préstamo francés: $ 1.000.000 en 12 cuotas al 60 % TNA → cuota de $ 112.825,41', () => {
  const r = P.calcular({ monto: 1000000, cuotas: 12, tna: 60, sistema: 'frances' });
  assert.strictEqual(r.primeraCuota, 112825.41);
  assert.strictEqual(r.filas[0].interes, 50000); // 5 % del saldo inicial
  assert.strictEqual(r.filas[11].saldo, 0);
  near(r.totalPagado, 112825.41 * 12, 0.1);
  near(r.tea, (1.05 ** 12 - 1) * 100, 0.01);
});
test('préstamo alemán: amortización fija y cuotas decrecientes', () => {
  const r = P.calcular({ monto: 1000000, cuotas: 12, tna: 60, sistema: 'aleman' });
  assert.strictEqual(r.primeraCuota, 133333.33);
  assert.ok(r.filas.every((f) => Math.abs(f.amortizacion - 83333.33) < 0.02));
  assert.ok(r.ultimaCuota < r.primeraCuota);
});
test('préstamo con IVA sobre intereses: el costo efectivo supera a la TEA', () => {
  const r = P.calcular({ monto: 1000000, cuotas: 12, tna: 60, sistema: 'frances', iva: true });
  assert.strictEqual(r.filas[0].iva, 10500); // 21 % de 50.000
  assert.ok(r.costoEfectivoAnual > r.tea);
  assert.throws(() => P.calcular({ monto: 0, cuotas: 12, tna: 60 }));
});

// Dólar tarjeta
test('USD 10 de servicio digital a $ 1.538,39: IVA 21 % + percepción 30 % → 1,51 veces', () => {
  const r = D.calcular({ usd: 10, tipoCambio: 1538.39, digital: true });
  assert.strictEqual(r.base, 15383.9);
  assert.strictEqual(r.iva, 3230.62);
  assert.strictEqual(r.percepcion, 4615.17);
  assert.strictEqual(r.total, 23229.69);
  assert.strictEqual(r.recargoPct, 51);
});
test('compra en el exterior (no digital) con IIBB 2 % y pago con dólares propios', () => {
  assert.strictEqual(D.calcular({ usd: 100, tipoCambio: 1500, digital: false, iibb: 2 }).total, 150000 * 1.32);
  const propios = D.calcular({ usd: 100, tipoCambio: 1500, digital: true, dolaresPropios: true });
  assert.strictEqual(propios.percepcion, 0);
  assert.strictEqual(propios.total, 181500);
});

// IVA
test('IVA: agregar 21 % a $ 100.000 y quitarlo de $ 121.000', () => {
  assert.deepStrictEqual(V.calcular({ monto: 100000, alicuota: 21, modo: 'agregar' }), { neto: 100000, iva: 21000, total: 121000 });
  assert.deepStrictEqual(V.calcular({ monto: 121000, alicuota: 21, modo: 'quitar' }), { neto: 100000, iva: 21000, total: 121000 });
});
test('IVA reducido 10,5 % y alícuota inválida', () => {
  assert.deepStrictEqual(V.calcular({ monto: 110500, alicuota: 10.5, modo: 'quitar' }), { neto: 100000, iva: 10500, total: 110500 });
  assert.throws(() => V.calcular({ monto: 100, alicuota: 19, modo: 'agregar' }));
});

// Horas extra
test('horas extra: $ 1.040.000 con jornada de 48 h (208 h/mes) → hora $ 5.000; 10 h al 50 % y 4 h al 100 %', () => {
  assert.strictEqual(H.horasMensuales(48), 208);
  const r = H.calcular({ sueldo: 1040000, horasSemanales: 48, horas50: 10, horas100: 4 });
  assert.strictEqual(r.valorHora, 5000);
  assert.strictEqual(r.pago50, 75000);
  assert.strictEqual(r.pago100, 40000);
  assert.strictEqual(r.total, 115000);
});
test('horas extra con divisor de convenio (200) y validaciones', () => {
  const r = H.calcular({ sueldo: 1000000, divisor: 200, horas50: 8 });
  assert.strictEqual(r.valorHora50, 7500);
  assert.strictEqual(r.total, 60000);
  assert.throws(() => H.calcular({ sueldo: 1000000, horas50: 0, horas100: 0 }));
});
