/* Cálculo del aguinaldo (SAC) según Ley 23.041 y LCT arts. 121-123.
   Funciona en el navegador (window.CTAguinaldo) y en Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CTAguinaldo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var DAY = 86400000;
  var APORTES = 0.17; // 11 % jubilación + 3 % PAMI + 3 % obra social

  function d(iso) { var p = iso.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }
  function diasEntre(a, b) { return Math.round((b - a) / DAY) + 1; } // inclusivo

  function semestre(anio, n) {
    return n === 1
      ? { desde: Date.UTC(anio, 0, 1), hasta: Date.UTC(anio, 5, 30), pago: anio + '-06-30' }
      : { desde: Date.UTC(anio, 6, 1), hasta: Date.UTC(anio, 11, 31), pago: anio + '-12-18' };
  }

  /**
   * @param {object} p { anio, semestre (1|2), sueldos: number[] | mejorSueldo: number, ingreso?, egreso? (YYYY-MM-DD) }
   */
  function calcular(p) {
    if (p.semestre !== 1 && p.semestre !== 2) throw new Error('Elegí la primera o la segunda cuota.');
    var sueldos = (p.sueldos || []).filter(function (s) { return s > 0; });
    var mejor = sueldos.length ? Math.max.apply(null, sueldos) : p.mejorSueldo;
    if (!(mejor > 0)) throw new Error('Ingresá el mejor sueldo bruto del semestre.');
    var s = semestre(p.anio, p.semestre);
    var desde = p.ingreso ? Math.max(d(p.ingreso), s.desde) : s.desde;
    var hasta = p.egreso ? Math.min(d(p.egreso), s.hasta) : s.hasta;
    if (hasta < desde) throw new Error('Las fechas no coinciden con el semestre elegido.');
    var diasSemestre = diasEntre(s.desde, s.hasta);
    var diasTrabajados = diasEntre(desde, hasta);
    var bruto = (mejor / 2) * (diasTrabajados / diasSemestre);
    bruto = Math.round(bruto * 100) / 100;
    var descuentos = Math.round(bruto * APORTES * 100) / 100;
    return {
      mejorSueldo: mejor,
      diasSemestre: diasSemestre,
      diasTrabajados: diasTrabajados,
      completo: diasTrabajados === diasSemestre,
      bruto: bruto,
      descuentos: descuentos,
      neto: Math.round((bruto - descuentos) * 100) / 100,
      fechaPago: s.pago
    };
  }

  return { calcular: calcular, APORTES: APORTES };
});
