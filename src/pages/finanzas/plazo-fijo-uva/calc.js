/* Plazo fijo UVA vs. plazo fijo tradicional.
   Funciona en el navegador (window.CTUva) y en Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTUva = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r2(n) { return Math.round(n * 100) / 100; }
  /** @param {object} p { capital, dias (≥ 90), tna (%), inflacionMensual (%), tasaUva (% anual adicional) } */
  function comparar(p) {
    if (!(p.capital > 0)) throw new Error('Ingresá el monto a invertir.');
    if (!(p.dias >= 90)) throw new Error('El plazo mínimo del plazo fijo UVA es de 90 días.');
    var tr = p.capital * (1 + p.tna / 100 * p.dias / 365);
    var infl = Math.pow(1 + p.inflacionMensual / 100, p.dias / 30) - 1;
    var uva = p.capital * (1 + infl) * (1 + (p.tasaUva || 0) / 100 * p.dias / 365);
    // Inflación mensual a partir de la cual conviene el UVA
    var equilibrio = (Math.pow((1 + p.tna / 100 * p.dias / 365) / (1 + (p.tasaUva || 0) / 100 * p.dias / 365), 30 / p.dias) - 1) * 100;
    return {
      tradicional: r2(tr), uva: r2(uva),
      interesTradicional: r2(tr - p.capital), interesUva: r2(uva - p.capital),
      inflacionPeriodo: r2(infl * 100),
      conviene: Math.abs(uva - tr) < p.capital * 0.001 ? 'igual' : (uva > tr ? 'uva' : 'tradicional'),
      inflacionEquilibrio: r2(equilibrio)
    };
  }
  return { comparar: comparar };
});
