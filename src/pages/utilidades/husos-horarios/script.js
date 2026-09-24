(function () {
  'use strict';
  var H = window.CTHusos;
  var $ = function (id) { return document.getElementById(id); };

  var CIUDADES = [
    ['America/Argentina/Buenos_Aires', 'Buenos Aires, Argentina'],
    ['America/Montevideo', 'Montevideo, Uruguay'],
    ['America/Santiago', 'Santiago, Chile'],
    ['America/Sao_Paulo', 'San Pablo, Brasil'],
    ['America/Asuncion', 'Asunción, Paraguay'],
    ['America/La_Paz', 'La Paz, Bolivia'],
    ['America/Lima', 'Lima, Perú'],
    ['America/Bogota', 'Bogotá, Colombia'],
    ['America/Caracas', 'Caracas, Venezuela'],
    ['America/Guayaquil', 'Quito / Guayaquil, Ecuador'],
    ['America/Panama', 'Panamá'],
    ['America/Mexico_City', 'Ciudad de México'],
    ['America/Cancun', 'Cancún, México'],
    ['America/Havana', 'La Habana, Cuba'],
    ['America/Santo_Domingo', 'Santo Domingo, R. Dominicana'],
    ['America/New_York', 'Nueva York / Miami, EE. UU.'],
    ['America/Chicago', 'Chicago, EE. UU.'],
    ['America/Denver', 'Denver, EE. UU.'],
    ['America/Los_Angeles', 'Los Ángeles, EE. UU.'],
    ['America/Toronto', 'Toronto, Canadá'],
    ['America/Vancouver', 'Vancouver, Canadá'],
    ['Pacific/Honolulu', 'Honolulu, Hawái'],
    ['Europe/London', 'Londres, Reino Unido'],
    ['Europe/Lisbon', 'Lisboa, Portugal'],
    ['Europe/Madrid', 'Madrid / Barcelona, España'],
    ['Atlantic/Canary', 'Islas Canarias, España'],
    ['Europe/Paris', 'París, Francia'],
    ['Europe/Rome', 'Roma, Italia'],
    ['Europe/Berlin', 'Berlín, Alemania'],
    ['Europe/Amsterdam', 'Ámsterdam, Países Bajos'],
    ['Europe/Zurich', 'Zúrich, Suiza'],
    ['Europe/Athens', 'Atenas, Grecia'],
    ['Europe/Istanbul', 'Estambul, Turquía'],
    ['Europe/Moscow', 'Moscú, Rusia'],
    ['Asia/Jerusalem', 'Jerusalén / Tel Aviv, Israel'],
    ['Africa/Cairo', 'El Cairo, Egipto'],
    ['Africa/Johannesburg', 'Johannesburgo, Sudáfrica'],
    ['Asia/Dubai', 'Dubái, Emiratos Árabes'],
    ['Asia/Kolkata', 'Nueva Delhi / Bombay, India'],
    ['Asia/Bangkok', 'Bangkok, Tailandia'],
    ['Asia/Singapore', 'Singapur'],
    ['Asia/Shanghai', 'Pekín / Shanghái, China'],
    ['Asia/Hong_Kong', 'Hong Kong'],
    ['Asia/Seoul', 'Seúl, Corea del Sur'],
    ['Asia/Tokyo', 'Tokio, Japón'],
    ['Australia/Sydney', 'Sídney, Australia'],
    ['Pacific/Auckland', 'Auckland, Nueva Zelanda'],
    ['UTC', 'UTC (Tiempo Universal Coordinado)']
  ];
  var NOMBRE = {};
  CIUDADES.forEach(function (c) { NOMBRE[c[0]] = c[1]; });
  var POR_DEFECTO = ['Europe/Madrid', 'America/New_York', 'America/Mexico_City', 'America/Santiago', 'America/Sao_Paulo', 'Europe/London', 'Asia/Tokyo'];
  var seleccion = POR_DEFECTO.slice();

  function leerUrl() {
    var q = new URLSearchParams(location.search);
    if (q.get('o') && NOMBRE[q.get('o')]) $('origen').value = q.get('o');
    if (q.get('c')) {
      var cs = q.get('c').split(',').filter(function (z) { return NOMBRE[z]; });
      if (cs.length) seleccion = cs;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(q.get('t') || '')) {
      $('fecha').value = q.get('t').slice(0, 10);
      $('hora').value = q.get('t').slice(11);
      return true;
    }
    return false;
  }

  CIUDADES.forEach(function (c) {
    $('origen').add(new Option(c[1], c[0]));
    $('agregar').add(new Option(c[1], c[0]));
  });

  function pad(n) { return String(n).padStart(2, '0'); }
  function ahora() {
    // Hora actual en la ciudad de referencia
    var r = H.convertir(localNow(), 'UTC', [$('origen').value])[0];
    $('fecha').value = r.fecha;
    $('hora').value = r.hora;
  }
  function localNow() {
    var d = new Date();
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
  }
  function fechaLarga(iso) {
    return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
  }

  function render() {
    $('form-error').textContent = '';
    var origen = $('origen').value;
    if (!$('fecha').value || !$('hora').value) { $('form-error').textContent = 'Elegí una fecha y una hora.'; return; }
    var local = $('fecha').value + 'T' + $('hora').value.slice(0, 5);
    var zonas = [origen].concat(seleccion.filter(function (z) { return z !== origen; }));
    var res;
    try { res = H.convertir(local, origen, zonas); } catch (e) { $('form-error').textContent = e.message; return; }
    var base = res[0];
    $('res-label').textContent = NOMBRE[origen] + ': ' + base.hora + ' del ' + fechaLarga(base.fecha) + ' (' + base.offsetTexto + (base.verano ? ', horario de verano' : '') + ')';
    var ul = $('res-lista');
    ul.textContent = '';
    var lineas = [];
    res.slice(1).forEach(function (r) {
      var li = document.createElement('li');
      li.className = 'tz-item';
      var dif = (r.offset - base.offset) / 60;
      var difTxt = dif === 0 ? 'misma hora' : (dif > 0 ? '+' : '−') + String(Math.abs(dif)).replace('.5', ':30') + ' h';
      li.innerHTML =
        '<span class="tz-city"></span>' +
        '<span class="tz-time"></span>' +
        '<span class="tz-meta"></span>' +
        '<button type="button" class="tz-remove" aria-label="Quitar">×</button>';
      li.querySelector('.tz-city').textContent = NOMBRE[r.zone];
      li.querySelector('.tz-time').textContent = r.hora + (r.diaRelativo ? (r.diaRelativo > 0 ? ' +1 día' : ' −1 día') : '');
      li.querySelector('.tz-meta').textContent = r.offsetTexto + (r.verano ? ' · verano' : '') + ' · ' + difTxt;
      li.querySelector('.tz-remove').setAttribute('aria-label', 'Quitar ' + NOMBRE[r.zone]);
      li.querySelector('.tz-remove').addEventListener('click', function () {
        seleccion = seleccion.filter(function (z) { return z !== r.zone; });
        render();
      });
      ul.appendChild(li);
      lineas.push(NOMBRE[r.zone] + ': ' + r.hora + (r.diaRelativo ? ' (' + fechaLarga(r.fecha) + ')' : ''));
    });
    $('res-resumen').textContent = NOMBRE[origen] + ' ' + base.hora + ' (' + fechaLarga(base.fecha) + ')\n' + lineas.join('\n');
    var q = new URLSearchParams({ o: origen, t: local, c: seleccion.join(',') });
    history.replaceState(null, '', '?' + q.toString());
  }

  $('agregar').addEventListener('change', function () {
    var z = $('agregar').value;
    if (z && seleccion.indexOf(z) === -1) seleccion.push(z);
    $('agregar').value = '';
    render();
  });
  $('origen').addEventListener('change', render);
  $('fecha').addEventListener('change', render);
  $('hora').addEventListener('change', render);
  $('ahora').addEventListener('click', function () { ahora(); render(); });

  if (!leerUrl()) ahora();
  render();
})();
