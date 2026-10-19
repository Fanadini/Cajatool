// Tabla de peso saludable por altura (IMC 18,5 a 24,9), calculada en el build
module.exports = ({ escapeHtml }) => {
  const f = (n) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
  const filas = [];
  for (let cm = 150; cm <= 195; cm += 5) {
    const h = cm / 100;
    filas.push(`<tr><th scope="row">${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(h)} m</th><td>${f(18.5 * h * h)} kg</td><td>${f(24.9 * h * h)} kg</td></tr>`);
  }
  return { imcTabla: '<div class="table-wrap"><table class="data-table"><caption class="visually-hidden">Peso saludable según la altura</caption><thead><tr><th scope="col">Altura</th><th scope="col">Peso mínimo</th><th scope="col">Peso máximo</th></tr></thead><tbody>' + filas.join('') + '</tbody></table></div>' };
};
