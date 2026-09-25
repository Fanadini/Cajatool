/* Liquidación final por despido sin causa o renuncia, según la LCT con los cambios de la Ley 27.802 (2026).
   Funciona en el navegador (window.CTIndemnizacion) y en Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CTIndemnizacion = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var DAY = 86400000;
  var PERIODO_PRUEBA_MESES = 6; // art. 92 bis (los convenios pueden ampliarlo)

  function r2(n) { return Math.round(n * 100) / 100; }
  function parts(iso) { return iso.split('-').map(Number); }
  function utc(iso) { var p = parts(iso); return Date.UTC(p[0], p[1] - 1, p[2]); }
  function diasDelMes(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); } // m: 1-12

  // Antigüedad en años, meses y días completos entre dos fechas (el día de egreso cuenta como trabajado)
  function antiguedad(ingreso, egreso) {
    var a = parts(ingreso), b = parts(egreso);
    var fin = new Date(Date.UTC(b[0], b[1] - 1, b[2] + 1)); // día siguiente al egreso
    var y = fin.getUTCFullYear() - a[0], m = fin.getUTCMonth() + 1 - a[1], d = fin.getUTCDate() - a[2];
    if (d < 0) { m--; d += diasDelMes(fin.getUTCFullYear(), fin.getUTCMonth()); }
    if (m < 0) { y--; m += 12; }
    return { anios: y, meses: m, dias: d, totalMeses: y * 12 + m };
  }

  // Art. 245: un sueldo por año de servicio o fracción mayor de 3 meses
  function aniosIndemnizables(ant) {
    var extra = ant.meses > 3 || (ant.meses === 3 && ant.dias > 0) ? 1 : 0;
    return ant.anios + extra;
  }

  function diasVacacionesPorAntiguedad(anios) {
    if (anios < 5) return 14;
    if (anios < 10) return 21;
    if (anios < 20) return 28;
    return 35;
  }

  /**
   * @param {object} p { ingreso, egreso (YYYY-MM-DD), sueldo (mejor remuneración mensual normal y habitual, sin SAC),
   *                     motivo ('despido'|'renuncia'), preavisoOtorgado (bool), topeConvenio? (monto) }
   */
  function calcular(p) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.ingreso || '') || !/^\d{4}-\d{2}-\d{2}$/.test(p.egreso || '')) throw new Error('Ingresá las fechas de ingreso y egreso.');
    if (utc(p.egreso) < utc(p.ingreso)) throw new Error('La fecha de egreso no puede ser anterior a la de ingreso.');
    if (!(p.sueldo > 0)) throw new Error('Ingresá el mejor sueldo bruto mensual.');
    var despido = p.motivo !== 'renuncia';
    var ant = antiguedad(p.ingreso, p.egreso);
    var enPrueba = ant.totalMeses < PERIODO_PRUEBA_MESES;
    var e = parts(p.egreso);
    var dm = diasDelMes(e[0], e[1]);
    var conceptos = [];
    function add(id, nombre, monto, detalle) { if (monto > 0) conceptos.push({ id: id, nombre: nombre, monto: r2(monto), detalle: detalle }); }

    // 1. Días trabajados del mes de egreso
    add('dias-mes', 'Días trabajados del mes', p.sueldo / dm * e[2], e[2] + ' de ' + dm + ' días');

    // 2. Aguinaldo proporcional (art. 123): mejor sueldo ÷ 2 × días trabajados en el semestre ÷ días del semestre
    var semDesde = e[1] <= 6 ? Date.UTC(e[0], 0, 1) : Date.UTC(e[0], 6, 1);
    var semHasta = e[1] <= 6 ? Date.UTC(e[0], 5, 30) : Date.UTC(e[0], 11, 31);
    var desdeSac = Math.max(semDesde, utc(p.ingreso));
    var diasSem = Math.round((semHasta - semDesde) / DAY) + 1;
    var diasSac = Math.round((utc(p.egreso) - desdeSac) / DAY) + 1;
    add('sac', 'Aguinaldo proporcional', p.sueldo / 2 * diasSac / diasSem, diasSac + ' de ' + diasSem + ' días del semestre');

    // 3. Vacaciones no gozadas proporcionales (art. 156) + su aguinaldo
    var anioDesde = Math.max(Date.UTC(e[0], 0, 1), utc(p.ingreso));
    var diasAnio = Math.round((utc(p.egreso) - anioDesde) / DAY) + 1;
    var diasVacAnio = diasVacacionesPorAntiguedad(ant.anios);
    var diasVac = diasVacAnio * diasAnio / 365;
    var vac = p.sueldo / 25 * diasVac;
    add('vacaciones', 'Vacaciones no gozadas', vac, (Math.round(diasVac * 100) / 100).toString().replace('.', ',') + ' días (' + diasVacAnio + ' × ' + diasAnio + ' ÷ 365) a sueldo ÷ 25');
    add('sac-vacaciones', 'Aguinaldo sobre vacaciones', vac / 12, 'vacaciones ÷ 12');

    var base = null, anios = 0, topeAplicado = false;
    if (despido && !enPrueba) {
      // 4. Indemnización por antigüedad (art. 245)
      base = p.sueldo;
      if (p.topeConvenio > 0 && p.sueldo > p.topeConvenio) {
        base = Math.max(p.topeConvenio, p.sueldo * 0.67); // el tope no puede reducir la base a menos del 67 %
        topeAplicado = true;
      }
      anios = Math.max(1, aniosIndemnizables(ant)); // nunca menos de un mes de sueldo
      add('antiguedad', 'Indemnización por antigüedad', base * anios, anios + (anios === 1 ? ' sueldo' : ' sueldos') + ' × base' + (topeAplicado ? ' con tope' : ''));

      // 5. Preaviso omitido (arts. 231 y 232) + aguinaldo
      if (!p.preavisoOtorgado) {
        var mesesPreaviso = ant.anios >= 5 ? 2 : 1;
        var preaviso = p.sueldo * mesesPreaviso;
        add('preaviso', 'Indemnización sustitutiva de preaviso', preaviso, mesesPreaviso + (mesesPreaviso === 1 ? ' mes' : ' meses') + ' de sueldo');
        add('sac-preaviso', 'Aguinaldo sobre preaviso', preaviso / 12, 'preaviso ÷ 12');

        // 6. Integración del mes de despido (art. 233) + aguinaldo
        var faltan = dm - e[2];
        var integracion = p.sueldo / dm * faltan;
        add('integracion', 'Integración del mes de despido', integracion, faltan + ' días hasta fin de mes');
        add('sac-integracion', 'Aguinaldo sobre integración', integracion / 12, 'integración ÷ 12');
      }
    }

    var total = conceptos.reduce(function (s, c) { return s + c.monto; }, 0);
    return {
      antiguedad: ant,
      enPrueba: enPrueba,
      aniosIndemnizables: anios,
      base: base === null ? null : r2(base),
      topeAplicado: topeAplicado,
      conceptos: conceptos,
      total: r2(total)
    };
  }

  return { calcular: calcular, antiguedad: antiguedad, aniosIndemnizables: aniosIndemnizables };
});
