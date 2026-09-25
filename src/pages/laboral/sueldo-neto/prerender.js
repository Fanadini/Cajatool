// Ejemplos y valores del texto calculados en el build con los datos vigentes (data/ganancias.json)
const S = require('./calc.js');
module.exports = ({ data }) => {
  const g = data.ganancias;
  const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
  const f = (n) => money.format(n).replace(/ /g, ' ');
  const tope = g.topeAportes[g.topeAportes.length - 1];
  const mes = tope.desde;
  const ej1 = S.calcular({ bruto: 1500000, mes }, g);
  const ej2 = S.calcular({ bruto: 5000000, mes }, g);
  const ej3 = S.calcular({ bruto: 5000000, mes, conyuge: true, hijos: 2 }, g);
  const [ty, tm] = tope.desde.split('-');
  return {
    snTope: f(tope.monto),
    snTopeDesde: new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+ty, +tm - 1, 15))),
    snTopeNorma: tope.norma,
    snTopeUrl: tope.fuente,
    snUmbral: f(ej1.umbral),
    snUmbralFamilia: f(S.calcular({ bruto: 1, mes, conyuge: true, hijos: 2 }, g).umbral),
    snMni: f(g.deducciones.gananciaNoImponible),
    snEspecial: f(g.deducciones.especialRelacionDependencia),
    snConyuge: f(g.deducciones.conyuge),
    snHijo: f(g.deducciones.hijo),
    snVigencia: g.vigencia.toLowerCase(),
    snEscalaUrl: g.fuentes.escala,
    snDeduccionesUrl: g.fuentes.deducciones,
    ej1Neto: f(ej1.neto),
    ej1Aportes: f(ej1.totalAportes),
    ej2Aportes: f(ej2.totalAportes),
    ej2Retencion: f(ej2.retencion),
    ej2Neto: f(ej2.neto),
    ej2Alicuota: String(ej2.alicuotaMarginal),
    ej3Retencion: f(ej3.retencion),
    ej3Neto: f(ej3.neto)
  };
};
