(function () {
  'use strict';
  var F = window.CTFormat, D = window.CTFechas;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-fechas'), calculado = false;
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function hoy() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function largo(iso) { return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z')); }
  function pl(n, s, p) { return F.fmtNumber(n, 0) + ' ' + (Math.abs(n) === 1 ? s : p); }
  function modo() { return form.querySelector('input[name="modo"]:checked').value; }
  function toggles() { Array.prototype.forEach.call(form.querySelectorAll('[data-modo]'), function (el) { el.hidden = el.getAttribute('data-modo').split(' ').indexOf(modo()) === -1; }); }
  function mostrar(label, main, exp, resumen) { $('res-label').textContent = label; $('res-main').textContent = main; $('res-explica').textContent = exp; $('res-resumen').textContent = resumen; }
  function calcular(scroll) {
    $('form-error').textContent = '';
    try {
      var m = modo();
      if (m === 'entre') {
        var r = D.diferencia($('desde').value, $('hasta').value, $('ultimo').checked), d = Math.abs(r.dias);
        mostrar(r.pasado ? 'Días (la fecha final es anterior)' : 'Días entre fechas', pl(d, 'día', 'días'),
          pl(r.semanas, 'semana', 'semanas') + (r.restoDias ? ' y ' + pl(r.restoDias, 'día', 'días') : '') + ' · ' + pl(r.anios, 'año', 'años') + ', ' + pl(r.meses, 'mes', 'meses') + ' y ' + pl(r.diasYmd, 'día', 'días') + '.',
          'Entre el ' + largo($('desde').value) + ' y el ' + largo($('hasta').value) + ' hay ' + pl(d, 'día', 'días') + '.');
      } else if (m === 'sumar') {
        var n = F.parseAR($('dias').value), f = D.sumar($('desde').value, n);
        mostrar(n >= 0 ? 'Dentro de ' + pl(n, 'día', 'días') : 'Hace ' + pl(-n, 'día', 'días'), largo(f), '', (n >= 0 ? 'Sumando ' : 'Restando ') + pl(Math.abs(n), 'día', 'días') + ' al ' + largo($('desde').value) + ' da el ' + largo(f) + '.');
      } else {
        var e = D.edad($('nacimiento').value, $('fecha-edad').value || hoy());
        mostrar('Edad', pl(e.anios, 'año', 'años'), pl(e.meses, 'mes', 'meses') + ' y ' + pl(e.dias, 'día', 'días') + ' más · ' + F.fmtNumber(e.totalDias, 0) + ' días vividos · naciste un ' + DIAS[e.diaSemana] + '. ' + (e.faltan === 0 ? '¡Feliz cumpleaños!' : 'Faltan ' + pl(e.faltan, 'día', 'días') + ' para tu cumpleaños (' + largo(e.proximoCumple) + ').'),
          'Tengo ' + pl(e.anios, 'año', 'años') + ', ' + pl(e.meses, 'mes', 'meses') + ' y ' + pl(e.dias, 'día', 'días') + ' (' + F.fmtNumber(e.totalDias, 0) + ' días vividos).');
      }
    } catch (err) { $('form-error').textContent = err.message; return; }
    $('res-explica').hidden = !$('res-explica').textContent;
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'modo') { toggles(); $('resultado').hidden = true; calculado = false; return; }
    if (calculado) calcular(false);
  });
  $('desde').value = hoy(); $('fecha-edad').value = hoy();
  toggles();
})();
