/* Libertad financiera: número objetivo, tiempo para alcanzarlo e interés compuesto.
   Funciona en el navegador (window.CTLibertad) y en Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTLibertad = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r2(n) { return Math.round(n * 100) / 100; }
  /**
   * @param {object} p { gastoMensual, ahorroActual, aporteMensual, rendimiento (% anual real), tasaRetiro (% anual, ej. 4), anios? (objetivo para calcular el aporte necesario) }
   */
  function calcular(p) {
    if (!(p.gastoMensual > 0)) throw new Error('Ingresá tu costo de vida mensual.');
    if (!(p.tasaRetiro > 0)) throw new Error('Ingresá la tasa de retiro.');
    var objetivo = p.gastoMensual * 12 / (p.tasaRetiro / 100);
    var rm = Math.pow(1 + (p.rendimiento || 0) / 100, 1 / 12) - 1;
    var saldo = p.ahorroActual || 0, aportado = saldo, meses = 0, serie = [{ anio: 0, aportado: r2(aportado), intereses: 0, saldo: r2(saldo) }];
    var alcanzable = saldo >= objetivo;
    while (!alcanzable && meses < 1200) {
      saldo = saldo * (1 + rm) + (p.aporteMensual || 0);
      aportado += p.aporteMensual || 0;
      meses++;
      if (meses % 12 === 0) serie.push({ anio: meses / 12, aportado: r2(aportado), intereses: r2(saldo - aportado), saldo: r2(saldo) });
      if (saldo >= objetivo) alcanzable = true;
    }
    if (meses % 12 !== 0 && alcanzable) serie.push({ anio: r2(meses / 12), aportado: r2(aportado), intereses: r2(saldo - aportado), saldo: r2(saldo) });
    var res = { objetivo: r2(objetivo), alcanzable: alcanzable, meses: alcanzable ? meses : null, anios: alcanzable ? r2(meses / 12) : null,
      aportado: r2(aportado), intereses: r2(saldo - aportado), serie: serie, ingresoPasivoHoy: r2((p.ahorroActual || 0) * p.tasaRetiro / 100 / 12) };
    if (p.anios > 0) res.aporteNecesario = aporteParaLlegar(objetivo, p.ahorroActual || 0, rm, p.anios * 12);
    return res;
  }
  // Aporte mensual para llegar al objetivo en n meses (valor futuro de una anualidad)
  function aporteParaLlegar(objetivo, inicial, rm, n) {
    var fvInicial = inicial * Math.pow(1 + rm, n);
    if (fvInicial >= objetivo) return 0;
    var factor = rm === 0 ? n : (Math.pow(1 + rm, n) - 1) / rm;
    return r2((objetivo - fvInicial) / factor);
  }
  return { calcular: calcular, aporteParaLlegar: aporteParaLlegar };
});
