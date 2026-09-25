(function () {
  'use strict';
  var F = window.CTFormat, L = window.CTLibertad;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form-lf'), calculado = false, NS = 'http://www.w3.org/2000/svg';
  function tiempo(meses) {
    var a = Math.floor(meses / 12), m = meses % 12;
    return (a ? a + (a === 1 ? ' año' : ' años') : '') + (a && m ? ' y ' : '') + (m ? m + (m === 1 ? ' mes' : ' meses') : '') || 'Ya llegaste';
  }
  function corto(n) {
    if (n >= 1e9) return '$ ' + F.fmtNumber(n / 1e9, n >= 1e10 ? 0 : 1) + ' mil M';
    if (n >= 1e6) return '$ ' + F.fmtNumber(n / 1e6, n >= 1e7 ? 0 : 1) + ' M';
    return '$ ' + F.fmtNumber(n / 1e3, 0) + ' mil';
  }
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function niceMax(v) { var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
  // Barras apiladas por año: aportes (abajo) e intereses (arriba), con línea del objetivo
  function grafico(serie, objetivo) {
    var plot = $('chart-plot'), tip = $('chart-tip');
    plot.innerHTML = '';
    var W = Math.max(280, plot.clientWidth || 640), H = W < 480 ? 240 : 300, m = { t: 12, r: 8, b: 26, l: 60 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    var max = niceMax(Math.max(objetivo, serie[serie.length - 1].saldo) * 1.02);
    var y = function (v) { return m.t + ih - v / max * ih; };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Evolución del capital por año, separando aportes e intereses' }, plot);
    for (var i = 0; i <= 4; i++) {
      var v = max * i / 4, yy = y(v);
      el('line', { x1: m.l, x2: W - m.r, y1: yy, y2: yy, class: 'grid' }, svg);
      el('text', { x: m.l - 8, y: yy + 4, 'text-anchor': 'end', class: 'axis' }, svg).textContent = i ? corto(v) : '$ 0';
    }
    var n = serie.length, slot = iw / n, bw = Math.max(2, slot - 2), step = Math.ceil(n / Math.max(3, Math.floor(iw / 48)));
    serie.forEach(function (d, i) {
      var x = m.l + i * slot + (slot - bw) / 2, g = el('g', { class: 'bar', tabindex: '0' }, svg);
      var yA = y(d.aportado), yS = y(d.saldo), gap = d.intereses > 0 && yA - yS > 3 ? 2 : 0, rad = Math.min(4, bw / 2);
      el('rect', { x: x, y: yA, width: bw, height: Math.max(0, m.t + ih - yA), class: 's1' }, g);
      if (yA - yS - gap > 0.5) {
        var h = yA - yS - gap, r = Math.min(rad, h);
        el('path', { d: 'M' + x + ',' + (yS + h) + 'V' + (yS + r) + 'Q' + x + ',' + yS + ' ' + (x + r) + ',' + yS + 'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + yS + ' ' + (x + bw) + ',' + (yS + r) + 'V' + (yS + h) + 'Z', class: 's2' }, g);
      }
      el('rect', { x: m.l + i * slot, y: m.t, width: slot, height: ih, class: 'hit' }, g);
      if ((i % step === 0 && n - 1 - i >= step / 2) || i === n - 1) el('text', { x: x + bw / 2, y: H - 8, 'text-anchor': 'middle', class: 'axis' }, svg).textContent = F.fmtNumber(d.anio, d.anio % 1 ? 1 : 0);
      function show() {
        tip.innerHTML = '<strong>Año ' + F.fmtNumber(d.anio, d.anio % 1 ? 1 : 0) + '</strong><br><i class="sw sw-1"></i>Aportes: ' + F.fmtMoney(d.aportado) + '<br><i class="sw sw-2"></i>Intereses: ' + F.fmtMoney(d.intereses) + '<br>Capital: ' + F.fmtMoney(d.saldo);
        tip.hidden = false;
        var pr = plot.getBoundingClientRect(), fr = $('chart').getBoundingClientRect(), sc = pr.width / W;
        var left = pr.left - fr.left + (x + bw / 2) * sc, tw = tip.offsetWidth;
        tip.style.left = Math.max(0, Math.min(fr.width - tw, left - tw / 2)) + 'px';
        tip.style.top = (pr.top - fr.top + yS * sc - tip.offsetHeight - 8 < 0 ? pr.top - fr.top + yS * sc + 8 : pr.top - fr.top + yS * sc - tip.offsetHeight - 8) + 'px';
      }
      g.addEventListener('mouseenter', show); g.addEventListener('focus', show);
      g.addEventListener('mouseleave', function () { tip.hidden = true; }); g.addEventListener('blur', function () { tip.hidden = true; });
    });
    var yo = y(objetivo);
    el('line', { x1: m.l, x2: W - m.r, y1: yo, y2: yo, class: 'obj' }, svg);
    el('text', { x: W - m.r, y: yo - 6, 'text-anchor': 'end', class: 'axis obj-label' }, svg).textContent = 'Objetivo ' + corto(objetivo);
    $('chart-tbody').innerHTML = serie.map(function (d) {
      return '<tr><th scope="row">' + F.fmtNumber(d.anio, d.anio % 1 ? 1 : 0) + '</th><td>' + F.fmtMoney(d.aportado) + '</td><td>' + F.fmtMoney(d.intereses) + '</td><td>' + F.fmtMoney(d.saldo) + '</td></tr>';
    }).join('');
  }
  var ultimo = null, rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (ultimo) grafico(ultimo[0], ultimo[1]); }, 150); });
  function calcular(scroll) {
    $('form-error').textContent = '';
    var p = { gastoMensual: F.parseAR($('gasto').value), ahorroActual: F.parseAR($('ahorro').value) || 0, aporteMensual: F.parseAR($('aporte').value) || 0, rendimiento: F.parseAR($('rendimiento').value) || 0, tasaRetiro: F.parseAR($('retiro').value), anios: F.parseAR($('anios').value) || 0 };
    var r;
    try { r = L.calcular(p); } catch (e) { $('form-error').textContent = e.message; return; }
    $('res-obj').textContent = F.fmtMoney(r.objetivo);
    $('res-int').textContent = F.fmtMoney(Math.max(0, r.intereses));
    if (r.aporteNecesario !== undefined) { $('res-nec').textContent = F.fmtMoney(r.aporteNecesario); $('res-nec-label').textContent = 'Ahorro mensual para llegar en ' + p.anios + ' años'; }
    else { $('res-nec').textContent = '—'; $('res-nec-label').textContent = 'Ahorro mensual necesario'; }
    if (r.alcanzable) {
      $('res-main').textContent = tiempo(r.meses);
      var pct = r.objetivo ? Math.round(Math.max(0, r.intereses) / r.serie[r.serie.length - 1].saldo * 100) : 0;
      $('res-explica').textContent = r.meses ? 'Necesitás ' + F.fmtMoney(r.objetivo) + ' para cubrir ' + F.fmtMoney(p.gastoMensual) + ' por mes. De ese capital, ' + F.fmtMoney(r.aportado) + ' serían tus aportes y el ' + pct + ' % vendría del interés compuesto.' : 'Tu ahorro actual ya cubre tu costo de vida con esa tasa de retiro.';
      $('res-resumen').textContent = 'Libertad financiera: necesito ' + F.fmtMoney(r.objetivo) + ' y llego en ' + tiempo(r.meses) + ' ahorrando ' + F.fmtMoney(p.aporteMensual) + ' por mes al ' + F.fmtPercent(p.rendimiento, 1) + ' real anual.';
    } else {
      $('res-main').textContent = 'Más de 100 años';
      $('res-explica').textContent = 'Con ese ahorro y ese rendimiento no llegás a ' + F.fmtMoney(r.objetivo) + '. Probá ahorrar más, bajar gastos o ingresar en cuántos años querés llegar.';
      $('res-resumen').textContent = 'Libertad financiera: necesito ' + F.fmtMoney(r.objetivo) + (r.aporteNecesario !== undefined ? '; para llegar en ' + p.anios + ' años debería ahorrar ' + F.fmtMoney(r.aporteNecesario) + ' por mes.' : '.');
    }
    $('resultado').hidden = false;
    $('chart').hidden = r.serie.length < 2;
    if (r.serie.length >= 2) { ultimo = [r.serie, r.objetivo]; grafico(r.serie, r.objetivo); }
    calculado = true;
    if (scroll) $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(true); });
  form.addEventListener('change', function () { if (calculado) calcular(false); });
  calcular(false);
})();
