(function () {
  'use strict';
  var F = window.CTFormat;
  var M = window.CTMonotributo;
  var data = JSON.parse(document.getElementById('data-monotributo').textContent);
  var $ = function (id) { return document.getElementById(id); };
  var calculado = false;

  function opt(id) { var n = F.parseAR($(id).value); return isFinite(n) ? n : undefined; }

  function calcular(scroll) {
    $('ingresos-error').textContent = '';
    var ingresos = F.parseAR($('ingresos').value);
    if (!(ingresos >= 0)) { $('ingresos-error').textContent = 'Ingresá tu facturación anual.'; return; }
    var situacion = $('situacion').value;
    var p = {
      ingresos: ingresos,
      actividad: document.querySelector('input[name="actividad"]:checked').value,
      superficie: opt('superficie'),
      energia: opt('energia'),
      alquileres: opt('alquileres'),
      precioUnitario: opt('precio'),
      relacionDependencia: situacion === 'dependencia',
      jubilado: situacion === 'jubilado',
      adherentes: parseInt($('adherentes').value, 10)
    };
    var r = M.calcular(p, data);
    Array.prototype.forEach.call(document.querySelectorAll('#tabla-categorias tr'), function (tr) { tr.style.fontWeight = ''; tr.style.background = ''; });

    if (r.excluido) {
      $('res-label').textContent = 'Resultado';
      $('res-main').textContent = 'Fuera del monotributo';
      $('res-grid').hidden = true;
      $('res-nota').textContent = r.excluido;
      $('res-resumen').textContent = 'Monotributo: ' + r.excluido;
    } else {
      $('res-grid').hidden = false;
      $('res-label').textContent = 'Categoría ' + r.categoria + ' · cuota mensual';
      $('res-main').textContent = r.categoria + ' · ' + F.fmtMoney(r.cuota.total);
      $('res-impuesto').textContent = F.fmtMoney(r.cuota.impuesto);
      $('res-sipa').textContent = F.fmtMoney(r.cuota.sipa);
      $('res-os').textContent = F.fmtMoney(r.cuota.obraSocial);
      $('res-margen').textContent = F.fmtMoney(r.margen);
      $('res-nota').textContent = 'Por año: ' + F.fmtMoney(r.anual) + '. Tope de facturación de la categoría ' + r.categoria + ': ' +
        F.fmtMoney(r.topeCategoria) + ' (unos ' + F.fmtMoney(r.promedioMensualMax) + ' por mes).' +
        (r.limitante && r.limitante !== 'ingresos brutos anuales' ? ' La categoría la define tu ' + r.limitante + ', no tu facturación.' : '');
      $('res-resumen').textContent = 'Monotributo categoría ' + r.categoria + ' (' + (p.actividad === 'servicios' ? 'servicios' : 'venta de bienes') +
        '): cuota mensual ' + F.fmtMoney(r.cuota.total) + ' con facturación anual de ' + F.fmtMoney(ingresos) + '. Valores ARCA vigentes desde ' +
        data.vigenciaDesde.split('-').reverse().join('/') + '.';
      var fila = document.querySelector('#tabla-categorias tr[data-cat="' + r.categoria + '"]');
      if (fila) { fila.style.fontWeight = '700'; fila.style.background = 'var(--primary-soft)'; }
    }
    $('resultado').hidden = false;
    calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('form-mono').addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  $('form-mono').addEventListener('change', function () { if (calculado) calcular(false); });
})();
