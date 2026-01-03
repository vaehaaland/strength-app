/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

/**
 * Database backup utility for SQLite databases
 * Provides backup, restore, and cleanup operations
 */

/**
 * Get the database path from environment or use default
 */
function getDatabasePath() {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  // Extract file path from DATABASE_URL (format: file:/path/to/db.db)
  const match = dbUrl.match(/^file:(.+)$/);
  if (match) {
    let dbPath = match[1];
    // Handle absolute and relative paths
    // Prisma resolves relative paths from the prisma directory
    if (!path.isAbsolute(dbPath)) {
      // Check if database exists in prisma directory (Prisma convention)
      const prismaPath = path.join(process.cwd(), 'prisma', dbPath.replace(/^\.\//, ''));
      if (fs.existsSync(prismaPath)) {
        return prismaPath;
      }
      // Otherwise use path relative to current directory
      dbPath = path.join(process.cwd(), dbPath);
    }
    return dbPath;
  }
  throw new Error('Invalid DATABASE_URL format');
}

/**
 * Create a backup of the database
 * @param {string} reason - Reason for the backup (e.g., 'pre-migration', 'manual')
 * @returns {Promise<string>} Path to the backup file
 */
async function createBackup(reason = 'manual') {
  const dbPath = getDatabasePath();
  
  if (!fs.existsSync(dbPath)) {
    console.warn(`Database not found at ${dbPath}, skipping backup`);
    return null;
  }

  const backupDir = path.join(path.dirname(dbPath), 'backups');
  
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${reason}-${timestamp}.db`;
  const backupPath = path.join(backupDir, backupFileName);

  // Copy the database file
  await fs.promises.copyFile(dbPath, backupPath);
  
  console.log(`✓ Database backup created: ${backupPath}`);
  return backupPath;
}

/**
 * Restore database from a backup
 * @param {string} backupPath - Path to the backup file
 * @returns {Promise<void>}
 */
async function restoreBackup(backupPath) {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  const dbPath = getDatabasePath();
  
  // Create a safety backup of current database before restoring
  if (fs.existsSync(dbPath)) {
    const safetyBackupPath = `${dbPath}.pre-restore-${Date.now()}.db`;
    await fs.promises.copyFile(dbPath, safetyBackupPath);
    console.log(`✓ Safety backup created: ${safetyBackupPath}`);
  }

  // Restore the backup
  await fs.promises.copyFile(backupPath, dbPath);
  console.log(`✓ Database restored from: ${backupPath}`);
}

/**
 * List all available backups
 * @returns {Promise<Array<{path: string, name: string, size: number, created: Date}>>}
 */
async function listBackups() {
  const dbPath = getDatabasePath();
  const backupDir = path.join(path.dirname(dbPath), 'backups');
  
  if (!fs.existsSync(backupDir)) {
    return [];
  }

  const files = await fs.promises.readdir(backupDir);
  const backups = [];

  for (const file of files) {
    if (file.endsWith('.db')) {
      const filePath = path.join(backupDir, file);
      const stats = await fs.promises.stat(filePath);
      backups.push({
        path: filePath,
        name: file,
        size: stats.size,
        created: stats.birthtime
      });
    }
  }

  // Sort by creation time, newest first
  backups.sort((a, b) => b.created.getTime() - a.created.getTime());
  
  return backups;
}

/**
 * Clean up old backups, keeping only the most recent ones
 * @param {number} keepCount - Number of backups to keep
 * @returns {Promise<number>} Number of backups deleted
 */
async function cleanupOldBackups(keepCount = 10) {
  const backups = await listBackups();
  
  if (backups.length <= keepCount) {
    console.log(`Only ${backups.length} backups exist, no cleanup needed`);
    return 0;
  }

  const toDelete = backups.slice(keepCount);
  let deletedCount = 0;

  for (const backup of toDelete) {
    try {
      await fs.promises.unlink(backup.path);
      console.log(`Deleted old backup: ${backup.name}`);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete backup ${backup.name}:`, error.message);
    }
  }

  console.log(`✓ Cleaned up ${deletedCount} old backup(s)`);
  return deletedCount;
}

/**
 * Export database data to JSON for portability
 * @returns {Promise<string>} Path to the JSON export file
 */
async function exportToJson() {
  // Load dotenv to ensure DATABASE_URL is available
  require('dotenv').config();
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      exercises: await prisma.exercise.findMany(),
      programs: await prisma.program.findMany({
        include: {
          exercises: true
        }
      }),
      workouts: await prisma.workout.findMany({
        include: {
          exercises: {
            include: {
              sets: true
            }
          }
        }
      }),
      bodyMetrics: await prisma.bodyMetric.findMany()
    };

    const dbPath = getDatabasePath();
    const exportDir = path.join(path.dirname(dbPath), 'exports');
    
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(exportDir, `export-${timestamp}.json`);
    
    await fs.promises.writeFile(exportPath, JSON.stringify(data, null, 2));
    
    console.log(`✓ Database exported to JSON: ${exportPath}`);
    return exportPath;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verify database integrity
 * @returns {Promise<boolean>} True if database is healthy
 */
async function verifyIntegrity() {
  // Load dotenv to ensure DATABASE_URL is available
  require('dotenv').config();
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Try to perform basic queries on each model
    await prisma.exercise.count();
    await prisma.program.count();
    await prisma.workout.count();
    await prisma.bodyMetric.count();
    
    console.log('✓ Database integrity check passed');
    return true;
  } catch (error) {
    console.error('✗ Database integrity check failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  cleanupOldBackups,
  exportToJson,
  verifyIntegrity,
  getDatabasePath
};
