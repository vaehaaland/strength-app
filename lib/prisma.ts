import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Build absolute path to database
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
const dbUrl = `file:${dbPath}`

console.log('Prisma DB URL:', dbUrl)

const libsql = createClient({
  url: dbUrl
})

const adapter = new PrismaLibSql(libsql)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
