const C = require('./calc.js');
module.exports = ({ data, escapeHtml }) => {
  // Próximo feriado a la fecha del build (el script lo recalcula en el navegador); evita el salto de diseño
  const todos = [].concat(...Object.values(data.feriados.anios));
  const d = new Date(), hoy = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const largo = (iso) => new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
  const prox = C.proximos(hoy, todos, 3);
  const proxMain = prox.length ? largo(prox[0].fecha) + (prox[0].faltan === 0 ? ' (¡hoy!)' : ' · faltan ' + prox[0].faltan + (prox[0].faltan === 1 ? ' día' : ' días')) : 'Sin datos del próximo año todavía';
  const proxSig = prox.length ? prox[0].nombre + (prox.length > 1 ? '. Después: ' + prox.slice(1).map((p) => largo(p.fecha).replace(/ de \d{4}$/, '') + ' (' + p.nombre + ')').join('; ') + '.' : '.') : '';
  const l = data.feriados.anios['2026'].filter((f) => f.fecha.startsWith('2026'));
  const fmt = (iso) => new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
  const tipo = { inamovible: 'Inamovible', trasladable: 'Trasladable', turistico: 'No laborable turístico', no_laborable: 'No laborable (religioso)' };
  const generales = l.filter((f) => f.tipo !== 'no_laborable');
  const filas = generales.map((f) => `<tr><th scope="row">${fmt(f.fecha)}</th><td>${escapeHtml(f.nombre)}</td><td>${tipo[f.tipo]}</td></tr>`).join('');
  const rel = l.filter((f) => f.tipo === 'no_laborable').map((f) => `${fmt(f.fecha)}: ${escapeHtml(f.nombre)}`).join('; ');
  return { proxMain: escapeHtml(proxMain), proxSig: escapeHtml(proxSig), ferTabla: `<div class="table-wrap"><table class="data-table"><caption class="visually-hidden">Feriados nacionales 2026</caption><thead><tr><th scope="col">Fecha</th><th scope="col">Motivo</th><th scope="col">Tipo</th></tr></thead><tbody>${filas}</tbody></table></div>`,
    ferCantidad: String(generales.filter((f) => f.tipo !== 'turistico').length), ferTuristicos: String(generales.filter((f) => f.tipo === 'turistico').length), ferReligiosos: rel };
};
