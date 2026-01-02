/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')
const dotenv = require('dotenv')
const exercises = require('./lib/seed-exercises')
const { PrismaClient } = require('@prisma/client')

dotenv.config({ path: path.join(__dirname, '.env.local') })

const prisma = new PrismaClient()

async function seed() {
  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: {},
      create: exercise,
    })
  }
}

async function main() {
  try {
    await seed()
    console.log(`Seeded ${exercises.length} exercises.`)
  } catch (error) {
    console.error('Failed to seed exercises:', error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

module.exports = seed
