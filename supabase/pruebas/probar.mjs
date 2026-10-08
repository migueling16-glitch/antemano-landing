/**
 * Pruebas de la base de la app de barra, sin tocar Supabase:
 *   1. La traducción app ↔ tablas no pierde nada (ida y vuelta).
 *   2. Los datos de ejemplo de la app entran en las tablas (tipos, llaves, reglas).
 *   3. Permisos: qué ve y qué puede hacer cada rol (y alguien de fuera).
 *   4. Reglas del servidor: quién valida, aprueba, retira.
 *   5. Historia (eventos), vistas de análisis y métricas: las métricas en SQL
 *      dan lo mismo que el Panel de la app.
 *   6. Herramientas para la IA: describir_datos, consultar_analitica (solo
 *      lectura y con permisos) y buscar_conocimiento.
 *
 * Uso: node supabase/pruebas/probar.mjs
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { crearBase, como } from './pglite.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let fallas = 0;
const ok = (cond, texto, detalle) => {
  console.log(`  ${cond ? '✓' : '✗'} ${texto}${!cond && detalle !== undefined ? `\n      ${JSON.stringify(detalle).slice(0, 600)}` : ''}`);
  if (!cond) fallas++;
};
const falla = async (fn) => { try { await fn(); return null; } catch (e) { return e.message; } };

/* ─── La app, empaquetada para Node ─── */
// Dentro de node_modules para que el paquete resuelva react.
mkdirSync(join(RAIZ, 'node_modules', '.cache'), { recursive: true });
const tmp = mkdtempSync(join(RAIZ, 'node_modules', '.cache', 'ryo-pruebas-'));
const entrada = join(tmp, 'entrada.ts');
const { writeFileSync } = await import('node:fs');
writeFileSync(entrada, `
  export { crearSemilla } from ${JSON.stringify(join(RAIZ, 'src/ryo/app/semilla.ts'))};
  export { aFilas, deFilas, diferencias, aplicar, TABLAS, llaveDe } from ${JSON.stringify(join(RAIZ, 'src/ryo/app/nube/tablas.ts'))};
  export { indicadores } from ${JSON.stringify(join(RAIZ, 'src/ryo/app/lib/indicadores.ts'))};
  export { jornadaDe, sumarDias } from ${JSON.stringify(join(RAIZ, 'src/ryo/app/lib/tiempo.ts'))};
`);
await build({ entryPoints: [entrada], bundle: true, platform: 'node', format: 'esm', outfile: join(tmp, 'app.mjs'), external: ['react'], logLevel: 'error' });
const app = await import(pathToFileURL(join(tmp, 'app.mjs')).href);

/* ═══ 1. Ida y vuelta ═══ */
console.log('\n1. App ↔ tablas');
const e = app.crearSemilla();
const local = { v: e.v, usuarioId: null, tema: e.tema };
const filas = app.aFilas(e);
const e2 = app.deFilas(filas, local);
const sinVacios = (x) => JSON.parse(JSON.stringify(x, (k, v) => (v === undefined || v === false ? undefined : v)));
const ordenado = (x) => (Array.isArray(x) ? x.map(ordenado) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, ordenado(x[k])])) : x);
// Al volver de la base cada persona trae su progreso, aunque esté vacío: vacío = sin registro.
const sinProgresoVacio = (p) => Object.fromEntries(Object.entries(p).filter(([, x]) => Object.keys(x.lecciones).length || Object.keys(x.repaso).length || Object.keys(x.evaluaciones).length || x.asignadas.length));
for (const k of Object.keys(e)) {
  const [a, b] = k === 'progreso' ? [sinProgresoVacio(e[k]), sinProgresoVacio(e2[k])] : [e[k], e2[k]];
  ok(isDeepStrictEqual(ordenado(sinVacios(a)), ordenado(sinVacios(b))), `"${k}" sobrevive la ida y vuelta`, { app: sinVacios(a), vuelta: sinVacios(b) });
}
const filas2 = app.aFilas(e2);
ok(app.diferencias(filas, filas2).length === 0, 'Releer lo leído no genera cambios', app.diferencias(filas, filas2).slice(0, 3));
const total = Object.values(filas).reduce((n, xs) => n + xs.length, 0);
console.log(`     ${total} filas en ${Object.keys(filas).length} tablas`);

// Un cambio típico genera solo su operación
const e3 = structuredClone(e2);
const ej = e3.ejecuciones.find((x) => !x.validadaEn && x.completadaEn);
ej.validadaPor = 'u-carla'; ej.validadaEn = Date.now();
const ops = app.diferencias(filas2, app.aFilas(e3));
ok(ops.length === 1 && ops[0].tabla === 'ejecuciones' && ops[0].tipo === 'subir', 'Validar un checklist = 1 operación', ops);
const e4 = structuredClone(e2);
e4.plantillas[0].items.pop();
const opsRetiro = app.diferencias(filas2, app.aFilas(e4));
ok(opsRetiro.some((o) => o.tabla === 'plantilla_items' && o.tipo === 'retirar'), 'Quitar una tarea del checklist la retira (no la borra)', opsRetiro);

/* ═══ 2. Los datos entran ═══ */
console.log('\n2. Migraciones y datos de ejemplo');
const db = await crearBase({ silencio: true });
console.log('  ✓ 6 migraciones aplicadas');
const desde = app.sumarDias(app.jornadaDe(), -30);
filas.sucursales[0].inicio_operacion = desde;
for (const p of filas.plantillas) p.vigente_desde = desde;
for (const def of app.TABLAS) {
  for (const f of filas[def.tabla]) {
    const cols = Object.keys(f);
    await db.query(`insert into public.${def.tabla} (${cols.join(', ')}) values (${cols.map((_, i) => `$${i + 1}`).join(', ')})`, cols.map((c) => f[c]));
  }
}
ok(true, `${total} filas insertadas sin violar llaves ni reglas`);

// Las cuentas: al crearse, se ligan solas a su persona por correo.
const CUENTA = {
  ana: '00000000-0000-0000-0000-00000000000a', diego: '00000000-0000-0000-0000-00000000000d',
  carla: '00000000-0000-0000-0000-00000000000c', sofia: '00000000-0000-0000-0000-000000000005',
  fuera: '00000000-0000-0000-0000-0000000000ff',
};
for (const [quien, id] of Object.entries(CUENTA)) {
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, `${quien.toUpperCase()}@ryocafe.mx`]);
}
const ligadas = (await db.query('select count(*)::int as n from public.personas where auth_id is not null')).rows[0].n;
ok(ligadas === 4, 'Las 4 cuentas se ligaron solas a su persona por correo (sin importar mayúsculas)', ligadas);

// Antes de que las pruebas cambien datos.
console.log('\n   Métricas en SQL contra el Panel de la app (mismos datos, últimos 7 días):');
const hoy = app.jornadaDe();
const delPanel = Object.fromEntries(app.indicadores(e, hoy).map((i) => [i.id, i.valor]));
const enSql = await como(db, CUENTA.carla, async (tx) => (await tx.query(`select public.metricas_periodo('s-durango', $1::date, $2::date) as m`, [app.sumarDias(hoy, -6), hoy])).rows[0].m);
const sql = Object.fromEntries(enSql.map((m) => [m.id, m.valor == null ? NaN : Number(m.valor)]));
const pares = [['a-tiempo', 'checklists-a-tiempo', 0.15], ['validar', 'horas-para-validar', 0.02], ['incidencias', 'incidencias-nuevas', 0], ['shots', 'shots-por-receta', 0.06], ['huecos', 'horas-sin-nadie', 0.01], ['repasos', 'repasos-al-dia', 0.15]];
for (const [panel, metrica, tol] of pares) {
  const a = delPanel[panel], b = sql[metrica];
  const igual = (Number.isNaN(a) && Number.isNaN(b)) || Math.abs(a - b) <= Math.max(tol, Math.abs(a) * 0.002);
  ok(igual, `${metrica}: SQL ${Number.isNaN(b) ? 'sin datos' : b} · Panel ${Number.isNaN(a) ? 'sin datos' : Math.round(a * 100) / 100}`);
}


/* ═══ 3. Permisos ═══ */
console.log('\n3. Qué ve cada quien');
const cuenta = (tx, sql) => tx.query(sql).then((r) => r.rows[0].n);
await como(db, CUENTA.fuera, async (tx) => {
  ok(await cuenta(tx, 'select count(*)::int n from public.personas') === 0, 'Una cuenta sin persona no ve a nadie');
  ok(await cuenta(tx, 'select count(*)::int n from public.ejecuciones') === 0, 'Ni los checklists');
  ok(await cuenta(tx, 'select count(*)::int n from analitica.resumen_dia') === 0, 'Ni el análisis');
});
const ausTotal = filas.ausencias.length;
const ausAna = filas.ausencias.filter((a) => a.persona_id === 'u-ana').length;
await como(db, CUENTA.ana, async (tx) => {
  ok(await cuenta(tx, 'select count(*)::int n from public.personas') === 4, 'Ana (barista) ve al equipo');
  ok(await cuenta(tx, 'select count(*)::int n from public.ausencias') === ausAna, `Ana ve solo sus ausencias con motivo (${ausAna} de ${ausTotal})`);
  ok(await cuenta(tx, 'select count(*)::int n from public.ausencias_equipo') >= ausAna, 'Y las del equipo, sin motivo, para cubrir turnos');
  ok(await cuenta(tx, 'select count(*)::int n from public.eventos') === 0, 'No ve la historia (es de encargados)');
  const borradores = filas.semanas.filter((w) => w.estado === 'borrador').length;
  ok(await cuenta(tx, 'select count(*)::int n from public.semanas') === filas.semanas.length - borradores, 'No ve semanas en borrador');
});
await como(db, CUENTA.carla, async (tx) => {
  ok(await cuenta(tx, 'select count(*)::int n from public.ausencias') === ausTotal, 'Carla (encargada) ve todas las ausencias');
  ok(await cuenta(tx, 'select count(*)::int n from public.semanas') === filas.semanas.length, 'Y las semanas en borrador');
});

/* ═══ 4. Reglas del servidor ═══ */
console.log('\n4. Reglas que la app no puede saltarse');
const sinValidar = filas.ejecuciones.find((x) => x.completada_en && !x.validada_en);
const errAna = await falla(() => como(db, CUENTA.ana, (tx) => tx.query(`update public.ejecuciones set validada_por = 'u-ana', validada_en = now() where id = $1`, [sinValidar.id])));
ok(errAna?.includes('Solo un encargado'), 'Una barista no puede validar un checklist', errAna);
const errPlantilla = await falla(() => como(db, CUENTA.ana, (tx) => tx.query(`insert into public.plantillas (id, sucursal_id, nombre, frecuencia, hora_limite) values ('p-x', 's-durango', 'X', 'diaria', '10:00')`)));
ok(!!errPlantilla, 'Ni crear checklists (catálogo de encargados)', errPlantilla);
const cambio = filas.cambios_turno.find((c) => c.estado === 'aceptado');
const errAprobar = await falla(() => como(db, CUENTA.diego, (tx) => tx.query(`update public.cambios_turno set estado = 'aprobado' where id = $1`, [cambio.id])));
ok(errAprobar?.includes('Solo un encargado'), 'Ni aprobar un cambio de turno', errAprobar);
const errRol = await falla(() => como(db, CUENTA.carla, (tx) => tx.query(`update public.personas set rol = 'admin' where id = 'u-diego'`)));
ok(errRol?.includes('Solo un admin'), 'Una encargada no puede cambiar roles (solo admin)', errRol);
const errFuera = await falla(() => como(db, CUENTA.fuera, (tx) => tx.query(`insert into public.bitacora (id, sucursal_id, jornada, categoria, texto, escrita_por, escrita_en) values ('b-x', 's-durango', current_date, 'otro', 'hola', 'u-ana', now())`)));
ok(!!errFuera, 'Alguien de fuera no puede escribir', errFuera);
const errMarca = await falla(() => como(db, CUENTA.ana, (tx) => tx.query(`insert into public.marcas (ejecucion_id, item_id, sucursal_id, marcada_por, marcada_en) values ($1, 'x-prueba', 's-durango', 'u-ana', now())`, [sinValidar.id])));
ok(errMarca === null, 'Una barista sí marca tareas', errMarca);
const errValida = await falla(() => como(db, CUENTA.carla, (tx) => tx.query(`update public.ejecuciones set validada_por = 'u-carla', validada_en = now() where id = $1`, [sinValidar.id])));
ok(errValida === null, 'Y una encargada sí valida', errValida);

/* ═══ 5. Historia, vistas y métricas ═══ */
console.log('\n5. Historia, análisis y métricas');
await como(db, CUENTA.carla, async (tx) => {
  const ev = (await tx.query(`select accion, actor_persona, cambios from public.eventos where tabla = 'ejecuciones' and registro = $1 order by id desc limit 1`, [sinValidar.id])).rows[0];
  ok(ev?.accion === 'cambio' && ev.actor_persona === 'u-carla' && ev.cambios?.validada_por?.despues === 'u-carla', 'La validación quedó en la historia: quién, qué cambió, antes y después', ev);
  const vistas = (await tx.query(`select table_name from information_schema.views where table_schema = 'analitica' order by 1`)).rows.map((r) => r.table_name);
  for (const v of vistas) {
    const n = (await tx.query(`select count(*)::int n from analitica.${v}`)).rows[0].n;
    ok(n > 0, `analitica.${v}: ${n} filas`);
  }
});

/* ═══ 6. Herramientas para la IA ═══ */
console.log('\n6. Herramientas para la IA');
await como(db, CUENTA.carla, async (tx) => {
  const mapa = (await tx.query('select public.describir_datos() as d')).rows[0].d;
  const sinComentario = mapa.vistas.flatMap((v) => (v.que_es ? [] : [v.nombre]));
  ok(mapa.vistas.length >= 15 && sinComentario.length === 0, `describir_datos: ${mapa.vistas.length} vistas, todas explicadas, ${mapa.metricas.length} métricas`, sinComentario);
  const r = (await tx.query(`select public.consultar_analitica($1) as r`, [
    `select barista, round(avg(shots), 1) as shots_promedio, count(*) as calibraciones from analitica.calibraciones where aprobada group by barista order by 2`,
  ])).rows[0].r;
  ok(Array.isArray(r) && r.length > 0, `consultar_analitica responde una pregunta cruzada: ${r.map((x) => `${x.barista} ${x.shots_promedio}`).join(' · ')}`);
  // Las consultas de ejemplo de supabase/README.md tienen que funcionar.
  const ej1 = (await tx.query(`select barista, dias_reposo, round(avg(shots), 1) as shots from analitica.calibraciones where es_casa and aprobada group by 1, 2 order by 2, 3`)).rows;
  ok(ej1.length > 0, `README, ejemplo 1 (shots por barista y reposo): ${ej1.length} filas`);
  const ej2 = (await tx.query(`select m.jornada, m.valor, m.unidad, m.marcada_por, string_agg(t.persona, ', ') as en_turno from analitica.marcas m left join analitica.turnos t on t.fecha = m.jornada where m.fuera_de_rango group by 1, 2, 3, 4 order by 1 desc`)).rows;
  ok(ej2.length > 0, `README, ejemplo 2 (refri fuera de rango y quién estaba): ${ej2.map((x) => `${x.valor} ${x.unidad} · ${x.en_turno ?? 'sin turno publicado'}`).join(' | ')}`);
  const b = (await tx.query(`select public.buscar_conocimiento('temperatura refri') as r`)).rows[0].r;
  ok(b.length > 0, `buscar_conocimiento("temperatura refri"): ${b.length} resultados · ${b.map((x) => x.fuente).join(', ')}`);
  const raiz = (await tx.query(`select public.buscar_conocimiento('técnicos') as r`)).rows[0].r;
  ok(raiz.length > 0, `Busca por raíz y sin acentos: "técnicos" encuentra "técnico" (${raiz.length})`);
});
const errEscribe = await falla(() => como(db, CUENTA.carla, (tx) => tx.query(`select public.consultar_analitica($1)`, [`with x as (delete from public.bitacora returning 1) select * from x`])));
ok(!!errEscribe, `consultar_analitica no deja escribir ni borrar ("${errEscribe}")`);
const errDos = await falla(() => como(db, CUENTA.carla, (tx) => tx.query(`select public.consultar_analitica($1)`, [`select 1; drop table public.bitacora`])));
ok(!!errDos, `ni encadenar consultas ("${errDos}")`);
const bitacoraSigue = (await db.query('select count(*)::int n from public.bitacora')).rows[0].n;
ok(bitacoraSigue === filas.bitacora.length, 'La bitácora sigue intacta');
await como(db, CUENTA.ana, async (tx) => {
  const r = (await tx.query(`select public.consultar_analitica($1) as r`, ['select count(*) as n from analitica.ausencias'])).rows[0].r;
  ok(r[0].n === ausAna, 'La IA ve con los permisos de quien pregunta (Ana: solo sus ausencias)', r);
});

rmSync(tmp, { recursive: true, force: true });
console.log(fallas ? `\n✗ ${fallas} prueba(s) fallaron` : '\n✓ Todo bien');
process.exit(fallas ? 1 : 0);
