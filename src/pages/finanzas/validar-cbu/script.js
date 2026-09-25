(function () {
  'use strict';
  var C = window.CTCbu;
  var ent = JSON.parse(document.getElementById('data-bancos').textContent).entidades;
  var $ = function (id) { return document.getElementById(id); };
  function fila(n, v) { var tr = document.createElement('tr'), th = document.createElement('th'), td = document.createElement('td'); th.scope = 'row'; th.textContent = n; td.textContent = v; tr.appendChild(th); tr.appendChild(td); $('res-tabla').appendChild(tr); }
  function validar(scroll) {
    var r = C.validar($('cbu').value, ent);
    $('res-tabla').textContent = '';
    $('res-label').textContent = r.tipo ? r.tipo + (r.valido ? ' válido' : ' no válido') : 'Número no válido';
    $('res-main').textContent = r.valido ? (r.tipo === 'CVU' ? 'Billetera virtual (CVU)' : (r.entidad || 'Entidad con código ' + r.codigo)) : '✕ Revisá el número';
    if (r.motivo) fila('Problema', r.motivo);
    if (r.tipo) {
      fila('Tipo', r.tipo === 'CVU' ? 'CVU: cuenta de un proveedor de servicios de pago' : 'CBU: cuenta bancaria');
      if (r.tipo === 'CBU') { fila('Código de entidad', r.codigo + (r.entidad ? '' : ' (no figura en el listado del BCRA)')); fila('Sucursal', r.sucursal); }
      fila('Bloque 1 (entidad y sucursal)', r.bloque1 ? 'Correcto' : 'Incorrecto');
      fila('Bloque 2 (cuenta)', r.bloque2 ? 'Correcto' : 'Incorrecto');
    }
    $('res-resumen').textContent = $('res-label').textContent + ': ' + $('res-main').textContent + (r.valido && r.tipo === 'CBU' ? ' (código ' + r.codigo + ', sucursal ' + r.sucursal + ')' : '') + '.';
    $('resultado').hidden = false;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('form-cbu').addEventListener('submit', function (e) { e.preventDefault(); validar(true); });
  $('cbu').addEventListener('input', function () { if ($('cbu').value.replace(/\D/g, '').length === 22) validar(false); });
})();
