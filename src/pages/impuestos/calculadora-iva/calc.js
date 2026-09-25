/* Calculadora de IVA: agregar o quitar el impuesto con las alícuotas vigentes. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTIva = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r2(n) { return Math.round(n * 100) / 100; }
  var ALICUOTAS = [21, 10.5, 27, 5, 2.5];

  /** @param {object} p { monto, alicuota (%), modo ('agregar'|'quitar') } */
  function calcular(p) {
    if (!(p.monto > 0)) throw new Error('Ingresá un monto mayor a cero.');
    if (ALICUOTAS.indexOf(p.alicuota) === -1) throw new Error('Alícuota no válida.');
    var a = p.alicuota / 100;
    var neto, iva, total;
    if (p.modo === 'quitar') {
      total = p.monto; neto = total / (1 + a); iva = total - neto;
    } else {
      neto = p.monto; iva = neto * a; total = neto + iva;
    }
    return { neto: r2(neto), iva: r2(iva), total: r2(total) };
  }

  return { calcular: calcular, ALICUOTAS: ALICUOTAS };
});
