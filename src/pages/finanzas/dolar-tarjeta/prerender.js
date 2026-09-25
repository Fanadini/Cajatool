// Tipo de cambio de referencia (BCRA) y ejemplo calculados en el build
const D = require('./calc.js');
module.exports = ({ data }) => {
  const usd = data.indices.dolar;
  const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
  const f = (x) => money.format(x).replace(/ /g, ' ');
  const e = D.calcular({ usd: 10, tipoCambio: usd.valor, digital: true, iibb: 2 });
  const [y, m, d] = usd.fecha.split('-');
  return {
    dtTc: String(usd.valor), dtTcTxt: f(usd.valor), dtFecha: `${d}/${m}/${y}`,
    dtBase: f(e.base), dtIva: f(e.iva), dtPerc: f(e.percepcion), dtIibb: f(e.iibb), dtTotal: f(e.total), dtEfectivo: f(e.dolarEfectivo)
  };
};
