/* Precio final en pesos de una compra en dólares con tarjeta: percepción RG 5617 (30 %), IVA de servicios digitales (21 %) e IIBB provincial. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTDolarTarjeta = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r2(n) { return Math.round(n * 100) / 100; }
  var PERCEPCION = 30; // RG ARCA 5617/2024, art. 6°
  var IVA_DIGITAL = 21; // IVA a servicios digitales prestados desde el exterior

  /**
   * @param {object} p { usd, tipoCambio, digital (bool), iibb (% provincial), dolaresPropios (bool: pago con dólares, sin percepción) }
   */
  function calcular(p) {
    if (!(p.usd > 0)) throw new Error('Ingresá el precio en dólares.');
    if (!(p.tipoCambio > 0)) throw new Error('Ingresá el tipo de cambio.');
    var base = p.usd * p.tipoCambio;
    var iva = p.digital ? base * IVA_DIGITAL / 100 : 0;
    var percepcion = p.dolaresPropios ? 0 : base * PERCEPCION / 100;
    var iibb = base * (p.iibb || 0) / 100;
    var total = base + iva + percepcion + iibb;
    return {
      base: r2(base),
      iva: r2(iva),
      percepcion: r2(percepcion),
      iibb: r2(iibb),
      total: r2(total),
      dolarEfectivo: r2(total / p.usd),
      recargoPct: r2((total / base - 1) * 100)
    };
  }

  return { calcular: calcular, PERCEPCION: PERCEPCION, IVA_DIGITAL: IVA_DIGITAL };
});
