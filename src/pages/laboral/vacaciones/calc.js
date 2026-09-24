/* Cálculo de vacaciones según la Ley de Contrato de Trabajo (arts. 150, 151, 153 y 155).
   Funciona en el navegador (window.CTVacaciones) y en Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CTVacaciones = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var DAY = 86400000;
  function d(iso) { var p = iso.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }

  // Antigüedad en años cumplidos al 31 de diciembre del año de las vacaciones (art. 150)
  function antiguedadAl31(ingreso, anio) {
    var p = ingreso.split('-').map(Number);
    var anios = anio - p[0];
    return Math.max(0, anios);
  }

  function diasPorAntiguedad(anios) {
    if (anios < 5) return 14;
    if (anios < 10) return 21;
    if (anios < 20) return 28;
    return 35;
  }

  // Días hábiles (lunes a viernes) entre dos fechas, inclusive. No descuenta feriados.
  function diasHabiles(desde, hasta) {
    var n = 0;
    for (var t = desde; t <= hasta; t += DAY) {
      var w = new Date(t).getUTCDay();
      if (w !== 0 && w !== 6) n++;
    }
    return n;
  }

  /**
   * @param {object} p { ingreso (YYYY-MM-DD), anio, sueldo (bruto mensual), diasTrabajados? (días hábiles efectivos en el año) }
   */
  function calcular(p) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.ingreso || '')) throw new Error('Ingresá la fecha de ingreso.');
    var inicioAnio = Date.UTC(p.anio, 0, 1);
    var finAnio = Date.UTC(p.anio, 11, 31);
    if (d(p.ingreso) > finAnio) throw new Error('La fecha de ingreso es posterior al año elegido.');
    if (!(p.sueldo > 0)) throw new Error('Ingresá el sueldo bruto mensual.');

    var anios = antiguedadAl31(p.ingreso, p.anio);
    var habilesAnio = diasHabiles(inicioAnio, finAnio);
    var trabajados = p.diasTrabajados > 0
      ? p.diasTrabajados
      : diasHabiles(Math.max(d(p.ingreso), inicioAnio), finAnio);

    var dias, proporcional = false;
    if (trabajados < habilesAnio / 2) {
      // Art. 153: un día de descanso por cada 20 días de trabajo efectivo
      dias = Math.floor(trabajados / 20);
      proporcional = true;
    } else {
      dias = diasPorAntiguedad(anios);
    }

    var valorDia = p.sueldo / 25; // art. 155: sueldo mensual dividido 25
    var pago = Math.round(valorDia * dias * 100) / 100;
    var descuentoSueldo = Math.round((p.sueldo / 30) * dias * 100) / 100; // lo que se deja de cobrar como sueldo esos días
    return {
      antiguedad: anios,
      dias: dias,
      proporcional: proporcional,
      diasTrabajados: trabajados,
      habilesAnio: habilesAnio,
      valorDia: Math.round(valorDia * 100) / 100,
      pago: pago,
      plus: Math.round((pago - descuentoSueldo) * 100) / 100
    };
  }

  return { calcular: calcular, diasPorAntiguedad: diasPorAntiguedad, diasHabiles: diasHabiles };
});
