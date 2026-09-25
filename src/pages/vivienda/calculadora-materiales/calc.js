/* Calculadora de materiales: pintura, pisos y cerámicos, y metros lineales a m².
   Funciona en el navegador (window.CTMateriales) y en Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTMateriales = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r2(n) { return Math.round(n * 100) / 100; }
  function pintura(p) {
    var perimetro = p.perimetro, alto = p.alto;
    if (!(perimetro > 0 && alto > 0)) throw new Error('Ingresá el perímetro y la altura de las paredes.');
    var superficie = perimetro * alto + (p.techo ? (p.superficieTecho || 0) : 0) - (p.aberturas || 0);
    if (superficie <= 0) throw new Error('La superficie a pintar debe ser mayor a cero.');
    var litros = superficie * (p.manos || 2) / (p.rendimiento || 10);
    return { superficie: r2(superficie), litros: r2(litros), latas: Math.ceil(litros / (p.lata || 20)) };
  }
  function pisos(p) {
    if (!(p.superficie > 0)) throw new Error('Ingresá la superficie a cubrir.');
    if (!(p.m2Caja > 0)) throw new Error('Ingresá los m² que trae cada caja.');
    var total = p.superficie * (1 + (p.desperdicio === undefined ? 10 : p.desperdicio) / 100);
    var cajas = Math.ceil(total / p.m2Caja);
    return { m2Necesarios: r2(total), cajas: cajas, m2Comprados: r2(cajas * p.m2Caja) };
  }
  function lineales(p) {
    if (!(p.ancho > 0)) throw new Error('Ingresá el ancho del material en metros.');
    if (p.metrosLineales > 0) return { m2: r2(p.metrosLineales * p.ancho), metrosLineales: p.metrosLineales };
    if (p.m2 > 0) return { metrosLineales: r2(p.m2 / p.ancho), m2: p.m2 };
    throw new Error('Ingresá los metros lineales o los m².');
  }
  return { pintura: pintura, pisos: pisos, lineales: lineales };
});
