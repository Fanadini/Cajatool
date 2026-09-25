/* Valor del m² de una vivienda y comparación con el promedio oficial por barrio (CABA).
   Funciona en el navegador (window.CTM2) y en Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CTM2 = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function r2(n) { return Math.round(n * 100) / 100; }

  // Superficie homogeneizada: la semicubierta y la descubierta se computan a un porcentaje de la cubierta
  function superficie(p) {
    var semi = (p.semicubierta || 0) * (p.pctSemi === undefined ? 50 : p.pctSemi) / 100;
    var desc = (p.descubierta || 0) * (p.pctDesc === undefined ? 30 : p.pctDesc) / 100;
    return r2((p.cubierta || 0) + semi + desc);
  }

  function referencia(data, serie, barrio) {
    var s = data.series[serie];
    if (!s) throw new Error('Tipo de departamento no válido.');
    var b = s.barrios[barrio];
    var usado = b ? barrio : 'Total';
    var ref = b || s.barrios.Total;
    return {
      barrio: usado,
      sinDato: !b && barrio !== 'Total',
      usd: ref.usd,
      variacionAnual: ref.anioAnterior ? r2((ref.usd / ref.anioAnterior - 1) * 100) : null,
      periodo: s.periodo,
      provisorio: s.provisorio
    };
  }

  /**
   * @param {object} p { precio? (USD), cubierta, semicubierta?, descubierta?, pctSemi?, pctDesc?, barrio?, serie? ('2-usado'…) }
   * @param {object} data contenido de data/m2-caba.json (opcional: sin datos solo calcula el m²)
   */
  function calcular(p, data) {
    if (!(p.cubierta > 0)) throw new Error('Ingresá la superficie cubierta en m².');
    var sup = superficie(p);
    var res = { superficie: sup, usdM2: null, referencia: null, valorEstimado: null, diferenciaPct: null };
    if (p.precio > 0) res.usdM2 = r2(p.precio / sup);
    if (data && p.serie) {
      var ref = referencia(data, p.serie, p.barrio || 'Total');
      res.referencia = ref;
      res.valorEstimado = Math.round(ref.usd * sup);
      if (res.usdM2) res.diferenciaPct = r2((res.usdM2 / ref.usd - 1) * 100);
    }
    if (!res.usdM2 && !res.referencia) throw new Error('Ingresá el precio o elegí un barrio para estimar el valor.');
    return res;
  }

  return { calcular: calcular, superficie: superficie, referencia: referencia };
});
