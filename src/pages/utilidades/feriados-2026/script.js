(function () {
  'use strict';
  var C = window.CTFeriados;
  var data = JSON.parse(document.getElementById('data-feriados').textContent);
  var lista = [];
  Object.keys(data.anios).sort().forEach(function (y) { lista = lista.concat(data.anios[y]); });
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-fer'), calculado = false;
  function hoy() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function largo(iso) { return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z')); }
  var prox = C.proximos(hoy(), lista, 3);
  if (prox.length) {
    $('prox-main').textContent = largo(prox[0].fecha) + (prox[0].faltan === 0 ? ' (¡hoy!)' : ' · faltan ' + prox[0].faltan + (prox[0].faltan === 1 ? ' día' : ' días'));
    $('prox-sig').textContent = prox[0].nombre + (prox.length > 1 ? '. Después: ' + prox.slice(1).map(function (p) { return largo(p.fecha).replace(/ de \d{4}$/, '') + ' (' + p.nombre + ')'; }).join('; ') + '.' : '.');
  } else { $('prox-main').textContent = 'Sin datos del próximo año todavía'; }
  $('desde').value = hoy();
  function modo() { return form.querySelector('input[name="modo"]:checked').value; }
  function toggles() { Array.prototype.forEach.call(document.querySelectorAll('[data-modo]'), function (el) { el.hidden = el.getAttribute('data-modo') !== modo(); }); }
  function calcular(scroll) {
    $('form-error').textContent = '';
    var opts = { turisticos: $('turisticos').checked };
    try {
      if (modo() === 'entre') {
        var r = C.diasHabiles($('desde').value, $('hasta').value, lista, opts);
        $('res-label').textContent = 'Días hábiles entre el ' + largo($('desde').value) + ' y el ' + largo($('hasta').value);
        $('res-main').textContent = r.habiles + (r.habiles === 1 ? ' día hábil' : ' días hábiles');
        $('res-nota').textContent = r.corridos + ' días corridos. ' + (r.feriados.length ? 'Feriados en el período: ' + r.feriados.map(function (f) { return f.nombre; }).join(', ') + '.' : 'No hay feriados en el período.');
        $('res-resumen').textContent = r.habiles + ' días hábiles entre ' + $('desde').value + ' y ' + $('hasta').value + ' (' + r.corridos + ' corridos).';
      } else {
        var n = parseInt($('dias').value, 10);
        var f = C.sumarHabiles($('desde').value, n, lista, opts);
        $('res-label').textContent = n + ' días hábiles después del ' + largo($('desde').value);
        $('res-main').textContent = largo(f);
        $('res-nota').textContent = 'Se cuenta desde el día siguiente a la fecha inicial, sin fines de semana ni feriados.';
        $('res-resumen').textContent = n + ' días hábiles desde el ' + $('desde').value + ': vence el ' + largo(f) + '.';
      }
    } catch (e) { $('form-error').textContent = e.message; return; }
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { toggles(); if (calculado) calcular(false); });
  toggles();
})();
