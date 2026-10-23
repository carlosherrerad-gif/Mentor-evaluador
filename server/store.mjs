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
  // Migración aditiva: conserva proyectos, cuentas e historial existentes.
  db.exec('BEGIN IMMEDIATE');
  try {
    const add=(table,name,definition)=>{
      if (!db.prepare(`PRAGMA table_info(${table})`).all().some(column=>column.name===name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
    };
    for (const name of ['region','province','responsible','description']) add('projects',name,"TEXT NOT NULL DEFAULT ''");
    add('projects','deleted_at','TEXT');
    add('projects','land_json',"TEXT NOT NULL DEFAULT '{}'");
    add('projects','urban_config_json',"TEXT NOT NULL DEFAULT '{}'");
    add('scenarios','status',"TEXT NOT NULL DEFAULT 'active'");
    add('scenarios','deleted_at','TEXT');
    add('scenarios','configuration_json',"TEXT NOT NULL DEFAULT '{}'");
    add('scenarios','economics_json',"TEXT NOT NULL DEFAULT '{}'");
    add('scenarios','source_template_json','TEXT');
    db.exec(`CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), category TEXT NOT NULL CHECK(category IN ('building','urban')),
      name TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS template_versions (
      template_id TEXT NOT NULL REFERENCES templates(id), version INTEGER NOT NULL,
      config_json TEXT NOT NULL, note TEXT NOT NULL, created_at TEXT NOT NULL,
      PRIMARY KEY(template_id,version)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS market_references (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), previous_id TEXT REFERENCES market_references(id),
      version INTEGER NOT NULL, data_json TEXT NOT NULL, created_at TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0
    ) STRICT;
    INSERT OR IGNORE INTO schema_migrations VALUES (2);
    INSERT OR IGNORE INTO schema_migrations VALUES (3);`);
    db.exec('COMMIT');
  } catch(error) { db.exec('ROLLBACK');db.close();throw error; }
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
      (SELECT count(*) FROM scenarios s WHERE s.project_id=p.id AND s.deleted_at IS NULL) scenario_count,
      (SELECT count(*) FROM project_members pm WHERE pm.project_id=p.id) member_count
      FROM projects p JOIN project_members m ON m.project_id=p.id WHERE p.id=? AND m.user_id=?`).get(id,userId);
  }
  return { db, transaction, history, projectFor, close: () => db.close() };
}
