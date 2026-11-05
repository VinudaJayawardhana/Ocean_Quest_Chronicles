const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// DB_PATH lets the automated tests use a temporary database instead of your real one.
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../ocean_quest.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log(`Connected to SQLite database at ${dbPath}`);
    initializeTables();
  }
});

function initializeTables() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        callsign TEXT DEFAULT 'Ocean Diver',
        avatarUrl TEXT DEFAULT 'assets/sprites/diver.png',
        country TEXT DEFAULT 'Unknown',
        city TEXT DEFAULT 'Unknown',
        ip TEXT DEFAULT '',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Scores table
    db.run(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        username TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        depthReached INTEGER DEFAULT 0,
        chestsCollected INTEGER DEFAULT 0,
        country TEXT DEFAULT 'Unknown',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);
  });
}

// Promise-based helpers for easy async/await usage
db.queryGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

db.queryRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

module.exports = db;
