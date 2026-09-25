(function () {
  'use strict';
  var F = window.CTFormat;
  var I = window.CTIndemnizacion;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-indem');
  var calculado = false;

  function motivo() { return form.querySelector('input[name="motivo"]:checked').value; }
  function fecha(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function plural(n, s, p) { return n + ' ' + (n === 1 ? s : p); }

  function toggles() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-despido]'), function (el) { el.hidden = motivo() !== 'despido'; });
  }

  function calcular(scroll) {
    $('form-error').textContent = '';
    var p = {
      ingreso: $('ingreso').value,
      egreso: $('egreso').value,
      sueldo: F.parseAR($('sueldo').value),
      motivo: motivo(),
      preavisoOtorgado: $('preaviso').value === 'si',
      topeConvenio: F.parseAR($('tope').value)
    };
    var r;
    try { r = I.calcular(p); } catch (e) { $('form-error').textContent = e.message; return; }

    $('res-label').textContent = 'Total de la liquidación final por ' + (p.motivo === 'despido' ? 'despido sin causa' : 'renuncia') + ' (bruto)';
    $('res-total').textContent = F.fmtMoney(r.total);
    var a = r.antiguedad;
    $('res-antiguedad').textContent = 'Antigüedad: ' + plural(a.anios, 'año', 'años') + ', ' + plural(a.meses, 'mes', 'meses') + ' y ' + plural(a.dias, 'día', 'días') +
      (r.base !== null ? '. Base de la indemnización: ' + F.fmtMoney(r.base) + (r.topeAplicado ? ' (con tope del convenio)' : '') + '.' : '.');

    var tbody = $('res-tabla');
    tbody.textContent = '';
    r.conceptos.forEach(function (c) {
      var tr = document.createElement('tr');
      var th = document.createElement('th');
      th.scope = 'row';
      th.textContent = c.nombre;
      var small = document.createElement('small');
      small.className = 'detalle';
      small.textContent = c.detalle;
      th.appendChild(small);
      var td = document.createElement('td');
      td.textContent = F.fmtMoney(c.monto);
      tr.appendChild(th); tr.appendChild(td);
      tbody.appendChild(tr);
    });

    var notas = [];
    if (r.enPrueba && p.motivo === 'despido') notas.push('Con menos de 6 meses estás en período de prueba: no corresponde indemnización, preaviso ni integración.');
    notas.push('Los días trabajados, el aguinaldo y las vacaciones tienen descuentos (17 % de aportes); las indemnizaciones no.');
    $('res-nota').textContent = notas.join(' ');

    $('res-resumen').textContent = 'Liquidación final por ' + (p.motivo === 'despido' ? 'despido sin causa' : 'renuncia') + ': ' + F.fmtMoney(r.total) +
      ' brutos (ingreso ' + fecha(p.ingreso) + ', egreso ' + fecha(p.egreso) + ', sueldo ' + F.fmtMoney(p.sueldo) + '). ' +
      r.conceptos.map(function (c) { return c.nombre + ': ' + F.fmtMoney(c.monto); }).join('; ') + '.';
    $('resultado').hidden = false;
    calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { toggles(); if (calculado) calcular(false); });
  toggles();
})();
