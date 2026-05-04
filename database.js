const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let rawDb = null;
const dbPath = path.resolve(__dirname, process.env.DB_PATH || './database.sqlite');

// Wrapper that mimics better-sqlite3 API
const db = {
  async init() {
    const SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
      const buf = fs.readFileSync(dbPath);
      rawDb = new SQL.Database(buf);
    } else {
      rawDb = new SQL.Database();
    }

    rawDb.run("PRAGMA foreign_keys = ON");

    rawDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
        phone TEXT,
        avatar TEXT DEFAULT '',
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'pending')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS teacher_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        bio TEXT DEFAULT '',
        hourly_rate REAL DEFAULT 0,
        experience_years INTEGER DEFAULT 0,
        subjects TEXT DEFAULT '[]',
        availability TEXT DEFAULT '{}',
        rating REAL DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        total_students INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        location TEXT DEFAULT '',
        education TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
        notes TEXT DEFAULT '',
        total_price REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log('Database initialized');
    this.save();
    // Auto-save every 5 seconds
    setInterval(() => this.save(), 5000);
  },

  save() {
    if (!rawDb) return;
    const data = rawDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  },

  prepare(sql) {
    return {
      run(...params) {
        rawDb.run(sql, params);
        const lid = rawDb.exec("SELECT last_insert_rowid() as id");
        const lastId = lid.length ? lid[0].values[0][0] : 0;
        const changes = rawDb.getRowsModified();
        db.save();
        return { lastInsertRowid: lastId, changes };
      },
      get(...params) {
        try {
          const stmt = rawDb.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            const obj = {};
            cols.forEach((c, i) => obj[c] = vals[i]);
            stmt.free();
            return obj;
          }
          stmt.free();
          return undefined;
        } catch (e) {
          return undefined;
        }
      },
      all(...params) {
        try {
          const stmt = rawDb.prepare(sql);
          stmt.bind(params);
          const results = [];
          while (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            const obj = {};
            cols.forEach((c, i) => obj[c] = vals[i]);
            results.push(obj);
          }
          stmt.free();
          return results;
        } catch (e) {
          return [];
        }
      }
    };
  },

  exec(sql) {
    rawDb.exec(sql);
    this.save();
  }
};

module.exports = db;
