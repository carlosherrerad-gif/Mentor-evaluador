import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export function openStore(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;`);
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL DEFAULT '',
      district TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','archived')),
      revision INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS project_members (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('admin','editor','reader')),
      PRIMARY KEY(project_id,user_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS invitations (
      token_hash TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      email TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('editor','reader')),
      expires_at INTEGER NOT NULL, created_by TEXT NOT NULL REFERENCES users(id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id), action TEXT NOT NULL,
      detail TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_history_project ON history(project_id,created_at);
    CREATE INDEX IF NOT EXISTS idx_scenarios_project ON scenarios(project_id);
    INSERT OR IGNORE INTO schema_migrations VALUES (1);
  `);
  function transaction(work) {
    db.exec('BEGIN IMMEDIATE');
    try { const result = work(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  function history(projectId, userId, action, detail) {
    db.prepare('INSERT INTO history VALUES (?,?,?,?,?,?)').run(randomUUID(), projectId, userId, action, detail, new Date().toISOString());
  }
  function projectFor(id, userId) {
    return db.prepare(`SELECT p.*, m.role,
      (SELECT count(*) FROM scenarios s WHERE s.project_id=p.id) scenario_count,
      (SELECT count(*) FROM project_members pm WHERE pm.project_id=p.id) member_count
      FROM projects p JOIN project_members m ON m.project_id=p.id WHERE p.id=? AND m.user_id=?`).get(id,userId);
  }
  return { db, transaction, history, projectFor, close: () => db.close() };
}
