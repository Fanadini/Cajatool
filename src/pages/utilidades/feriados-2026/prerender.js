module.exports = ({ data, escapeHtml }) => {
  const l = data.feriados.anios['2026'].filter((f) => f.fecha.startsWith('2026'));
  const fmt = (iso) => new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
  const tipo = { inamovible: 'Inamovible', trasladable: 'Trasladable', turistico: 'No laborable turístico', no_laborable: 'No laborable (religioso)' };
  const generales = l.filter((f) => f.tipo !== 'no_laborable');
  const filas = generales.map((f) => `<tr><th scope="row">${fmt(f.fecha)}</th><td>${escapeHtml(f.nombre)}</td><td>${tipo[f.tipo]}</td></tr>`).join('');
  const rel = l.filter((f) => f.tipo === 'no_laborable').map((f) => `${fmt(f.fecha)}: ${escapeHtml(f.nombre)}`).join('; ');
  return { ferTabla: `<div class="table-wrap"><table class="data-table"><caption class="visually-hidden">Feriados nacionales 2026</caption><thead><tr><th scope="col">Fecha</th><th scope="col">Motivo</th><th scope="col">Tipo</th></tr></thead><tbody>${filas}</tbody></table></div>`,
    ferCantidad: String(generales.filter((f) => f.tipo !== 'turistico').length), ferTuristicos: String(generales.filter((f) => f.tipo === 'turistico').length), ferReligiosos: rel };
};
