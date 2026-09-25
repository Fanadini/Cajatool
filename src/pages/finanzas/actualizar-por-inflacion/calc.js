/* Actualización de montos por inflación (IPC del INDEC).
   Funciona en el navegador (window.CTInflacion) y en Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTInflacion = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r2(n) { return Math.round(n * 100) / 100; }
  /** @param {object} p { monto, desde ('YYYY-MM'), hasta ('YYYY-MM') } · @param {object} niveles IPC nivel general por mes */
  function actualizar(p, niveles) {
    if (!(p.monto > 0)) throw new Error('Ingresá un monto mayor a cero.');
    if (!(p.desde in niveles)) throw new Error('No hay dato de IPC para el mes de origen.');
    if (!(p.hasta in niveles)) throw new Error('No hay dato de IPC para el mes de destino.');
    var f = niveles[p.hasta] / niveles[p.desde];
    var meses = (+p.hasta.slice(0, 4) - +p.desde.slice(0, 4)) * 12 + (+p.hasta.slice(5) - +p.desde.slice(5));
    return {
      factor: f,
      montoActualizado: r2(p.monto * f),
      inflacionAcumulada: r2((f - 1) * 100),
      meses: meses,
      promedioMensual: meses ? r2((Math.pow(f, 1 / Math.abs(meses)) - 1) * 100 * (meses < 0 ? -1 : 1)) : 0
    };
  }
  return { actualizar: actualizar };
});
