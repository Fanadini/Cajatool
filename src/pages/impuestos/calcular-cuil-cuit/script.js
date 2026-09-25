(function () {
  'use strict';
  var C = window.CTCuit;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-cuit');
  function modo() { return form.querySelector('input[name="modo"]:checked').value; }
  function toggles() { Array.prototype.forEach.call(document.querySelectorAll('[data-modo]'), function (el) { el.hidden = el.getAttribute('data-modo') !== modo(); }); }
  function calcular(scroll) {
    $('form-error').textContent = '';
    if (modo() === 'calcular') {
      var r;
      try { r = C.calcular($('dni').value, $('tipo').value); } catch (e) { $('form-error').textContent = e.message; return; }
      $('res-label').textContent = 'CUIL/CUIT correspondiente';
      $('res-main').textContent = r.formateado;
      $('res-nota').textContent = (r.prefijo === '23' || r.prefijo === '33' ? 'El cálculo con el prefijo habitual daba 10, por eso se usa el prefijo ' + r.prefijo + '. ' : '') +
        'Verificalo con tu constancia oficial de ANSES o ARCA.';
    } else {
      var v = C.validar($('numero').value);
      $('res-label').textContent = v.valido ? 'Número válido' : 'Número no válido';
      $('res-main').textContent = v.formateado || $('numero').value;
      $('res-nota').textContent = v.valido ? 'El dígito verificador es correcto. Para saber si está activo, consultá la constancia de inscripción en ARCA.' : v.motivo;
    }
    $('resultado').hidden = false;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', toggles);
  toggles();
})();
