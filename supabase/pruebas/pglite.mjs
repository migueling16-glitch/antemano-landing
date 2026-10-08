/**
 * Banco de pruebas de la base: corre las migraciones en PGlite (Postgres
 * completo en WASM, sin Docker) con imitaciones mínimas de lo que Supabase
 * trae de fábrica (auth, roles, storage, la publicación de Realtime).
 *
 * Uso:  node supabase/pruebas/pglite.mjs
 * Lo usan las pruebas (probar.mjs); no es parte de la app.
 */
import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/vector';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const MIGRACIONES = join(AQUI, '..', 'migrations');

/** Lo que en Supabase ya existe antes de la primera migración. */
const SUPABASE_DE_FABRICA = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant anon, authenticated, service_role to postgres;

  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid(), auth.jwt() to anon, authenticated, service_role;

  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
  $$;

  create publication supabase_realtime;
`;

export async function crearBase({ silencio = false } = {}) {
  const db = await PGlite.create({ extensions: { vector } });
  await db.exec(SUPABASE_DE_FABRICA);
  const archivos = readdirSync(MIGRACIONES).filter((f) => f.endsWith('.sql')).sort();
  for (const f of archivos) {
    try {
      await db.exec(readFileSync(join(MIGRACIONES, f), 'utf8'));
      if (!silencio) console.log(`  ✓ ${f}`);
    } catch (e) {
      console.error(`  ✗ ${f}: ${e.message}`);
      throw e;
    }
  }
  return db;
}

/** Corre una función como una persona con sesión (rol authenticated + su auth.uid). */
export async function como(db, authId, fn) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role authenticated; select set_config('request.jwt.claim.sub', '${authId ?? ''}', true);`);
    return fn(tx);
  });
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('pglite.mjs')) {
  console.log('Migraciones:');
  await crearBase();
  console.log('Listo.');
}
