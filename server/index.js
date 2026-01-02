const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const app = express();
const PORT = process.env.PORT || 3000;

let db;
const database = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },
  exec: (sql) => promisify(db.exec.bind(db))(sql)
};

const closeDatabase = () =>
  new Promise((resolve, reject) => {
    if (!db) return resolve();
    db.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

async function initDatabase() {
  db = new sqlite3.Database(path.join(__dirname, '../strength-app.db'));

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

  const exerciseCount = await database.get('SELECT COUNT(*) as count FROM exercises');
  if (exerciseCount.count === 0) {
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
      await database.run('INSERT INTO exercises (name, category) VALUES (?, ?)', name, category);
    }

    console.log('Seeded initial exercises');
  }
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Exercises
app.get('/api/exercises', asyncHandler(async (req, res) => {
  const exercises = await database.all('SELECT * FROM exercises ORDER BY name');
  res.json(exercises);
}));

app.post('/api/exercises', asyncHandler(async (req, res) => {
  const { name, category } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Exercise name is required' });
  }
  const result = await database.run(
    'INSERT INTO exercises (name, category) VALUES (?, ?)',
    name.trim(),
    category
  );
  res.json({ id: result.lastID, name: name.trim(), category });
}));

app.get('/api/exercises/:id', asyncHandler(async (req, res) => {
  const exercise = await database.get('SELECT * FROM exercises WHERE id = ?', req.params.id);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  res.json(exercise);
}));

// Workout Programs
app.get('/api/programs', asyncHandler(async (req, res) => {
  const programs = await database.all('SELECT * FROM workout_programs ORDER BY created_at DESC');
  res.json(programs);
}));

app.post('/api/programs', asyncHandler(async (req, res) => {
  const { name, description, program_type } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Program name is required' });
  }
  const result = await database.run(
    'INSERT INTO workout_programs (name, description, program_type) VALUES (?, ?, ?)',
    name.trim(),
    description,
    program_type
  );
  res.json({ id: result.lastID, name: name.trim(), description, program_type });
}));

app.get('/api/programs/:id', asyncHandler(async (req, res) => {
  const program = await database.get('SELECT * FROM workout_programs WHERE id = ?', req.params.id);
  if (!program) return res.status(404).json({ error: 'Program not found' });

  const workouts = await database.all(
    'SELECT * FROM program_workouts WHERE program_id = ? ORDER BY day_number',
    req.params.id
  );

  for (const workout of workouts) {
    const exercises = await database.all(
      `SELECT pe.*, e.name as exercise_name, e.category
       FROM program_exercises pe
       JOIN exercises e ON pe.exercise_id = e.id
       WHERE pe.program_workout_id = ?
       ORDER BY pe.exercise_order`,
      workout.id
    );
    workout.exercises = exercises;
  }

  program.workouts = workouts;
  res.json(program);
}));

app.post('/api/programs/:id/workouts', asyncHandler(async (req, res) => {
  const { name, day_number } = req.body;
  const result = await database.run(
    'INSERT INTO program_workouts (program_id, name, day_number) VALUES (?, ?, ?)',
    req.params.id,
    name,
    day_number
  );
  res.json({ id: result.lastID, program_id: req.params.id, name, day_number });
}));

app.post('/api/program-workouts/:id/exercises', asyncHandler(async (req, res) => {
  const { exercise_id, sets, reps, weight_percentage, notes, exercise_order } = req.body;
  const result = await database.run(
    `INSERT INTO program_exercises (program_workout_id, exercise_id, sets, reps, weight_percentage, notes, exercise_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    req.params.id,
    exercise_id,
    sets,
    reps,
    weight_percentage,
    notes,
    exercise_order
  );
  res.json({ id: result.lastID });
}));

// Workout Logs
app.get('/api/workout-logs', asyncHandler(async (req, res) => {
  const logs = await database.all(`
    SELECT wl.*, pw.name as workout_name, wp.name as program_name
    FROM workout_logs wl
    LEFT JOIN program_workouts pw ON wl.program_workout_id = pw.id
    LEFT JOIN workout_programs wp ON pw.program_id = wp.id
    ORDER BY wl.date DESC
    LIMIT 50
  `);
  res.json(logs);
}));

app.post('/api/workout-logs', asyncHandler(async (req, res) => {
  const { program_workout_id, date, notes } = req.body;
  const result = await database.run(
    'INSERT INTO workout_logs (program_workout_id, date, notes) VALUES (?, ?, ?)',
    program_workout_id,
    date,
    notes
  );
  res.json({ id: result.lastID, program_workout_id, date, notes });
}));

app.get('/api/workout-logs/:id', asyncHandler(async (req, res) => {
  const log = await database.get(
    `SELECT wl.*, pw.name as workout_name, wp.name as program_name
     FROM workout_logs wl
     LEFT JOIN program_workouts pw ON wl.program_workout_id = pw.id
     LEFT JOIN workout_programs wp ON pw.program_id = wp.id
     WHERE wl.id = ?`,
    req.params.id
  );

  if (!log) return res.status(404).json({ error: 'Workout log not found' });

  const exercises = await database.all(
    `SELECT el.*, e.name as exercise_name
     FROM exercise_logs el
     JOIN exercises e ON el.exercise_id = e.id
     WHERE el.workout_log_id = ?
     ORDER BY el.exercise_id, el.set_number`,
    req.params.id
  );

  log.exercises = exercises;
  res.json(log);
}));

app.put('/api/workout-logs/:id', asyncHandler(async (req, res) => {
  const { completed, notes } = req.body;
  await database.run('UPDATE workout_logs SET completed = ?, notes = ? WHERE id = ?', completed, notes, req.params.id);
  res.json({ id: req.params.id, completed, notes });
}));

app.post('/api/workout-logs/:id/exercises', asyncHandler(async (req, res) => {
  const { exercise_id, set_number, reps, weight, completed, notes } = req.body;
  const result = await database.run(
    `INSERT INTO exercise_logs (workout_log_id, exercise_id, set_number, reps, weight, completed, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    req.params.id,
    exercise_id,
    set_number,
    reps,
    weight,
    completed,
    notes
  );
  res.json({ id: result.lastID });
}));

// Health Stats
app.get('/api/health-stats', asyncHandler(async (req, res) => {
  const stats = await database.all('SELECT * FROM health_stats ORDER BY date DESC LIMIT 100');
  res.json(stats);
}));

app.post('/api/health-stats', asyncHandler(async (req, res) => {
  const { date, weight, body_fat_percentage, notes } = req.body;
  const result = await database.run(
    'INSERT INTO health_stats (date, weight, body_fat_percentage, notes) VALUES (?, ?, ?, ?)',
    date,
    weight,
    body_fat_percentage,
    notes
  );
  res.json({ id: result.lastID, date, weight, body_fat_percentage, notes });
}));

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});
