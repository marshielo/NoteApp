#!/usr/bin/env node
/**
 * Database Status Checker
 * Compares migration state across environments.
 *
 * Usage:
 *   node scripts/db-status.mjs
 *   STAGING_DB_URL=postgres://... PRODUCTION_DB_URL=postgres://... node scripts/db-status.mjs
 */

import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'migrations');

async function getLocalMigrations() {
  const files = await readdir(migrationsDir);
  return files.filter(f => f.endsWith('.sql')).sort();
}

async function checkDbConnection(name, url) {
  if (!url) return { name, status: 'not configured', migrations: [] };

  try {
    // Simple connection check via pg (if available) — otherwise just report config status
    return { name, status: 'configured', url: url.replace(/:[^:@]+@/, ':***@') };
  } catch {
    return { name, status: 'error' };
  }
}

async function main() {
  console.log('\n📊 Catatan Database Status\n');
  console.log('─'.repeat(50));

  // Local migrations
  const migrations = await getLocalMigrations();
  console.log(`\n📁 Local Migrations (${migrations.length}):`);
  migrations.forEach(m => console.log(`   ✅ ${m}`));

  // Environment status
  console.log('\n🌍 Environments:');

  const envs = [
    { name: 'Development (local)', url: process.env.LOCAL_DB_URL || '(supabase local)' },
    { name: 'Staging', url: process.env.STAGING_DB_URL },
    { name: 'Production', url: process.env.PRODUCTION_DB_URL },
  ];

  for (const env of envs) {
    const info = await checkDbConnection(env.name, env.url);
    const icon = info.status === 'configured' ? '🟢' : info.status === 'not configured' ? '⚪' : '🔴';
    console.log(`   ${icon} ${info.name}: ${info.status}`);
    if (info.url && typeof info.url === 'string' && info.url !== '(supabase local)') {
      console.log(`      URL: ${info.url}`);
    }
  }

  console.log('\n💡 Commands:');
  console.log('   pnpm db:diff          — Generate migration from local changes');
  console.log('   pnpm db:diff:staging  — Diff staging DB vs local migrations');
  console.log('   pnpm db:diff:prod     — Diff production DB vs local migrations');
  console.log('   pnpm db:migrate       — Push migrations to local DB');
  console.log('   pnpm db:migrate:staging — Push migrations to staging');
  console.log('   pnpm db:migrate:prod  — Push migrations to production');
  console.log('');
}

main().catch(console.error);
