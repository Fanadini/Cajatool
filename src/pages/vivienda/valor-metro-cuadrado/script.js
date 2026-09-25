(function () {
  'use strict';
  var F = window.CTFormat, M = window.CTM2;
  var data = JSON.parse(document.getElementById('data-m2-caba').textContent);
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-m2'), calculado = false;
  var n0 = function (x) { return 'USD ' + F.fmtNumber(x, 0); };

  // Barrios de todas las series, con el promedio de la Ciudad primero
  var set = {};
  Object.keys(data.series).forEach(function (k) { Object.keys(data.series[k].barrios).forEach(function (b) { set[b] = 1; }); });
  $('barrio').add(new Option('Promedio de la Ciudad', 'Total'));
  Object.keys(set).filter(function (b) { return b !== 'Total'; }).sort(function (a, b) { return a.localeCompare(b, 'es'); })
    .forEach(function (b) { $('barrio').add(new Option(b, b)); });

  function calcular(scroll) {
    $('form-error').textContent = '';
    var p = { precio: F.parseAR($('precio').value), cubierta: F.parseAR($('cubierta').value), semicubierta: F.parseAR($('semi').value) || 0,
      descubierta: F.parseAR($('desc').value) || 0, barrio: $('barrio').value, serie: $('serie').value };
    var r;
    try { r = M.calcular(p, data); } catch (e) { $('form-error').textContent = e.message; return; }
    var ref = r.referencia, nombre = ref.barrio === 'Total' ? 'la Ciudad' : ref.barrio;
    if (r.usdM2) {
      $('res-label').textContent = 'Valor del metro cuadrado';
      $('res-main').textContent = n0(r.usdM2) + ' / m²';
      var d = r.diferenciaPct;
      $('res-explica').textContent = Math.abs(d) < 3 ? 'Está en línea con el promedio de ' + nombre + '.'
        : 'Está un ' + F.fmtPercent(Math.abs(d), 1) + (d > 0 ? ' por encima' : ' por debajo') + ' del promedio de ' + nombre + '.';
    } else {
      $('res-label').textContent = 'Valor estimado según el promedio de ' + nombre;
      $('res-main').textContent = n0(r.valorEstimado);
      $('res-explica').textContent = 'Es una referencia a partir de precios de publicación. El valor real depende del estado, la ubicación exacta y las comodidades.';
    }
    $('res-sup').textContent = F.fmtNumber(r.superficie, 1) + ' m²';
    $('res-ref').textContent = n0(ref.usd) + ' / m²';
    $('res-ref-l').textContent = 'Promedio de ' + nombre;
    $('res-est').textContent = n0(r.valorEstimado);
    var t = ref.periodo.split('-T');
    $('res-nota').textContent = (ref.aproximado ? 'No hay datos oficiales de 4 ambientes o más: se usa el promedio de 3 ambientes como aproximación. ' : '') + (ref.sinDato ? 'No hay datos suficientes de ese barrio para este tipo de departamento: se usa el promedio de la Ciudad. ' : '') +
      'Precios de publicación del ' + t[1] + '.º trimestre de ' + t[0] + (ref.provisorio ? ' (provisorios)' : '') + ', IEC de la Ciudad de Buenos Aires.' +
      (ref.variacionAnual !== null ? ' Variación anual: ' + (ref.variacionAnual > 0 ? '+' : '') + F.fmtPercent(ref.variacionAnual, 1) + '.' : '');
    $('res-resumen').textContent = (r.usdM2 ? 'Valor del m²: ' + n0(r.usdM2) + ' (' + F.fmtNumber(r.superficie, 1) + ' m²). ' : '') +
      'Promedio de ' + nombre + ': ' + n0(ref.usd) + '/m²; valor estimado ' + n0(r.valorEstimado) + '.';
    $('resultado').hidden = false; calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { if (calculado) calcular(false); });
})();
