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
    // Daily challenges table (Theme 4: Virtual Identity & user-scoped daily milestones)
    db.run(`
      CREATE TABLE IF NOT EXISTS daily_challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        challengeDate TEXT NOT NULL,
        completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId, challengeDate),
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

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
        highestLevel INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Safe migration: Add highestLevel to existing users table if missing
    db.run("ALTER TABLE users ADD COLUMN highestLevel INTEGER DEFAULT 0", () => {
      // Ignored if column already exists
    });

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
        level INTEGER DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Safe migration: Add level to existing scores table if missing
    db.run("ALTER TABLE scores ADD COLUMN level INTEGER DEFAULT 1", () => {
      // Ignored if column already exists
    });

    // Safe migration: Align legacy scores with depth thresholds
    db.run("UPDATE scores SET level = 3 WHERE depthReached >= 280 AND (level IS NULL OR level = 1)");
    db.run("UPDATE scores SET level = 2 WHERE depthReached >= 140 AND depthReached < 280 AND (level IS NULL OR level = 1)");
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
