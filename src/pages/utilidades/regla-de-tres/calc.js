/* Regla de tres simple directa e inversa. Funciona en el navegador (window.CTReglaTres) y en Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTReglaTres = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r(n) { return Math.round(n * 1e6) / 1e6; }
  function check(a, b, c) {
    [a, b, c].forEach(function (v) { if (typeof v !== 'number' || !isFinite(v)) throw new Error('Completá los tres valores.'); });
  }
  // a → b ; c → x
  function directa(a, b, c) { check(a, b, c); if (!a) throw new Error('El primer valor no puede ser cero.'); return r(b * c / a); }
  function inversa(a, b, c) { check(a, b, c); if (!c) throw new Error('El tercer valor no puede ser cero.'); return r(a * b / c); }
  return { directa: directa, inversa: inversa };
});
