import Database from "better-sqlite3";

function createDb() {
  const db = new Database("database.db");
  db.pragma("journal_mode = WAL");
  return db;
}

export const db = createDb();
