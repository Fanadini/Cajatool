// Tabla de barrios, período y ejemplo calculados en el build a partir de data/m2-caba.json
const M = require('./calc.js');
module.exports = ({ data, escapeHtml }) => {
  const d = data['m2-caba'];
  const u2 = d.series['2-usado'], u3 = d.series['3-usado'];
  const n0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
  const pct = (x) => (x > 0 ? '+' : '') + x.toFixed(1).replace('.', ',') + ' %';
  const [anio, t] = u2.periodo.split('-T');
  const periodo = `${t}.º trimestre de ${anio}${u2.provisorio ? ' (datos provisorios)' : ''}`;
  const barrios = Object.keys(u2.barrios).filter((b) => b !== 'Total').sort((a, b) => u2.barrios[b].usd - u2.barrios[a].usd);
  const filas = barrios.map((b) => {
    const v2 = u2.barrios[b], v3 = u3.barrios[b];
    const va = v2.anioAnterior ? pct((v2.usd / v2.anioAnterior - 1) * 100) : '—';
    return `<tr><th scope="row">${escapeHtml(b)}</th><td>${n0.format(v2.usd)}</td><td>${v3 ? n0.format(v3.usd) : '—'}</td><td>${va}</td></tr>`;
  }).join('');
  const ej = M.calcular({ precio: 150000, cubierta: 50, semicubierta: 6, descubierta: 4, barrio: 'Palermo', serie: '2-usado' }, d);
  const tot = u2.barrios.Total;
  return {
    m2Periodo: periodo,
    m2Total2: n0.format(tot.usd),
    m2Total3: n0.format(u3.barrios.Total.usd),
    m2TotalVar: pct((tot.usd / tot.anioAnterior - 1) * 100),
    m2Max: `${barrios[0]} (USD ${n0.format(u2.barrios[barrios[0]].usd)})`,
    m2Min: `${barrios[barrios.length - 1]} (USD ${n0.format(u2.barrios[barrios[barrios.length - 1]].usd)})`,
    m2Palermo: n0.format(u2.barrios.Palermo.usd),
    m2EjM2: n0.format(ej.usdM2),
    m2EjDif: pct(ej.diferenciaPct),
    m2EjValor: n0.format(ej.valorEstimado),
    m2Tabla: '<div class="table-wrap"><table class="data-table"><caption class="visually-hidden">Precio del m² por barrio</caption>' +
      '<thead><tr><th scope="col">Barrio</th><th scope="col">2 amb.</th><th scope="col">3 amb.</th><th scope="col">1 año</th></tr></thead>' +
      `<tbody>${filas}</tbody></table></div>`
  };
};
