/* Sueldo neto a partir del bruto: aportes (con tope de base imponible) y retención estimada de Ganancias (4.ª categoría).
   Funciona en el navegador (window.CTSueldo) y en Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CTSueldo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function r2(n) { return Math.round(n * 100) / 100; }

  function topeVigente(data, mes) {
    var t = data.topeAportes.filter(function (x) { return x.desde <= mes; });
    return (t.length ? t[t.length - 1] : data.topeAportes[0]);
  }

  function impuestoEscala(neta, escala) {
    if (neta <= 0) return { impuesto: 0, alicuota: 0 };
    for (var i = escala.length - 1; i >= 0; i--) {
      var t = escala[i];
      if (neta > t.desde) return { impuesto: t.fijo + (neta - t.desde) * t.alicuota / 100, alicuota: t.alicuota };
    }
    return { impuesto: 0, alicuota: 0 };
  }

  /**
   * @param {object} p { bruto, mes ('YYYY-MM'), conyuge (bool), hijos (n), hijosIncapacitados (n), otrasDeducciones (anual) }
   * @param {object} data contenido de data/ganancias.json
   */
  function calcular(p, data) {
    if (!(p.bruto > 0)) throw new Error('Ingresá tu sueldo bruto mensual.');
    var tope = topeVigente(data, p.mes || '9999-12');
    var base = Math.min(p.bruto, tope.monto);
    var a = data.aportes;
    var aportes = {
      jubilacion: r2(base * a.jubilacion / 100),
      pami: r2(base * a.pami / 100),
      obraSocial: r2(base * a.obraSocial / 100)
    };
    var totalAportes = r2(aportes.jubilacion + aportes.pami + aportes.obraSocial);

    // Ganancias: estimación anual (12 sueldos + aguinaldo = 13) repartida en partes iguales
    var d = data.deducciones;
    var deducciones = d.gananciaNoImponible + d.especialRelacionDependencia +
      (p.conyuge ? d.conyuge : 0) + (p.hijos || 0) * d.hijo + (p.hijosIncapacitados || 0) * d.hijoIncapacitado + (p.otrasDeducciones || 0);
    var gananciaNeta = p.bruto * 13 - totalAportes * 13 - deducciones;
    var imp = impuestoEscala(gananciaNeta, data.escala);
    var retencion = r2(imp.impuesto / 13);
    var neto = r2(p.bruto - totalAportes - retencion);
    return {
      base: r2(base),
      topeAplicado: p.bruto > tope.monto,
      tope: tope,
      aportes: aportes,
      totalAportes: totalAportes,
      gananciaNetaAnual: r2(Math.max(0, gananciaNeta)),
      deduccionesAnuales: r2(deducciones),
      impuestoAnual: r2(imp.impuesto),
      alicuotaMarginal: imp.alicuota,
      retencion: retencion,
      neto: neto,
      descuentoTotalPct: r2((1 - neto / p.bruto) * 100),
      // Sueldo bruto a partir del cual empieza a haber retención (sin otras deducciones)
      umbral: r2(deducciones / 13 / (1 - (a.jubilacion + a.pami + a.obraSocial) / 100))
    };
  }

  return { calcular: calcular, impuestoEscala: impuestoEscala, topeVigente: topeVigente };
});
