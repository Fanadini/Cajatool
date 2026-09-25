const U = require('./calc.js');
module.exports = ({ data }) => {
  const i = data.indices, n = i.ipc.niveles, m = Object.keys(n).sort();
  const v = m.slice(-3).map((k) => (n[k] / n[m[m.indexOf(k) - 1]] - 1) * 100);
  const inf = (Math.pow(v.reduce((a, x) => a * (1 + x / 100), 1), 1 / 3) - 1) * 100;
  const e = U.comparar({ capital: 1000000, dias: 90, tna: i.plazoFijo.tna, inflacionMensual: inf, tasaUva: 1 });
  const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
  const f = (x) => money.format(x).replace(/ /g, ' '), p = (x) => x.toFixed(2).replace('.', ',') + ' %';
  return { uvTna: String(i.plazoFijo.tna), uvTnaTxt: p(i.plazoFijo.tna), uvInf: inf.toFixed(2), uvInfTxt: p(inf), uvValor: i.uva.valor.toFixed(2).replace('.', ','), uvFecha: i.uva.fecha.split('-').reverse().join('/'),
    uvETr: f(e.tradicional), uvEUva: f(e.uva), uvEq: p(e.inflacionEquilibrio), uvGana: e.conviene === 'uva' ? 'el plazo fijo UVA' : e.conviene === 'tradicional' ? 'el plazo fijo tradicional' : 'prácticamente lo mismo' };
};
