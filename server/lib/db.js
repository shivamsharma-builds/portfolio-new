import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const { Pool } = pg
let pool
let initialized = false

function createPool() {
  if (pool) return pool

  const rawConnectionString = process.env.DATABASE_URL || process.env.AIVEN_POSTGRES_URL
  if (!rawConnectionString) {
    throw new Error('DATABASE_URL/AIVEN_POSTGRES_URL is not configured.')
  }

  // pg v8 gives SSL query-string options (such as sslmode=require) precedence
  // over the `ssl` object. Remove those options so our explicit TLS settings
  // below are actually used.
  const connectionUrl = new URL(rawConnectionString)
  for (const key of [
    'sslmode',
    'sslcert',
    'sslkey',
    'sslrootcert',
    'uselibpqcompat',
  ]) {
    connectionUrl.searchParams.delete(key)
  }

  const caPath = process.env.AIVEN_POSTGRES_CA_PATH?.trim()
  let ssl

  if (caPath) {
    const resolvedCaPath = path.resolve(caPath)

    if (!fs.existsSync(resolvedCaPath)) {
      throw new Error(`Aiven PostgreSQL CA certificate not found: ${resolvedCaPath}`)
    }

    ssl = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(resolvedCaPath, 'utf8'),
    }
  } else {
    // This keeps local seeding usable when the Aiven CA has not been downloaded.
    // For production, configure AIVEN_POSTGRES_CA_PATH and keep verification on.
    ssl = { rejectUnauthorized: false }
    console.warn(
      'WARNING: AIVEN_POSTGRES_CA_PATH is not configured; PostgreSQL TLS certificate verification is disabled. Configure the Aiven CA certificate for production.'
    )
  }

  pool = new Pool({
    connectionString: connectionUrl.toString(),
    ssl,
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: 30000,
  })

  return pool
}

export async function dbQuery(text, params = []) {
  return createPool().query(text, params)
}

export async function connectDatabase() {
  const client = await createPool().connect()
  client.release()
  return pool
}

export async function initializeDatabase() {
  if (initialized) return
  await connectDatabase()
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS content_items (
      id BIGSERIAL PRIMARY KEY,
      section TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS content_items_section_position_idx ON content_items(section, position, id);
    CREATE TABLE IF NOT EXISTS contact_messages (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(200) NOT NULL,
      subject VARCHAR(200) NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      email_sent BOOLEAN NOT NULL DEFAULT FALSE
    );
    CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON contact_messages(created_at DESC);
    CREATE TABLE IF NOT EXISTS subscribers (
      id BIGSERIAL PRIMARY KEY,
      email VARCHAR(200) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      confirmation_sent BOOLEAN NOT NULL DEFAULT FALSE
    );
    CREATE TABLE IF NOT EXISTS admin_users (
      id BIGSERIAL PRIMARY KEY,
      email VARCHAR(200) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  initialized = true
}
