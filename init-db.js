const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'prisma', 'dev.db')
const db = new Database(dbPath)

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS Exercise (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    deletedAt DATETIME
  );

  CREATE TABLE IF NOT EXISTS Workout (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    deletedAt DATETIME
  );

  CREATE TABLE IF NOT EXISTS WorkoutExercise (
    id TEXT PRIMARY KEY,
    workoutId TEXT NOT NULL,
    exerciseId TEXT NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight REAL NOT NULL,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workoutId) REFERENCES Workout(id) ON DELETE CASCADE,
    FOREIGN KEY (exerciseId) REFERENCES Exercise(id)
  );

  CREATE TABLE IF NOT EXISTS Program (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    deletedAt DATETIME
  );

  CREATE TABLE IF NOT EXISTS ProgramExercise (
    id TEXT PRIMARY KEY,
    programId TEXT NOT NULL,
    exerciseId TEXT NOT NULL,
    oneRepMax REAL NOT NULL,
    trainingMax REAL NOT NULL,
    "order" INTEGER NOT NULL,
    FOREIGN KEY (programId) REFERENCES Program(id) ON DELETE CASCADE,
    FOREIGN KEY (exerciseId) REFERENCES Exercise(id)
  );

  CREATE TABLE IF NOT EXISTS BodyMetric (
    id TEXT PRIMARY KEY,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    weight REAL,
    bodyFat REAL,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

const exercises = [
  { name: 'Squat', category: 'compound' },
  { name: 'Bench Press', category: 'compound' },
  { name: 'Deadlift', category: 'compound' },
  { name: 'Overhead Press', category: 'compound' },
  { name: 'Barbell Row', category: 'compound' },
  { name: 'Front Squat', category: 'compound' },
  { name: 'Incline Bench Press', category: 'compound' },
  { name: 'Romanian Deadlift', category: 'accessory' },
  { name: 'Pull-ups', category: 'accessory' },
  { name: 'Dips', category: 'accessory' },
  { name: 'Lunges', category: 'accessory' },
  { name: 'Leg Press', category: 'accessory' },
]

const insert = db.prepare(`
  INSERT OR IGNORE INTO Exercise (id, name, category, createdAt, updatedAt)
  VALUES (?, ?, ?, datetime('now'), datetime('now'))
`)

const generateId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 25; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

for (const exercise of exercises) {
  insert.run(generateId(), exercise.name, exercise.category)
}

console.log('✓ Created tables and seeded exercises successfully')
db.close()
