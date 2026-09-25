/* Horas extra según el art. 201 de la LCT: recargo del 50 % en días comunes y del 100 % sábados después de las 13, domingos y feriados. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTHorasExtra = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r2(n) { return Math.round(n * 100) / 100; }

  // Horas mensuales de referencia para una jornada semanal: semanas del año ÷ 12
  function horasMensuales(horasSemanales) { return r2(horasSemanales * 52 / 12); }

  /** @param {object} p { sueldo, horasSemanales, divisor? (horas mensuales), horas50, horas100 } */
  function calcular(p) {
    if (!(p.sueldo > 0)) throw new Error('Ingresá tu sueldo bruto mensual.');
    var divisor = p.divisor > 0 ? p.divisor : horasMensuales(p.horasSemanales || 48);
    var h50 = Math.max(0, p.horas50 || 0), h100 = Math.max(0, p.horas100 || 0);
    if (h50 + h100 === 0) throw new Error('Ingresá la cantidad de horas extra.');
    var valorHora = p.sueldo / divisor;
    var pago50 = valorHora * 1.5 * h50;
    var pago100 = valorHora * 2 * h100;
    return {
      divisor: divisor,
      valorHora: r2(valorHora),
      valorHora50: r2(valorHora * 1.5),
      valorHora100: r2(valorHora * 2),
      pago50: r2(pago50),
      pago100: r2(pago100),
      total: r2(pago50 + pago100)
    };
  }

  return { calcular: calcular, horasMensuales: horasMensuales };
});
