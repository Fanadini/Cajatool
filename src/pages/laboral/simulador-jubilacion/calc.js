/* Simulador de jubilación (Ley 24.241): edad, años de aportes y haber estimado.
   Funciona en el navegador (window.CTJubilacion) y en Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CTJubilacion = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function r2(n) { return Math.round(n * 100) / 100; }
  function edadEn(nac, fecha) {
    var a = nac.split('-').map(Number), b = fecha.split('-').map(Number);
    var e = b[0] - a[0];
    if (b[1] < a[1] || (b[1] === a[1] && b[2] < a[2])) e--;
    return e;
  }
  /**
   * @param {object} p { nacimiento, sexo ('hombre'|'mujer'), aniosAportes (a hoy), sigueAportando (bool), sueldo (promedio mensual), hoy }
   * @param {object} d contenido de data/anses.json
   */
  function calcular(p, d) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.nacimiento || '')) throw new Error('Ingresá tu fecha de nacimiento.');
    if (!(p.aniosAportes >= 0 && p.aniosAportes <= 60)) throw new Error('Ingresá los años de aportes.');
    var req = d.requisitos;
    var edadJub = p.sexo === 'mujer' ? req.edadMujer : req.edadHombre;
    var hoy = p.hoy;
    var edadHoy = edadEn(p.nacimiento, hoy);
    var n = p.nacimiento.split('-');
    var fechaEdad = (+n[0] + edadJub) + '-' + n[1] + '-' + n[2];
    var faltan = Math.max(0, edadJub - edadHoy);
    var aportesAlJubilarse = p.aniosAportes + (p.sigueAportando ? faltan : 0);
    var cumple = aportesAlJubilarse >= req.aniosAportes;
    var res = { edadJubilatoria: edadJub, edadHoy: edadHoy, fechaEdad: fechaEdad, aniosFaltantes: faltan, aportesAlJubilarse: aportesAlJubilarse,
      cumple: cumple, aportesFaltantes: Math.max(0, req.aniosAportes - aportesAlJubilarse), haber: null, puam: d.puam };
    if (cumple) {
      var prom = Math.min(p.sueldo || 0, d.baseImponibleMaxima);
      // PBU: se incrementa 1 % por año que supere los 30, hasta 45 (art. 20)
      var pbu = d.pbu * (1 + Math.min(Math.max(aportesAlJubilarse - 30, 0), 15) / 100);
      // PC + PAP: 1,5 % por año de aportes (hasta 35) sobre el promedio de remuneraciones
      var pcPap = prom * 0.015 * Math.min(aportesAlJubilarse, 35);
      var bruto = pbu + pcPap;
      res.pbu = r2(pbu); res.pcPap = r2(pcPap);
      res.haber = r2(Math.min(Math.max(bruto, d.haberMinimo), d.haberMaximo));
      res.ajuste = bruto < d.haberMinimo ? 'minimo' : (bruto > d.haberMaximo ? 'maximo' : null);
      res.tasaReemplazo = prom ? r2(res.haber / prom * 100) : null;
    }
    return res;
  }
  return { calcular: calcular, edadEn: edadEn };
});
