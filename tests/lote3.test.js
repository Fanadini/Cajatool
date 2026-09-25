const assert = require('assert');
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} esperado ${b}, obtenido ${a}`);
const idx = require('../data/indices.json');
const fer = require('../data/feriados.json');
const anses = require('../data/anses.json');
const bancos = require('../data/bancos.json').entidades;
const INF = require('../src/pages/finanzas/actualizar-por-inflacion/calc.js');
const FER = require('../src/pages/utilidades/feriados-2026/calc.js');
const CUIT = require('../src/pages/impuestos/calcular-cuil-cuit/calc.js');
const CBU = require('../src/pages/finanzas/validar-cbu/calc.js');
const UVA = require('../src/pages/finanzas/plazo-fijo-uva/calc.js');
const JUB = require('../src/pages/laboral/simulador-jubilacion/calc.js');
const MAT = require('../src/pages/vivienda/calculadora-materiales/calc.js');
const LIB = require('../src/pages/finanzas/libertad-financiera/calc.js');

test('inflación: ene → abr 2025 = 2,4 % · 3,7 % · 2,8 % (INDEC) ≈ 9,17 %', () => {
  const r = INF.actualizar({ monto: 100000, desde: '2025-01', hasta: '2025-04' }, idx.ipc.niveles);
  near(r.inflacionAcumulada, (1.024 * 1.037 * 1.028 - 1) * 100, 0.1);
  assert.strictEqual(r.meses, 3);
  assert.throws(() => INF.actualizar({ monto: 1, desde: '1990-01', hasta: '2025-01' }, idx.ipc.niveles));
});

test('feriados 2026: semana de Carnaval tiene 3 días hábiles y el próximo feriado después del 25/9 es el 12/10', () => {
  const l = fer.anios['2026'];
  assert.strictEqual(FER.diasHabiles('2026-02-16', '2026-02-20', l).habiles, 3);
  const p = FER.proximos('2026-09-25', l, 1)[0];
  assert.strictEqual(p.fecha, '2026-10-12');
  assert.strictEqual(p.faltan, 17);
});
test('días hábiles: 5 hábiles desde el viernes 4/12/2026 saltean el 7 (turístico) y el 8 (feriado) → 15/12', () => {
  const l = fer.anios['2026'];
  assert.strictEqual(FER.sumarHabiles('2026-12-04', 5, l), '2026-12-15');
  assert.strictEqual(FER.sumarHabiles('2026-12-04', 5, l, { turisticos: false }), '2026-12-14');
});

test('CUIT: ARCA 33-69345023-9 es válido; DNI 12.345.678 hombre → 20-12345678-6', () => {
  assert.strictEqual(CUIT.validar('33-69345023-9').valido, true);
  assert.strictEqual(CUIT.validar('33-69345023-8').valido, false);
  assert.strictEqual(CUIT.calcular('12345678', 'hombre').formateado, '20-12345678-6');
  const m = CUIT.calcular('12345678', 'mujer');
  assert.strictEqual(CUIT.validar(m.cuit).valido, true);
});
test('CUIT: cuando el dígito da 10 el prefijo pasa a 23', () => {
  // Busca un DNI cuyo dígito con prefijo 20 dé 10 y verifica la regla
  let dni = 10000000;
  const dv = (s) => { const w = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]; let t = 0; for (let i = 0; i < 10; i++) t += +s[i] * w[i]; const r = 11 - (t % 11); return r === 11 ? 0 : r; };
  while (dv('20' + dni) !== 10) dni++;
  const r = CUIT.calcular(String(dni), 'hombre');
  assert.strictEqual(r.prefijo, '23');
  assert.strictEqual(CUIT.validar(r.cuit).valido, true);
});

test('CBU: dígitos verificadores y banco (Banco Nación, código 011)', () => {
  const b1 = '0110599' ; const b1dv = CBU.dv(b1, [7, 1, 3, 9]);
  const b2 = '4000000123456'; const b2dv = CBU.dv(b2, [3, 9, 7, 1]);
  const cbu = b1 + b1dv + b2 + b2dv;
  const r = CBU.validar(cbu, bancos);
  assert.strictEqual(r.valido, true);
  assert.strictEqual(r.entidad, 'BANCO DE LA NACION ARGENTINA');
  assert.strictEqual(r.sucursal, '0599');
  const mal = cbu.slice(0, 21) + ((+cbu[21] + 1) % 10);
  assert.strictEqual(CBU.validar(mal, bancos).valido, false);
  assert.strictEqual(CBU.validar('123', bancos).valido, false);
});
test('CVU: empieza con 000 y no identifica banco', () => {
  const b1 = '0000003'; const b2 = '1000123456789';
  const cvu = b1 + CBU.dv(b1, [7, 1, 3, 9]) + b2 + CBU.dv(b2, [3, 9, 7, 1]);
  const r = CBU.validar(cvu, bancos);
  assert.strictEqual(r.tipo, 'CVU');
  assert.strictEqual(r.valido, true);
});

test('plazo fijo UVA vs tradicional: con inflación alta conviene UVA; hay una inflación de equilibrio', () => {
  const alta = UVA.comparar({ capital: 1000000, dias: 90, tna: 20, inflacionMensual: 3, tasaUva: 1 });
  assert.strictEqual(alta.conviene, 'uva');
  const baja = UVA.comparar({ capital: 1000000, dias: 90, tna: 20, inflacionMensual: 1, tasaUva: 1 });
  assert.strictEqual(baja.conviene, 'tradicional');
  const eq = UVA.comparar({ capital: 1000000, dias: 90, tna: 20, inflacionMensual: alta.inflacionEquilibrio, tasaUva: 1 });
  assert.strictEqual(eq.conviene, 'igual');
  assert.throws(() => UVA.comparar({ capital: 1000, dias: 30, tna: 20, inflacionMensual: 2 }));
});

test('jubilación: mujer de 55 con 25 años de aportes → 30 años a los 60, haber entre mínimo y máximo', () => {
  const r = JUB.calcular({ nacimiento: '1971-05-10', sexo: 'mujer', aniosAportes: 25, sigueAportando: true, sueldo: 2000000, hoy: '2026-09-25' }, anses);
  assert.strictEqual(r.edadHoy, 55);
  assert.strictEqual(r.fechaEdad, '2031-05-10');
  assert.strictEqual(r.aportesAlJubilarse, 30);
  assert.strictEqual(r.cumple, true);
  near(r.haber, anses.pbu + 2000000 * 0.015 * 30, 0.01);
});
test('jubilación: sin 30 años no cumple; sueldo bajo va al mínimo; el sueldo se topea en la base imponible máxima', () => {
  assert.strictEqual(JUB.calcular({ nacimiento: '1962-01-01', sexo: 'hombre', aniosAportes: 20, sigueAportando: false, sueldo: 1e6, hoy: '2026-09-25' }, anses).cumple, false);
  assert.strictEqual(JUB.calcular({ nacimiento: '1960-01-01', sexo: 'hombre', aniosAportes: 30, sueldo: 300000, hoy: '2026-09-25' }, anses).haber, anses.haberMinimo);
  const alto = JUB.calcular({ nacimiento: '1960-01-01', sexo: 'hombre', aniosAportes: 40, sueldo: 9e6, hoy: '2026-09-25' }, anses);
  const tope = JUB.calcular({ nacimiento: '1960-01-01', sexo: 'hombre', aniosAportes: 40, sueldo: anses.baseImponibleMaxima, hoy: '2026-09-25' }, anses);
  assert.strictEqual(alto.haber, tope.haber);
  near(alto.haber, anses.pbu * 1.10 + anses.baseImponibleMaxima * 0.015 * 35, 0.01); // PBU +10 % por 40 años; PC+PAP hasta 35 años
  assert.ok(alto.haber <= anses.haberMaximo);
});

test('materiales: pintura, cajas de piso con 10 % de desperdicio y metros lineales', () => {
  const p = MAT.pintura({ perimetro: 14, alto: 2.6, aberturas: 3.4, manos: 2, rendimiento: 10 });
  assert.deepStrictEqual(p, { superficie: 33, litros: 6.6, latas: 1 });
  assert.deepStrictEqual(MAT.pisos({ superficie: 20, m2Caja: 1.44 }), { m2Necesarios: 22, cajas: 16, m2Comprados: 23.04 });
  assert.strictEqual(MAT.lineales({ metrosLineales: 10, ancho: 1.5 }).m2, 15);
  assert.strictEqual(MAT.lineales({ m2: 15, ancho: 1.5 }).metrosLineales, 10);
});

test('libertad financiera: USD 1.000/mes con regla del 4 % → objetivo 300.000; tiempo y aporte necesario coherentes', () => {
  const r = LIB.calcular({ gastoMensual: 1000, ahorroActual: 10000, aporteMensual: 1000, rendimiento: 5, tasaRetiro: 4, anios: 20 });
  assert.strictEqual(r.objetivo, 300000);
  assert.ok(r.alcanzable && r.anios > 15 && r.anios < 18, `años: ${r.anios}`);
  assert.ok(r.intereses > 0 && r.serie.length > 10);
  // Con el aporte necesario se llega justo en 20 años
  const chk = LIB.calcular({ gastoMensual: 1000, ahorroActual: 10000, aporteMensual: r.aporteNecesario, rendimiento: 5, tasaRetiro: 4 });
  near(chk.anios, 20, 0.1);
  assert.throws(() => LIB.calcular({ gastoMensual: 0, tasaRetiro: 4 }));
});
