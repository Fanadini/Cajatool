/* Categoría y cuota del Monotributo a partir de data/monotributo.json.
   Funciona en el navegador (window.CTMonotributo) y en Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CTMonotributo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function r2(n) { return Math.round(n * 100) / 100; }

  var PARAMETROS = [
    ['ingresos', 'ingresosMax', 'ingresos brutos anuales'],
    ['superficie', 'superficieMax', 'superficie afectada'],
    ['energia', 'energiaMax', 'energía eléctrica consumida'],
    ['alquileres', 'alquileresMax', 'alquileres devengados']
  ];

  /**
   * @param {object} p { ingresos, actividad ('servicios'|'bienes'), superficie?, energia?, alquileres?,
   *                     precioUnitario?, relacionDependencia?, jubilado?, adherentes? }
   * @param {object} data contenido de data/monotributo.json
   */
  function calcular(p, data) {
    if (!(p.ingresos >= 0)) throw new Error('Ingresá tu facturación de los últimos 12 meses.');
    if (p.actividad !== 'servicios' && p.actividad !== 'bienes') throw new Error('Elegí el tipo de actividad.');

    if (p.actividad === 'bienes' && p.precioUnitario > data.precioUnitarioMax) {
      return { excluido: 'El precio unitario de venta supera el máximo permitido para el monotributo. Tenés que pasar al régimen general (responsable inscripto).' };
    }

    var cats = data.categorias;
    var idx = -1, limitante = 'ingresos';
    for (var i = 0; i < cats.length; i++) {
      var entra = PARAMETROS.every(function (par) { return !(p[par[0]] > cats[i][par[1]]); });
      if (entra) { idx = i; break; }
    }
    if (idx === -1) {
      var supera = PARAMETROS.filter(function (par) { return p[par[0]] > cats[cats.length - 1][par[1]]; })[0];
      return { excluido: 'Superás el máximo de ' + supera[2] + ' de la categoría K. Tenés que pasar al régimen general (responsable inscripto).' };
    }
    // Qué parámetro definió la categoría (el que no entra en la categoría anterior)
    if (idx > 0) {
      var prev = cats[idx - 1];
      var par = PARAMETROS.filter(function (x) { return p[x[0]] > prev[x[1]]; })[0];
      limitante = par ? par[2] : 'ingresos brutos anuales';
    } else limitante = null;

    var c = cats[idx];
    var adherentes = Math.max(0, Math.floor(p.adherentes || 0));
    var impuesto = c.impuesto[p.actividad];
    var sipa = p.relacionDependencia ? 0 : c.sipa;
    var obraSocial = p.relacionDependencia || p.jubilado ? 0 : c.obraSocial * (1 + adherentes);
    var total = r2(impuesto + sipa + obraSocial);
    return {
      excluido: null,
      categoria: c.categoria,
      limitante: limitante,
      cuota: { impuesto: impuesto, sipa: sipa, obraSocial: r2(obraSocial), total: total },
      anual: r2(total * 12),
      topeCategoria: c.ingresosMax,
      margen: r2(c.ingresosMax - p.ingresos),
      promedioMensualMax: r2(c.ingresosMax / 12)
    };
  }

  return { calcular: calcular };
});
