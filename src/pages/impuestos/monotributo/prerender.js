// Genera en el build la tabla de categorías vigentes a partir de data/monotributo.json
module.exports = ({ data }) => {
  const m = data.monotributo;
  const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const n0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
  const f = (n) => money.format(n).replace(/ /g, ' ');
  const g = (n) => n0.format(n);
  const filas = m.categorias
    .map((c) =>
      `<tr data-cat="${c.categoria}"><th scope="row">${c.categoria}</th><td>${g(c.ingresosMax)}</td><td>${g(c.total.servicios)}</td><td>${g(c.total.bienes)}</td></tr>`
    )
    .join('');
  const [y, mo, d] = m.vigenciaDesde.split('-');
  return {
    tablaCategorias:
      '<div class="table-wrap"><table class="data-table" id="tabla-categorias"><caption class="visually-hidden">Categorías del monotributo</caption>' +
      '<thead><tr><th scope="col">Cat.</th><th scope="col">Tope anual ($)</th><th scope="col">Servicios ($)</th><th scope="col">Bienes ($)</th></tr></thead>' +
      `<tbody>${filas}</tbody></table></div>`,
    monoVigencia: `${d}/${mo}/${y}`,
    precioUnitarioMax: f(m.precioUnitarioMax)
  };
};
