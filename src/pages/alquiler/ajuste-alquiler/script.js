(function () {
  'use strict';
  var F = window.CTFormat;
  var A = window.CTAlquiler;
  var data = JSON.parse(document.getElementById('data-indices').textContent);
  var form = document.getElementById('form-alquiler');
  var $ = function (id) { return document.getElementById(id); };
  var NOMBRES = { ipc: 'IPC', icl: 'ICL', casapropia: 'Casa Propia', fijo: 'porcentaje fijo' };
  var calculado = false;

  function fecha(isoDate) {
    var p = isoDate.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  function fechaCorta(isoDate) {
    var p = isoDate.split('-');
    return p[2] + '/' + p[1] + '/' + p[0].slice(2);
  }
  function mes(ym) {
    var d = new Date(ym + '-15T12:00:00Z');
    return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
  }
  // Texto corto de los valores usados: "ICL 22,84 → 30,58" · "IPC 02/25 a 04/25"
  function detalle(t) {
    return t
      .replace(/ \d{4}-\d{2}-\d{2}:/g, '')
      .replace(/(\d{2})(\d{2})-(\d{2})/g, '$3/$2')
      .replace(/(\d)\.(\d)/g, '$1,$2');
  }
  function hoy() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Fechas de los datos cargados
  $('dato-icl').textContent = fecha(data.icl.hasta);
  $('dato-ipc').textContent = mes(data.ipc.hasta);
  $('dato-cp').textContent = mes(data.casaPropia.hasta);

  function indice() { return form.querySelector('input[name="indice"]:checked').value; }

  function toggleCampos() {
    var i = indice();
    $('campo-porcentaje').hidden = i !== 'fijo';
    $('campo-desfase').hidden = i !== 'ipc';
  }

  function setError(id, msg) {
    $(id + '-error').textContent = msg || '';
    $(id).setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function leer() {
    var ok = true;
    var monto = F.parseAR($('monto').value);
    if (!(monto > 0)) { setError('monto', 'Ingresá un monto mayor a cero.'); ok = false; } else setError('monto');
    var inicio = $('inicio').value;
    if (!inicio || inicio < '2020-07-01') { setError('inicio', 'Elegí una fecha desde el 01/07/2020.'); ok = false; } else setError('inicio');
    var porcentaje = F.parseAR($('porcentaje').value);
    if (indice() === 'fijo' && !(porcentaje >= 0)) { setError('porcentaje', 'Ingresá el porcentaje pactado.'); ok = false; } else setError('porcentaje');
    if (!ok) return null;
    return {
      monto: monto,
      inicio: inicio,
      frecuencia: parseInt($('frecuencia').value, 10),
      duracion: parseInt($('duracion').value, 10),
      indice: indice(),
      porcentaje: porcentaje,
      desfase: parseInt($('desfase').value, 10)
    };
  }

  function mostrar(p, r) {
    var h = hoy();
    var vigente = A.periodoVigente(r, h);
    var mostrado = vigente && vigente.estado === 'ok' ? vigente : r.ultimoCalculado;
    $('res-label').textContent = vigente && vigente.estado === 'ok'
      ? 'Alquiler que corresponde hoy (' + fecha(h) + ')'
      : 'Último alquiler calculado (desde el ' + fecha(mostrado.desde) + ')';
    $('res-monto').textContent = F.fmtMoney(mostrado.monto);
    $('res-aumento').textContent = F.fmtPercent((mostrado.monto / p.monto - 1) * 100, 1);

    var proximo = r.periodos.filter(function (f) { return f.desde > h; })[0];
    $('res-proximo').textContent = proximo ? fechaCorta(proximo.desde) : 'Sin ajustes pendientes';
    var ultimoAjuste = r.periodos.filter(function (f) { return f.numero > 1 && f.estado === 'ok' && f.desde <= (vigente ? vigente.desde : h); }).pop();
    $('res-ultimo-ajuste').textContent = ultimoAjuste ? F.fmtPercent(ultimoAjuste.variacion, 2) : '—';

    var tbody = $('res-tabla');
    tbody.textContent = '';
    r.periodos.forEach(function (f) {
      var tr = document.createElement('tr');
      if (f === vigente) tr.style.fontWeight = '700';
      var celdas = [
        fechaCorta(f.desde),
        f.numero === 1 ? '—' : (f.estado === 'ok' ? '+' + F.fmtPercent(f.variacion, 2) : 'Pendiente'),
        f.estado === 'ok' ? F.fmtMoney(f.monto) : 'Sin dato'
      ];
      celdas.forEach(function (c, i) {
        var td = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) td.scope = 'row';
        td.textContent = c;
        if (i === 1 && f.numero > 1 && f.estado === 'ok') {
          var small = document.createElement('small');
          small.className = 'detalle';
          small.textContent = detalle(f.detalle);
                    td.appendChild(small);
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    $('res-nota').textContent = r.pendientes
      ? r.pendientes + ' ajuste(s) quedan pendientes hasta que se publique el índice oficial.'
      : 'Debajo de cada ajuste figuran los valores del índice usados.';

    var resumen = 'Ajuste de alquiler por ' + NOMBRES[p.indice] + ' cada ' + p.frecuencia + ' meses. Inicial ' + F.fmtMoney(p.monto) +
      ' (' + fecha(p.inicio) + ') → ' + F.fmtMoney(mostrado.monto) + ' desde el ' + fecha(mostrado.desde) + ' (+' + F.fmtPercent((mostrado.monto / p.monto - 1) * 100, 1) + ').';
    $('res-resumen').textContent = resumen;
    $('resultado').hidden = false;
  }

  function calcular(scroll) {
    var p = leer();
    if (!p) return;
    try {
      var r = A.calcular(p, data);
      mostrar(p, r);
      calculado = true;
      guardarEnUrl(p);
      if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      setError('monto', e.message);
    }
  }

  // Los datos del formulario viajan en la URL para poder compartir el cálculo
  function guardarEnUrl(p) {
    var q = new URLSearchParams({ m: p.monto, f: p.inicio, i: p.indice, c: p.frecuencia, d: p.duracion });
    if (p.indice === 'fijo') q.set('p', p.porcentaje);
    if (p.indice === 'ipc') q.set('x', p.desfase);
    history.replaceState(null, '', '?' + q.toString());
  }
  function leerDeUrl() {
    var q = new URLSearchParams(location.search);
    if (!q.has('m')) return false;
    $('monto').value = F.fmtNumber(parseFloat(q.get('m')));
    if (q.get('f')) $('inicio').value = q.get('f');
    var r = form.querySelector('input[name="indice"][value="' + q.get('i') + '"]');
    if (r) r.checked = true;
    if (q.get('c')) $('frecuencia').value = q.get('c');
    if (q.get('d')) $('duracion').value = q.get('d');
    if (q.get('p')) $('porcentaje').value = q.get('p').replace('.', ',');
    if (q.get('x')) $('desfase').value = q.get('x');
    return true;
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () {
    toggleCampos();
    if (calculado) calcular(false);
  });

  if (!leerDeUrl()) {
    // Por defecto: contrato que empezó hace un año, el día 1
    var d = new Date();
    $('inicio').value = (d.getFullYear() - 1) + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
    toggleCampos();
  } else {
    toggleCampos();
    calcular(false);
  }
})();
