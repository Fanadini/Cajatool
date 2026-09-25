// Montos vigentes de ANSES para el texto, desde data/anses.json
module.exports = ({ data }) => {
  const a = data.anses;
  const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
  const f = (n) => money.format(n).replace(/ /g, ' ');
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const [y, m] = a.vigencia.split('-');
  // Ejemplo: 35 años de aportes, sueldo promedio de $ 1.500.000
  const pbu = a.pbu * 1.05, pc = 1500000 * 0.015 * 35;
  const haber = Math.min(Math.max(pbu + pc, a.haberMinimo), a.haberMaximo);
  return {
    jVig: `${meses[+m - 1]} de ${y}`, jNorma: a.norma, jFuente: a.fuente,
    jMin: f(a.haberMinimo), jMax: f(a.haberMaximo), jPbu: f(a.pbu), jPuam: f(a.puam), jBase: f(a.baseImponibleMaxima),
    jEPbu: f(pbu), jEPc: f(pc), jEHaber: f(haber)
  };
};
