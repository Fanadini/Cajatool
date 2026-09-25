/* Calculadora de porcentajes. Funciona en el navegador (window.CTPorcentaje) y en Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTPorcentaje = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r(n) { return Math.round(n * 1e6) / 1e6; }
  function num(v, msg) { if (typeof v !== 'number' || !isFinite(v)) throw new Error(msg); return v; }
  // Cuánto es el p % de x
  function deX(p, x) { return r(num(p, 'Ingresá el porcentaje.') * num(x, 'Ingresá el número.') / 100); }
  // Qué porcentaje es a de b
  function quePorcentaje(a, b) { num(a, 'Ingresá el primer número.'); if (!num(b, 'Ingresá el total.')) throw new Error('El total no puede ser cero.'); return r(a / b * 100); }
  // Variación porcentual de desde a hasta
  function variacion(desde, hasta) { num(hasta, 'Ingresá el valor final.'); if (!num(desde, 'Ingresá el valor inicial.')) throw new Error('El valor inicial no puede ser cero.'); return r((hasta - desde) / Math.abs(desde) * 100); }
  // Aplicar un aumento (p > 0) o descuento (p < 0)
  function aplicar(x, p) { num(x, 'Ingresá el número.'); num(p, 'Ingresá el porcentaje.'); return { resultado: r(x * (1 + p / 100)), diferencia: r(x * p / 100) }; }
  // Valor original antes de un aumento o descuento del p %
  function original(final, p) { num(final, 'Ingresá el valor final.'); num(p, 'Ingresá el porcentaje.'); if (p <= -100) throw new Error('El descuento debe ser menor al 100 %.'); return r(final / (1 + p / 100)); }
  return { deX: deX, quePorcentaje: quePorcentaje, variacion: variacion, aplicar: aplicar, original: original };
});
