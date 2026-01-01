import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create common compound exercises
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

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: {},
      create: exercise,
    })
  }

  console.log('✓ Seeded exercises')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
