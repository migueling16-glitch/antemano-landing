/**
 * Genera supabase/semilla/ryo-durango.sql: lo que la barra real necesita
 * para arrancar, sacado del mismo código de la app (nada se escribe dos veces):
 *   · negocio y sucursal (Barra Durango)
 *   · checklists de apertura, cierre y limpieza profunda (los de las notas de Ryo)
 *   · la máquina, sus botones y canastillas; molinos; los dos cafés; los turnos
 *   · el glosario de la barra y el menú oficial (externo.productos)
 *   · recetas, lecciones y glosario como conocimiento consultable por la IA
 * No trae personas ni datos de operación: el equipo se da de alta desde la
 * app (invitación) y la historia empieza el primer día.
 *
 * Uso: node scripts/ryo-semilla-sql.mjs
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUCURSAL = { id: 'dgo', nombre: 'Barra Durango' };

// Dentro de node_modules para que el paquete resuelva react.
mkdirSync(join(RAIZ, 'node_modules', '.cache'), { recursive: true });
const tmp = mkdtempSync(join(RAIZ, 'node_modules', '.cache', 'ryo-semilla-'));
const entrada = join(tmp, 'entrada.ts');
const ruta = (p) => JSON.stringify(join(RAIZ, p));
writeFileSync(entrada, `
  export { crearSemilla } from ${ruta('src/ryo/app/semilla.ts')};
  export { aFilas } from ${ruta('src/ryo/app/nube/tablas.ts')};
  export { RECETAS, LECCIONES, GLOSARIO } from ${ruta('src/ryo/app/contenido.ts')};
  export { MENU } from ${ruta('src/ryo/config.ts')};
  export { slug } from ${ruta('src/ryo/menuGuia.ts')};
  export { estadoVacio } from ${ruta('src/ryo/app/estado.ts')};
`);
await build({ entryPoints: [entrada], bundle: true, platform: 'node', format: 'esm', outfile: join(tmp, 'app.mjs'), external: ['react'], logLevel: 'error' });
const app = await import(pathToFileURL(join(tmp, 'app.mjs')).href);

/* ─── El catálogo de la barra real, a partir de la semilla de la demo ─── */
const demo = app.crearSemilla();
const real = {
  ...app.estadoVacio(),
  sucursal: { ...demo.sucursal, id: SUCURSAL.id, nombre: SUCURSAL.nombre },
  plantillas: demo.plantillas,
  // Las mediciones de la demo (gramos por botón y quién los midió) no son de la barra real.
  equipos: demo.equipos.map((q) => (q.maquina ? { ...q, maquina: { ...q.maquina, programado: {} } } : q)),
  cafes: demo.cafes.map((c) => ({ ...c, tueste: '' })),
  turnosTipo: demo.turnosTipo,
};
const filas = app.aFilas(real);

/* ─── SQL ─── */
const lit = (v) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  // Listas de texto o números → arreglo de Postgres; lo que lleva objetos → jsonb.
  if (Array.isArray(v) && !v.some((x) => x && typeof x === 'object')) return v.length ? `array[${v.map(lit).join(', ')}]` : `'{}'`;
  if (typeof v === 'object') return `${lit(JSON.stringify(v))}::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
const insertar = (tabla, fila, conflicto = 'do nothing') => {
  const cols = Object.keys(fila);
  return `insert into ${tabla} (${cols.join(', ')}) values (${cols.map((c) => lit(fila[c])).join(', ')}) on conflict ${conflicto};`;
};

const sql = [];
sql.push(`-- Generado por scripts/ryo-semilla-sql.mjs el ${new Date().toISOString().slice(0, 10)}. No editar a mano: cambia la app y vuelve a generar.`);
sql.push('-- Se puede correr varias veces: lo que ya existe no se toca.');
sql.push('begin;');

sql.push('\n-- Negocio y sucursal');
for (const f of filas.negocios) sql.push(insertar('public.negocios', f));
for (const f of filas.sucursales) sql.push(insertar('public.sucursales', f));

for (const t of ['plantillas', 'plantilla_items', 'equipos', 'botones', 'canastillas', 'cafes', 'turnos_tipo']) {
  sql.push(`\n-- ${t}`);
  for (const f of filas[t]) sql.push(insertar(`public.${t}`, f));
}

sql.push('\n-- Tueste: se pone al llegar el primer lote; mientras, la fecha de hoy y la nota.');
sql.push(`update public.cafes set tueste = current_date, notas = 'Origen, proceso, tostador, notas y fecha de tueste por confirmar con el tostador.' where sucursal_id = '${SUCURSAL.id}' and tueste is null;`);

sql.push('\n-- Glosario de la barra');
for (const g of Object.values(app.GLOSARIO)) {
  sql.push(insertar('analitica.glosario', { palabra: g.palabra, que_es: g.que, ejemplo: g.ejemplo ?? null }, '(palabra) do update set que_es = excluded.que_es, ejemplo = excluded.ejemplo'));
}

sql.push('\n-- Menú oficial (Ryo-Menu-Oficial-A5.pdf)');
for (const g of app.MENU) {
  for (const it of g.items) {
    sql.push(insertar('externo.productos', {
      id: app.slug(it.nombre), sucursal_id: SUCURSAL.id, nombre: it.nombre, seccion: g.tab, grupo: g.nombre,
      precio_mxn: it.precio ? Number(it.precio) : null,
      variantes: it.variantes?.length ? it.variantes.map((v) => ({ etiqueta: v.etiqueta, precio_mxn: v.precio ? Number(v.precio) : null })) : null,
      descripcion: it.desc ?? null,
    }, '(id) do update set nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, variantes = excluded.variantes, descripcion = excluded.descripcion'));
  }
}

sql.push('\n-- Conocimiento general (lo puede consultar la IA): recetas, lecciones y glosario');
const doc = (fuente, id, titulo, texto) => insertar('conocimiento.documentos', {
  id: `${fuente}:${id}`, sucursal_id: null, fuente, fuente_id: id, titulo, texto, visibilidad: 'equipo',
}, '(fuente, fuente_id) do update set titulo = excluded.titulo, texto = excluded.texto, embedding = null');
for (const r of app.RECETAS) {
  const partes = [
    `${r.nombre} (${r.categoria})${r.porConfirmar ? ' · receta con cantidades por confirmar' : ''}`,
    r.menu ? `En el menú: ${r.menu}` : '',
    `Vaso: ${r.vaso}. Temperatura: ${r.temperatura}. Tiempo: ${r.tiempo}.`,
    `Cantidades: ${r.gramos.map(([k, v]) => `${k} ${v}`).join('; ')}.`,
    `Pasos: ${r.pasos.map((p, i) => `${i + 1}. ${p}`).join(' ')}`,
    `Estándar: ${r.estandar}`,
    r.frio ? `En frío: ${r.frio.vaso}. ${r.frio.pasos.map((p, i) => `${i + 1}. ${p}`).join(' ')}` : '',
  ];
  sql.push(doc('receta', r.id, r.nombre, partes.filter(Boolean).join('\n')));
}
for (const l of app.LECCIONES) {
  const bloques = l.bloques.map((b) => {
    if (b.tipo === 'texto' || b.tipo === 'clave') return b.texto;
    if (b.tipo === 'ficha') return b.filas.map(([k, v]) => `${k}: ${v}`).join('; ');
    if (b.tipo === 'receta') return `(Receta: ${b.recetaId})`;
    return '';
  });
  const preguntas = l.preguntas.map((q) => `P: ${q.pregunta} R: ${q.respuesta}`);
  sql.push(doc('leccion', l.id, l.titulo, [l.titulo, ...bloques, ...preguntas].filter(Boolean).join('\n')));
}
for (const [k, g] of Object.entries(app.GLOSARIO)) {
  sql.push(doc('glosario', k, g.palabra, `${g.palabra}: ${g.que}${g.ejemplo ? ` Ejemplo: ${g.ejemplo}` : ''}`));
}

sql.push('\ncommit;');

const destino = join(RAIZ, 'supabase', 'semilla', 'ryo-durango.sql');
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, sql.join('\n') + '\n');
rmSync(tmp, { recursive: true, force: true });
console.log(`✓ ${destino}`);
console.log(`  ${Object.entries(filas).filter(([, v]) => v.length).map(([k, v]) => `${k} ${v.length}`).join(' · ')}`);
console.log(`  glosario ${Object.keys(app.GLOSARIO).length} · menú ${app.MENU.reduce((n, g) => n + g.items.length, 0)} · recetas ${app.RECETAS.length} · lecciones ${app.LECCIONES.length}`);
