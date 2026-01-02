import path from 'path';
import sqlite3 from 'sqlite3';

function normalizeParams(params) {
  if (params.length === 0) return [];
  if (params.length === 1 && Array.isArray(params[0])) return params[0];
  return params;
}

function createDatabase() {
  const sqlite = sqlite3.verbose();
  const db = new sqlite.Database(path.join(process.cwd(), 'strength-app.db'));

  return {
    exec(sql) {
      return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    },
    run(sql, ...params) {
      const bindings = normalizeParams(params);
      return new Promise((resolve, reject) => {
        db.run(sql, bindings, function (err) {
          if (err) return reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    },
    get(sql, ...params) {
      const bindings = normalizeParams(params);
      return new Promise((resolve, reject) => {
        db.get(sql, bindings, (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });
    },
    all(sql, ...params) {
      const bindings = normalizeParams(params);
      return new Promise((resolve, reject) => {
        db.all(sql, bindings, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });
    }
  };
}

async function seedExercises(database) {
  const exerciseCount = await database.get('SELECT COUNT(*) as count FROM exercises');
  if (exerciseCount?.count) return;

  const exercises = [
    ['Squat', 'Lower Body'],
    ['Bench Press', 'Upper Body'],
    ['Deadlift', 'Lower Body'],
    ['Overhead Press', 'Upper Body'],
    ['Barbell Row', 'Upper Body'],
    ['Pull-ups', 'Upper Body'],
    ['Dips', 'Upper Body'],
    ['Lunges', 'Lower Body'],
    ['Romanian Deadlift', 'Lower Body'],
    ['Incline Bench Press', 'Upper Body']
  ];

  for (const [name, category] of exercises) {
    await database.run('INSERT INTO exercises (name, category) VALUES (?, ?)', [name, category]);
  }
}

async function initializeDatabase(database) {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workout_programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      program_type TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS program_workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER,
      name TEXT NOT NULL,
      day_number INTEGER,
      FOREIGN KEY (program_id) REFERENCES workout_programs(id)
    );

    CREATE TABLE IF NOT EXISTS program_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_workout_id INTEGER,
      exercise_id INTEGER,
      sets INTEGER,
      reps TEXT,
      weight_percentage REAL,
      one_rm REAL,
      notes TEXT,
      exercise_order INTEGER,
      FOREIGN KEY (program_workout_id) REFERENCES program_workouts(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_workout_id INTEGER,
      date DATE NOT NULL,
      notes TEXT,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_workout_id) REFERENCES program_workouts(id)
    );

    CREATE TABLE IF NOT EXISTS exercise_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_log_id INTEGER,
      exercise_id INTEGER,
      set_number INTEGER,
      reps INTEGER,
      weight REAL,
      completed BOOLEAN DEFAULT 1,
      notes TEXT,
      FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    CREATE TABLE IF NOT EXISTS health_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      weight REAL,
      body_fat_percentage REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrations for existing databases
  try {
    await database.exec('ALTER TABLE workout_programs ADD COLUMN is_active BOOLEAN DEFAULT 1');
  } catch (e) {
    // Column might already exist
  }

  try {
    await database.exec('ALTER TABLE program_exercises ADD COLUMN one_rm REAL');
  } catch (e) {
    // Column might already exist
  }

  await seedExercises(database);
}

let databasePromise;

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      try {
        const database = createDatabase();
        await initializeDatabase(database);
        return database;
      } catch (error) {
        // Reset the promise on failure so subsequent calls can retry
        databasePromise = null;
        throw error;
      }
    })();
  }

  return databasePromise;
}
