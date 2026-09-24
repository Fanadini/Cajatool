// Inflación de referencia calculada en el build a partir del IPC oficial (data/indices.json)
module.exports = ({ data }) => {
  const n = data.indices.ipc.niveles;
  const meses = Object.keys(n).sort();
  const variacion = (m, i) => (n[m] / n[meses[i - 1]] - 1) * 100;
  const ult = (k) => meses.slice(-k).map((m) => variacion(m, meses.indexOf(m)));
  const prom = (vs) => (Math.pow(vs.reduce((a, v) => a * (1 + v / 100), 1), 1 / vs.length) - 1) * 100;
  const fmt = (x) => x.toFixed(2).replace('.', ',');
  const mesTxt = (ym) => new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(ym + '-15T12:00:00Z'));
  const p3 = prom(ult(3));
  const p12 = prom(ult(12));
  const ultimo = ult(1)[0];
  return {
    inflacion3: p3.toFixed(2),
    inflacion12: p12.toFixed(2),
    inflacionUltima: ultimo.toFixed(2),
    inflacion3Txt: fmt(p3),
    inflacion12Txt: fmt(p12),
    inflacionUltimaTxt: fmt(ultimo),
    ipcUltimoMes: mesTxt(meses[meses.length - 1]),
    ipcDesde3: mesTxt(meses[meses.length - 3])
  };
};
