const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../data/ev_assistant.db');

let db = null;

const init = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      createTables().then(resolve).catch(reject);
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        is_verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
      });

      // Charging stations table
      db.run(`CREATE TABLE IF NOT EXISTS charging_stations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip_code TEXT,
        latitude REAL,
        longitude REAL,
        connector_type TEXT NOT NULL,
        power_kw REAL,
        availability TEXT DEFAULT 'available',
        owner_id INTEGER NOT NULL,
        is_verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )`, (err) => {
        if (err) {
          console.error('Error creating charging_stations table:', err);
          reject(err);
          return;
        }
      });

      // Create default admin user
      db.get("SELECT * FROM users WHERE role = 'admin'", (err, row) => {
        if (err) {
          console.error('Error checking admin:', err);
          reject(err);
          return;
        }
        if (!row) {
          const defaultPassword = bcrypt.hashSync('admin123', 10);
          db.run(`INSERT INTO users (username, email, password, role, is_verified) 
                  VALUES (?, ?, ?, ?, ?)`,
            ['admin', 'admin@evassistant.com', defaultPassword, 'admin', 1],
            (err) => {
              if (err) {
                console.error('Error creating admin user:', err);
              } else {
                console.log('Default admin user created (username: admin, password: admin123)');
              }
            });
        }
        resolve();
      });
    });
  });
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

module.exports = {
  init,
  getDb
};

