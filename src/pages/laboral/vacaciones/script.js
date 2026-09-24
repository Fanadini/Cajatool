(function () {
  'use strict';
  var F = window.CTFormat;
  var V = window.CTVacaciones;
  var $ = function (id) { return document.getElementById(id); };
  var calculado = false;

  // Por defecto: vacaciones del año en curso (se toman desde octubre)
  var anio = new Date().getFullYear();
  [anio - 1, anio, anio + 1].forEach(function (a) {
    var o = document.createElement('option');
    o.value = a; o.textContent = a;
    if (a === anio) o.selected = true;
    $('anio').appendChild(o);
  });

  function calcular(scroll) {
    ['ingreso', 'sueldo', 'form'].forEach(function (k) { $(k + '-error').textContent = ''; });
    var p = {
      ingreso: $('ingreso').value,
      anio: parseInt($('anio').value, 10),
      sueldo: F.parseAR($('sueldo').value),
      diasTrabajados: parseInt($('dias-trabajados').value, 10) || 0
    };
    var ok = true;
    if (!p.ingreso) { $('ingreso-error').textContent = 'Ingresá tu fecha de ingreso.'; ok = false; }
    if (!(p.sueldo > 0)) { $('sueldo-error').textContent = 'Ingresá un sueldo mayor a cero.'; ok = false; }
    if (!ok) return;
    var r;
    try { r = V.calcular(p); } catch (e) { $('form-error').textContent = e.message; return; }

    $('res-dias').textContent = r.dias + ' días corridos' + (r.proporcional ? ' (proporcional)' : '');
    $('res-pago').textContent = F.fmtMoney(r.pago);
    $('res-plus').textContent = F.fmtMoney(r.plus);
    $('res-antiguedad').textContent = r.antiguedad === 1 ? '1 año' : r.antiguedad + ' años';
    $('res-formula').textContent = (r.proporcional
      ? 'Trabajaste ' + r.diasTrabajados + ' días hábiles, menos de la mitad de los ' + r.habilesAnio + ' del año: 1 día cada 20 trabajados. '
      : '') + 'Pago: ' + F.fmtMoney(p.sueldo) + ' ÷ 25 = ' + F.fmtMoney(r.valorDia) + ' por día × ' + r.dias + ' días = ' + F.fmtMoney(r.pago) + '.';
    $('res-resumen').textContent = 'Vacaciones ' + p.anio + ': ' + r.dias + ' días corridos, a cobrar ' + F.fmtMoney(r.pago) +
      ' brutos (plus vacacional ' + F.fmtMoney(r.plus) + '). Antigüedad: ' + r.antiguedad + ' años.';
    $('resultado').hidden = false;
    calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('form-vac').addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  $('form-vac').addEventListener('change', function () { if (calculado) calcular(false); });
})();
