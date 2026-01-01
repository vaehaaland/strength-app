const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'prisma', 'dev.db')
const db = new Database(dbPath)

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

console.log('✓ Seeded exercises successfully')
db.close()
