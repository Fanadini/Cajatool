// Tasa de referencia (BCRA), inflación (IPC) y ejemplo calculados en el build
const P = require('./calc.js');
module.exports = ({ data }) => {
  const pf = data.indices.plazoFijo;
  const n = data.indices.ipc.niveles;
  const meses = Object.keys(n).sort();
  const vars = meses.slice(-3).map((m) => (n[m] / n[meses[meses.indexOf(m) - 1]] - 1) * 100);
  const inf = (Math.pow(vars.reduce((a, v) => a * (1 + v / 100), 1), 1 / 3) - 1) * 100;
  const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
  const f = (x) => money.format(x).replace(/ /g, ' ');
  const pct = (x) => x.toFixed(2).replace('.', ',') + ' %';
  const e30 = P.calcular({ capital: 1000000, dias: 30, tna: pf.tna, inflacionMensual: inf });
  const e12 = P.calcular({ capital: 1000000, dias: 30, tna: pf.tna, inflacionMensual: inf, renovar: true, meses: 12 });
  const [y, m, d] = pf.fecha.split('-');
  return {
    pfTna: String(pf.tna),
    pfTnaTxt: pct(pf.tna),
    pfFecha: `${d}/${m}/${y}`,
    pfInflacion: inf.toFixed(2),
    pfInflacionTxt: pct(inf),
    pfTemTxt: pct(pf.tna * 30 / 365),
    pfE30Interes: f(e30.interes),
    pfE30Monto: f(e30.montoFinal),
    pfE30Real: pct(e30.rendimientoReal),
    pfE30Gana: e30.leGana ? 'le gana' : 'no le gana',
    pfE12Monto: f(e12.montoFinal),
    pfE12Tea: pct(e12.tea),
    pfE12Real: pct(e12.rendimientoReal)
  };
};
