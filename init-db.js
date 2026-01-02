/* eslint-disable @typescript-eslint/no-require-imports */
const seed = require('./seed-db')

async function main() {
  try {
    await seed()
  } catch (error) {
    console.error('Failed to init DB:', error)
    process.exitCode = 1
  }
}

main()
