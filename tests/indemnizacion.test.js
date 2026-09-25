const assert = require('assert');
const I = require('../src/pages/laboral/indemnizacion-despido/calc.js');
const byId = (r, id) => (r.conceptos.find((c) => c.id === id) || {}).monto || 0;
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} esperado ${b}, obtenido ${a}`);

test('antigüedad y años indemnizables: fracción mayor a 3 meses suma un año', () => {
  assert.deepStrictEqual(I.antiguedad('2021-03-01', '2026-06-30'), { anios: 5, meses: 4, dias: 0, totalMeses: 64 });
  assert.strictEqual(I.aniosIndemnizables(I.antiguedad('2021-03-01', '2026-06-30')), 6); // 5 años y 4 meses → 6
  assert.strictEqual(I.aniosIndemnizables(I.antiguedad('2021-03-01', '2026-05-31')), 5); // 5 años y 3 meses justos → 5
  assert.strictEqual(I.aniosIndemnizables(I.antiguedad('2021-03-01', '2026-06-01')), 6); // 3 meses y 1 día → 6
});

test('despido sin causa sin preaviso: 5 años y 4 meses, sueldo $ 1.000.000, egreso 30/6/2026', () => {
  const r = I.calcular({ ingreso: '2021-03-01', egreso: '2026-06-30', sueldo: 1000000, motivo: 'despido', preavisoOtorgado: false });
  assert.strictEqual(byId(r, 'antiguedad'), 6000000);
  assert.strictEqual(byId(r, 'preaviso'), 2000000); // más de 5 años: 2 meses
  near(byId(r, 'sac-preaviso'), 166666.67, 0.01);
  assert.strictEqual(byId(r, 'integracion'), 0); // egreso el último día del mes: no hay integración
  assert.strictEqual(byId(r, 'dias-mes'), 1000000);
  assert.strictEqual(byId(r, 'sac'), 500000); // semestre completo (181 de 181)
  near(byId(r, 'vacaciones'), 1000000 / 25 * 21 * 181 / 365, 0.01, 'vacaciones'); // 21 días × 181/365
});

test('despido a mitad de mes con menos de 5 años: preaviso de 1 mes e integración', () => {
  const r = I.calcular({ ingreso: '2024-01-10', egreso: '2026-09-15', sueldo: 900000, motivo: 'despido', preavisoOtorgado: false });
  assert.strictEqual(r.aniosIndemnizables, 3); // 2 años, 8 meses → 3
  assert.strictEqual(byId(r, 'antiguedad'), 2700000);
  assert.strictEqual(byId(r, 'preaviso'), 900000);
  assert.strictEqual(byId(r, 'integracion'), 450000); // 15 de 30 días faltantes
  near(byId(r, 'sac-integracion'), 37500, 0.01);
  assert.strictEqual(byId(r, 'dias-mes'), 450000);
});

test('tope del convenio (Ley 27.802): se aplica, pero nunca por debajo del 67 % del sueldo', () => {
  const conTope = I.calcular({ ingreso: '2020-01-01', egreso: '2026-03-31', sueldo: 3000000, motivo: 'despido', preavisoOtorgado: true, topeConvenio: 2500000 });
  assert.strictEqual(conTope.base, 2500000);
  assert.strictEqual(byId(conTope, 'antiguedad'), 2500000 * 6); // 6 años y 3 meses justos → 6
  const piso = I.calcular({ ingreso: '2020-01-01', egreso: '2026-03-31', sueldo: 3000000, motivo: 'despido', preavisoOtorgado: true, topeConvenio: 1500000 });
  assert.strictEqual(piso.base, 2010000); // 67 % de 3.000.000
  assert.strictEqual(byId(piso, 'preaviso'), 0); // con preaviso otorgado no hay sustitutiva ni integración
});

test('período de prueba (menos de 6 meses): sin indemnización, preaviso ni integración', () => {
  const r = I.calcular({ ingreso: '2026-05-01', egreso: '2026-08-20', sueldo: 800000, motivo: 'despido', preavisoOtorgado: false });
  assert.strictEqual(r.enPrueba, true);
  for (const id of ['antiguedad', 'preaviso', 'integracion']) assert.strictEqual(byId(r, id), 0, id);
  assert.ok(byId(r, 'sac') > 0 && byId(r, 'vacaciones') > 0);
});

test('renuncia: solo días trabajados, aguinaldo y vacaciones proporcionales', () => {
  const r = I.calcular({ ingreso: '2018-02-01', egreso: '2026-10-31', sueldo: 1200000, motivo: 'renuncia' });
  assert.deepStrictEqual(r.conceptos.map((c) => c.id), ['dias-mes', 'sac', 'vacaciones', 'sac-vacaciones']);
  near(byId(r, 'sac'), 600000 * 123 / 184, 0.01); // 1/7 al 31/10 = 123 días
  near(r.total, r.conceptos.reduce((s, c) => s + c.monto, 0), 0.01);
});

test('mínimo de un sueldo y validaciones', () => {
  const r = I.calcular({ ingreso: '2025-11-01', egreso: '2026-05-31', sueldo: 1000000, motivo: 'despido', preavisoOtorgado: true });
  assert.strictEqual(r.aniosIndemnizables, 1); // 7 meses: fracción > 3 meses → 1
  assert.throws(() => I.calcular({ ingreso: '2026-05-01', egreso: '2026-01-01', sueldo: 1, motivo: 'despido' }));
  assert.throws(() => I.calcular({ ingreso: '2020-01-01', egreso: '2026-01-01', sueldo: 0, motivo: 'despido' }));
});

test('régimen según la fecha de despido, no la del contrato: contrato de 1998 despedido en 2026 → Ley 27.802', () => {
  const r = I.calcular({ ingreso: '1998-04-01', egreso: '2026-09-30', sueldo: 1000000, motivo: 'despido', preavisoOtorgado: false });
  assert.strictEqual(r.regimen.id, 'ley27802');
  assert.strictEqual(byId(r, 'antiguedad'), 29000000); // 28 años y 6 meses → 29
  assert.strictEqual(I.regimen('2020-01-01', '2026-03-05').id, 'anterior');
  assert.strictEqual(I.regimen('2020-01-01', '2026-03-06').id, 'ley27802');
});

test('régimen anterior: despido en período de prueba con 15 días de preaviso', () => {
  // Ingreso posterior a la Ley Bases → prueba de 6 meses; despido el 15/2/2026 (antes de la Ley 27.802)
  const r = I.calcular({ ingreso: '2025-11-01', egreso: '2026-02-15', sueldo: 900000, motivo: 'despido', preavisoOtorgado: false });
  assert.strictEqual(r.regimen.id, 'anterior');
  assert.strictEqual(r.enPrueba, true);
  assert.strictEqual(byId(r, 'preaviso'), 450000); // 15 días
  assert.strictEqual(byId(r, 'antiguedad'), 0);
  assert.strictEqual(byId(r, 'integracion'), 0);
  // Mismo caso con la ley nueva: sin preaviso en el período de prueba
  const n = I.calcular({ ingreso: '2025-11-01', egreso: '2026-04-15', sueldo: 900000, motivo: 'despido', preavisoOtorgado: false });
  assert.strictEqual(byId(n, 'preaviso'), 0);
});

test('régimen anterior con contrato previo a la Ley Bases: período de prueba de 3 meses', () => {
  assert.strictEqual(I.regimen('2024-03-01', '2024-07-15').pruebaMeses, 3);
  const r = I.calcular({ ingreso: '2024-03-01', egreso: '2024-07-15', sueldo: 600000, motivo: 'despido', preavisoOtorgado: false });
  assert.strictEqual(r.enPrueba, false); // 4 meses y medio > 3
  assert.strictEqual(byId(r, 'antiguedad'), 600000); // fracción mayor a 3 meses → 1 sueldo
  assert.strictEqual(byId(r, 'preaviso'), 600000);
  near(byId(r, 'integracion'), 600000 / 31 * 16, 0.005); // 16 días hasta el 31/7
});
