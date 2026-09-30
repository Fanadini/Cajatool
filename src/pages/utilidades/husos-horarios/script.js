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
    ['Pacific/Auckland', 'Auckland, Nueva Zelanda']
  ];
  // Husos fijos UTC−12 a UTC+14 (en la base IANA, Etc/GMT+3 es UTC−3: el signo va invertido)
  var HUSOS = [];
  for (var n = -12; n <= 14; n++) {
    HUSOS.push([n === 0 ? 'UTC' : 'Etc/GMT' + (n < 0 ? '+' + (-n) : '-' + n), H.formatOffset(n * 60) + (n === 0 ? ' (Tiempo Universal Coordinado)' : '')]);
  }
  var NOMBRE = {};
  CIUDADES.concat(HUSOS).forEach(function (c) { NOMBRE[c[0]] = c[1]; });
  // Ciudades ordenadas por su diferencia horaria actual, con el código UTC adelante
  var hoy = new Date();
  var ORDEN = CIUDADES.map(function (c) { return { zone: c[0], off: H.offsetMinutes(c[0], hoy), nombre: c[1] }; })
    .sort(function (a, b) { return a.off - b.off || a.nombre.localeCompare(b.nombre, 'es'); });
  var POR_DEFECTO = ['Europe/Madrid', 'America/New_York', 'America/Mexico_City', 'America/Santiago', 'America/Sao_Paulo', 'Europe/London', 'Asia/Tokyo'];
  var seleccion = POR_DEFECTO.slice();

  function leerUrl() {
    var q = new URLSearchParams(location.search);
    if (q.get('o') && NOMBRE[q.get('o')]) origenCombo.set(q.get('o'));
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

  // Opciones buscables: ciudades (ordenadas por código UTC) y husos fijos
  function norm(t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[−–]/g, '-').replace(/\s+/g, ''); }
  var OPCIONES = ORDEN.map(function (c) {
    var cod = H.formatOffset(c.off);
    return { zone: c.zone, label: '(' + cod + ') ' + c.nombre, grupo: 'Ciudades', q: norm(c.nombre + cod + cod.replace('UTC', 'GMT') + c.zone) };
  }).concat(HUSOS.map(function (h) {
    return { zone: h[0], label: h[1], grupo: 'Husos horarios UTC', q: norm(h[1] + h[1].replace('UTC', 'GMT')) };
  }));
  var LABEL = {};
  OPCIONES.forEach(function (o) { LABEL[o.zone] = o.label; });

  // Combobox accesible: filtra mientras se escribe (sin distinguir tildes ni mayúsculas)
  function combo(id, alElegir, limpiarAlElegir) {
    var input = $(id), lista = $(id + '-lista'), activos = [], idx = -1, actual = '';
    function cerrar() { lista.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); idx = -1; }
    function marcar(i) {
      idx = i;
      Array.prototype.forEach.call(lista.querySelectorAll('[role="option"]'), function (li, j) { li.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
      if (i >= 0) { var el = $(id + '-op-' + i); input.setAttribute('aria-activedescendant', el.id); el.scrollIntoView({ block: 'nearest' }); }
    }
    function abrir() {
      var t = norm(input.value === LABEL[actual] ? '' : input.value);
      activos = OPCIONES.filter(function (o) { return !t || o.q.indexOf(t) !== -1; });
      lista.textContent = ''; var grupo = '';
      if (!activos.length) { var v = document.createElement('li'); v.className = 'combo-empty'; v.textContent = 'Sin resultados'; lista.appendChild(v); }
      activos.forEach(function (o, i) {
        if (o.grupo !== grupo) { grupo = o.grupo; var g = document.createElement('li'); g.className = 'combo-group'; g.setAttribute('role', 'presentation'); g.textContent = grupo; lista.appendChild(g); }
        var li = document.createElement('li');
        li.id = id + '-op-' + i; li.setAttribute('role', 'option'); li.textContent = o.label;
        li.addEventListener('mousedown', function (e) { e.preventDefault(); elegir(i); });
        lista.appendChild(li);
      });
      lista.hidden = false; input.setAttribute('aria-expanded', 'true'); marcar(t && activos.length ? 0 : -1);
    }
    function elegir(i) {
      var o = activos[i]; if (!o) return;
      cerrar();
      if (limpiarAlElegir) input.value = ''; else { actual = o.zone; input.value = o.label; input.blur(); }
      alElegir(o.zone);
    }
    input.addEventListener('focus', function () { input.select(); abrir(); });
    input.addEventListener('input', abrir);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (lista.hidden) abrir(); marcar(Math.min(idx + 1, activos.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marcar(Math.max(idx - 1, 0)); }
      else if (e.key === 'Enter') { if (!lista.hidden && activos.length) { e.preventDefault(); elegir(idx >= 0 ? idx : 0); } }
      else if (e.key === 'Escape') { cerrar(); input.value = limpiarAlElegir ? '' : (LABEL[actual] || ''); }
    });
    input.addEventListener('blur', function () { cerrar(); input.value = limpiarAlElegir ? '' : (LABEL[actual] || ''); });
    return { set: function (z) { actual = z; input.value = LABEL[z] || ''; }, get: function () { return actual; } };
  }
  var origenCombo = combo('origen', function () { render(); }, false);
  combo('agregar', function (z) { if (seleccion.indexOf(z) === -1) seleccion.push(z); render(); }, true);
  origenCombo.set('America/Argentina/Buenos_Aires');

  function pad(n) { return String(n).padStart(2, '0'); }
  function ahora() {
    // Hora actual en la ciudad de referencia
    var r = H.convertir(localNow(), 'UTC', [origenCombo.get()])[0];
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
    var origen = origenCombo.get();
    if (!$('fecha').value || !$('hora').value) { $('form-error').textContent = 'Elegí una fecha y una hora.'; return; }
    var local = $('fecha').value + 'T' + $('hora').value.slice(0, 5);
    var zonas = [origen].concat(seleccion.filter(function (z) { return z !== origen; }));
    var res;
    try { res = H.convertir(local, origen, zonas); } catch (e) { $('form-error').textContent = e.message; return; }
    var base = res[0];
    $('res-label').textContent = NOMBRE[origen] + ': ' + base.hora + ' del ' + fechaLarga(base.fecha) + (/^(UTC|Etc\/)/.test(origen) ? '' : ' (' + base.offsetTexto + (base.verano ? ', horario de verano' : '') + ')');
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
      li.querySelector('.tz-meta').textContent = (/^(UTC|Etc\/)/.test(r.zone) ? '' : r.offsetTexto + (r.verano ? ' · verano' : '') + ' · ') + difTxt;
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

  $('fecha').addEventListener('change', render);
  $('hora').addEventListener('change', render);
  $('ahora').addEventListener('click', function () { ahora(); render(); });

  if (!leerUrl()) ahora();
  render();
})();
