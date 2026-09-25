const C = require('./calc.js');
module.exports = ({ data }) => {
  const n = data.indices.ipc.niveles, meses = Object.keys(n).sort();
  const ult = meses[meses.length - 1];
  const mes = (ym) => new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(ym + '-15T12:00:00Z'));
  const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
  const f = (x) => money.format(x).replace(/ /g, ' ');
  const y = +ult.slice(0, 4);
  const hace1 = `${y - 1}${ult.slice(4)}`, hace3 = `${y - 3}${ult.slice(4)}`;
  const e1 = C.actualizar({ monto: 100000, desde: hace1, hasta: ult }, n);
  const e3 = C.actualizar({ monto: 100000, desde: hace3, hasta: ult }, n);
  return { ipDesde: meses[0], ipHasta: ult, ipHastaTxt: mes(ult), ipHace1Txt: mes(hace1), ipHace3Txt: mes(hace3),
    ipE1: f(e1.montoActualizado), ipE1Pct: e1.inflacionAcumulada.toFixed(1).replace('.', ','), ipE3: f(e3.montoActualizado), ipE3Pct: e3.inflacionAcumulada.toFixed(1).replace('.', ',') };
};
