import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from '../config.js';
import * as schema from './schema.js';

const precisaSsl = /sslmode=require/.test(config.databaseUrl);

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: precisaSsl ? { rejectUnauthorized: true } : undefined,
  max: 5,
});

export const db = drizzle(pool, { schema });
export type Db = typeof db;
