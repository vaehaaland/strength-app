const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database('strength-app.db');

// Create tables
db.exec(`
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes

// Exercises
app.get('/api/exercises', (req, res) => {
  const exercises = db.prepare('SELECT * FROM exercises ORDER BY name').all();
  res.json(exercises);
});

app.post('/api/exercises', (req, res) => {
  const { name, category } = req.body;
  const result = db.prepare('INSERT INTO exercises (name, category) VALUES (?, ?)').run(name, category);
  res.json({ id: result.lastInsertRowid, name, category });
});

app.get('/api/exercises/:id', (req, res) => {
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  res.json(exercise);
});

// Workout Programs
app.get('/api/programs', (req, res) => {
  const programs = db.prepare('SELECT * FROM workout_programs ORDER BY created_at DESC').all();
  res.json(programs);
});

app.post('/api/programs', (req, res) => {
  const { name, description, program_type } = req.body;
  const result = db.prepare('INSERT INTO workout_programs (name, description, program_type) VALUES (?, ?, ?)').run(name, description, program_type);
  res.json({ id: result.lastInsertRowid, name, description, program_type });
});

app.get('/api/programs/:id', (req, res) => {
  const program = db.prepare('SELECT * FROM workout_programs WHERE id = ?').get(req.params.id);
  if (!program) return res.status(404).json({ error: 'Program not found' });
  
  const workouts = db.prepare('SELECT * FROM program_workouts WHERE program_id = ? ORDER BY day_number').all(req.params.id);
  
  workouts.forEach(workout => {
    const exercises = db.prepare(`
      SELECT pe.*, e.name as exercise_name, e.category
      FROM program_exercises pe
      JOIN exercises e ON pe.exercise_id = e.id
      WHERE pe.program_workout_id = ?
      ORDER BY pe.exercise_order
    `).all(workout.id);
    workout.exercises = exercises;
  });
  
  program.workouts = workouts;
  res.json(program);
});

app.post('/api/programs/:id/workouts', (req, res) => {
  const { name, day_number } = req.body;
  const result = db.prepare('INSERT INTO program_workouts (program_id, name, day_number) VALUES (?, ?, ?)').run(req.params.id, name, day_number);
  res.json({ id: result.lastInsertRowid, program_id: req.params.id, name, day_number });
});

app.post('/api/program-workouts/:id/exercises', (req, res) => {
  const { exercise_id, sets, reps, weight_percentage, notes, exercise_order } = req.body;
  const result = db.prepare(`
    INSERT INTO program_exercises (program_workout_id, exercise_id, sets, reps, weight_percentage, notes, exercise_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, exercise_id, sets, reps, weight_percentage, notes, exercise_order);
  res.json({ id: result.lastInsertRowid });
});

// Workout Logs
app.get('/api/workout-logs', (req, res) => {
  const logs = db.prepare(`
    SELECT wl.*, pw.name as workout_name, wp.name as program_name
    FROM workout_logs wl
    LEFT JOIN program_workouts pw ON wl.program_workout_id = pw.id
    LEFT JOIN workout_programs wp ON pw.program_id = wp.id
    ORDER BY wl.date DESC
    LIMIT 50
  `).all();
  res.json(logs);
});

app.post('/api/workout-logs', (req, res) => {
  const { program_workout_id, date, notes } = req.body;
  const result = db.prepare('INSERT INTO workout_logs (program_workout_id, date, notes) VALUES (?, ?, ?)').run(program_workout_id, date, notes);
  res.json({ id: result.lastInsertRowid, program_workout_id, date, notes });
});

app.get('/api/workout-logs/:id', (req, res) => {
  const log = db.prepare(`
    SELECT wl.*, pw.name as workout_name, wp.name as program_name
    FROM workout_logs wl
    LEFT JOIN program_workouts pw ON wl.program_workout_id = pw.id
    LEFT JOIN workout_programs wp ON pw.program_id = wp.id
    WHERE wl.id = ?
  `).get(req.params.id);
  
  if (!log) return res.status(404).json({ error: 'Workout log not found' });
  
  const exercises = db.prepare(`
    SELECT el.*, e.name as exercise_name
    FROM exercise_logs el
    JOIN exercises e ON el.exercise_id = e.id
    WHERE el.workout_log_id = ?
    ORDER BY el.exercise_id, el.set_number
  `).all(req.params.id);
  
  log.exercises = exercises;
  res.json(log);
});

app.put('/api/workout-logs/:id', (req, res) => {
  const { completed, notes } = req.body;
  db.prepare('UPDATE workout_logs SET completed = ?, notes = ? WHERE id = ?').run(completed, notes, req.params.id);
  res.json({ id: req.params.id, completed, notes });
});

app.post('/api/workout-logs/:id/exercises', (req, res) => {
  const { exercise_id, set_number, reps, weight, completed, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO exercise_logs (workout_log_id, exercise_id, set_number, reps, weight, completed, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, exercise_id, set_number, reps, weight, completed, notes);
  res.json({ id: result.lastInsertRowid });
});

// Health Stats
app.get('/api/health-stats', (req, res) => {
  const stats = db.prepare('SELECT * FROM health_stats ORDER BY date DESC LIMIT 100').all();
  res.json(stats);
});

app.post('/api/health-stats', (req, res) => {
  const { date, weight, body_fat_percentage, notes } = req.body;
  const result = db.prepare('INSERT INTO health_stats (date, weight, body_fat_percentage, notes) VALUES (?, ?, ?, ?)').run(date, weight, body_fat_percentage, notes);
  res.json({ id: result.lastInsertRowid, date, weight, body_fat_percentage, notes });
});

// Seed some initial data if tables are empty
const exerciseCount = db.prepare('SELECT COUNT(*) as count FROM exercises').get();
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
  
  const insertExercise = db.prepare('INSERT INTO exercises (name, category) VALUES (?, ?)');
  exercises.forEach(([name, category]) => insertExercise.run(name, category));
  
  console.log('Seeded initial exercises');
}

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
