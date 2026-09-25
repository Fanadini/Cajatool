#!/usr/bin/env python3
"""
Actualiza data/m2-caba.json con el precio promedio de publicación del m² (USD) de departamentos en venta por barrio,
del Instituto de Estadística y Censos de la Ciudad de Buenos Aires (publicación trimestral).
Uso: pip install openpyxl && python3 scripts/actualizar-m2.py
"""
import io, json, datetime, urllib.request, openpyxl, warnings
warnings.filterwarnings('ignore')

BASE = 'https://www.estadisticaciudad.gob.ar/eyc/wp-content/uploads/'
ARCHIVOS = {  # clave: (archivo relativo a BASE, descripción)
    '1-usado': ('2025/01/MI_DVP_AX10.xlsx', '1 ambiente usado'),
    '2-estrenar': ('2026/01/MI_DVP_AX01.xlsx', '2 ambientes a estrenar'),
    '3-estrenar': ('2026/01/MI_DVP_AX02.xlsx', '3 ambientes a estrenar'),
    '2-usado': ('2026/01/MI_DVP_AX03.xlsx', '2 ambientes usados'),
    '3-usado': ('2026/01/MI_DVP_AX04.xlsx', '3 ambientes usados'),
}
TRIM = {'1er. trim.': 1, '2do. trim.': 2, '3er. trim.': 3, '4to. trim.': 4}

def leer(nombre):
    req = urllib.request.Request(BASE + nombre, headers={'User-Agent': 'Mozilla/5.0'})
    wb = openpyxl.load_workbook(io.BytesIO(urllib.request.urlopen(req, timeout=60).read()), data_only=True)
    rows = list(wb.worksheets[0].iter_rows(values_only=True))
    anios, trims = rows[1], rows[2]
    # Columnas: año (celda combinada, se arrastra) + trimestre
    cols, anio = [], None
    for i in range(1, len(trims)):
        if isinstance(anios[i], (int, float)): anio = int(anios[i])
        t = str(trims[i] or '').strip()
        prov = t.endswith('*')  # el asterisco marca datos provisorios
        t = t.rstrip('*').strip()
        if t in TRIM and anio: cols.append((i, anio, TRIM[t], prov))
    ult_i, ult_a, ult_t, ult_prov = cols[-1]
    prev = next((c for c in cols if c[1] == ult_a - 1 and c[2] == ult_t), None)
    datos = {}
    for r in rows[3:]:
        barrio = r[0]
        if not isinstance(barrio, str) or not barrio.strip() or barrio.startswith(('Nota', 'Fuente', '///', '-', '*')): continue
        v = r[ult_i]
        if not isinstance(v, (int, float)): continue
        p = r[prev[0]] if prev and isinstance(r[prev[0]], (int, float)) else None
        datos[barrio.strip()] = {'usd': round(v), 'anioAnterior': round(p) if p else None}
    return f'{ult_a}-T{ult_t}', datos, ult_prov

salida = {
    'actualizado': datetime.date.today().isoformat(),
    'fuente': 'https://www.estadisticaciudad.gob.ar/eyc/categoria-banco-datos/mercado-inmobiliario/',
    'descripcion': 'Precio promedio de publicación del m² (dólares) de departamentos en venta por barrio. Instituto de Estadística y Censos de la Ciudad de Buenos Aires, sobre avisos de Argenprop. Son precios de oferta, no de cierre.',
    'series': {}
}
for clave, (archivo, desc) in ARCHIVOS.items():
    periodo, datos, prov = leer(archivo)
    salida['series'][clave] = {'descripcion': desc, 'periodo': periodo, 'provisorio': prov, 'archivo': BASE + archivo, 'barrios': datos}
    print(f'{desc}: {periodo}, {len(datos)} barrios con dato (Total: {datos.get("Total", {}).get("usd")})')

with open('data/m2-caba.json', 'w', encoding='utf-8') as f:
    json.dump(salida, f, ensure_ascii=False, indent=1)
    f.write('\n')
