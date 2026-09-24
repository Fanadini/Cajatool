(function () {
  'use strict';
  var F = window.CTFormat;
  var S = window.CTAguinaldo;
  var $ = function (id) { return document.getElementById(id); };
  var MESES = [['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio'], ['julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']];
  var hoy = new Date();
  var calculado = false;

  // Años y cuota por defecto según la fecha actual
  var anioActual = hoy.getFullYear();
  [anioActual - 1, anioActual, anioActual + 1].forEach(function (a) {
    var o = document.createElement('option');
    o.value = a; o.textContent = a;
    if (a === anioActual) o.selected = true;
    $('anio').appendChild(o);
  });
  document.querySelector('input[name="semestre"][value="' + (hoy.getMonth() < 6 ? 1 : 2) + '"]').checked = true;

  function semestre() { return parseInt(document.querySelector('input[name="semestre"]:checked').value, 10); }

  function dibujarSueldos() {
    var grid = $('sueldos-grid');
    var previos = Array.prototype.map.call(grid.querySelectorAll('input'), function (i) { return i.value; });
    grid.textContent = '';
    MESES[semestre() - 1].forEach(function (m, i) {
      var div = document.createElement('div');
      div.className = 'field';
      div.innerHTML = '<label for="mes-' + i + '">Sueldo de ' + m + '</label><input type="text" id="mes-' + i + '" class="money" inputmode="decimal" autocomplete="off">';
      grid.appendChild(div);
      if (previos[i]) div.querySelector('input').value = previos[i];
    });
  }

  function toggles() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-parcial]'), function (el) { el.hidden = !$('parcial').checked; });
    $('sueldos-mes').hidden = !$('detalle-sueldos').checked;
    $('campo-sueldo').hidden = $('detalle-sueldos').checked;
  }

  function fecha(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

  function calcular(scroll) {
    $('sueldo-error').textContent = '';
    $('form-error').textContent = '';
    var p = { anio: parseInt($('anio').value, 10), semestre: semestre() };
    if ($('detalle-sueldos').checked) {
      p.sueldos = Array.prototype.map.call($('sueldos-grid').querySelectorAll('input'), function (i) { return F.parseAR(i.value); });
    } else {
      p.mejorSueldo = F.parseAR($('sueldo').value);
      if (!(p.mejorSueldo > 0)) { $('sueldo-error').textContent = 'Ingresá un sueldo mayor a cero.'; return; }
    }
    if ($('parcial').checked) {
      if ($('ingreso').value) p.ingreso = $('ingreso').value;
      if ($('egreso').value) p.egreso = $('egreso').value;
    }
    var r;
    try { r = S.calcular(p); } catch (e) { $('form-error').textContent = e.message; return; }

    var cuota = p.semestre === 1 ? '1.ª cuota' : '2.ª cuota';
    $('res-label').textContent = 'Aguinaldo bruto · ' + cuota + ' ' + p.anio + (r.completo ? '' : ' (proporcional)');
    $('res-bruto').textContent = F.fmtMoney(r.bruto);
    $('res-neto').textContent = F.fmtMoney(r.neto);
    $('res-dias').textContent = r.diasTrabajados + ' de ' + r.diasSemestre;
    $('res-pago').textContent = fecha(r.fechaPago);
    $('res-formula').textContent = 'Cálculo: ' + F.fmtMoney(r.mejorSueldo) + ' ÷ 2' +
      (r.completo ? '' : ' × ' + r.diasTrabajados + ' ÷ ' + r.diasSemestre) + ' = ' + F.fmtMoney(r.bruto) +
      '. Descuentos estimados: ' + F.fmtMoney(r.descuentos) + '.';
    $('res-resumen').textContent = 'Aguinaldo ' + cuota + ' ' + p.anio + ': ' + F.fmtMoney(r.bruto) + ' brutos (neto aprox. ' +
      F.fmtMoney(r.neto) + '), sobre un mejor sueldo de ' + F.fmtMoney(r.mejorSueldo) + ' y ' + r.diasTrabajados + ' días.';
    $('resultado').hidden = false;
    calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('form-sac').addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  $('form-sac').addEventListener('change', function (e) {
    if (e.target.name === 'semestre') dibujarSueldos();
    toggles();
    if (calculado) calcular(false);
  });
  dibujarSueldos();
  toggles();
})();
