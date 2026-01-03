#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Safe migration script that creates backups before running Prisma migrations
 * Usage: node scripts/safe-migrate.js [deploy|dev]
 */

const { spawn } = require('child_process');
const path = require('path');
const backup = require('../lib/backup');

const MIGRATION_MODE = process.argv[2] || 'deploy';

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function safeMigrate() {
  console.log('='.repeat(60));
  console.log('Safe Migration Process');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Verify current database integrity
    console.log('Step 1: Verifying current database integrity...');
    const isHealthy = await backup.verifyIntegrity();
    if (!isHealthy) {
      console.error('⚠ Database integrity check failed. Please investigate before migrating.');
      console.log('You can still proceed with migration by running:');
      console.log(`  npx prisma migrate ${MIGRATION_MODE}`);
      process.exit(1);
    }
    console.log();

    // Step 2: Create backup
    console.log('Step 2: Creating pre-migration backup...');
    const backupPath = await backup.createBackup('pre-migration');
    if (backupPath) {
      console.log(`Backup location: ${backupPath}`);
    }
    console.log();

    // Step 3: Run Prisma migration
    console.log(`Step 3: Running Prisma migration (${MIGRATION_MODE})...`);
    await runCommand('npx', ['prisma', 'migrate', MIGRATION_MODE]);
    console.log();

    // Step 4: Verify post-migration integrity
    console.log('Step 4: Verifying post-migration database integrity...');
    const isHealthyAfter = await backup.verifyIntegrity();
    if (!isHealthyAfter) {
      console.error('✗ Post-migration integrity check failed!');
      if (backupPath) {
        console.log(`To restore from backup, run:`);
        console.log(`  node scripts/restore-backup.js "${backupPath}"`);
      }
      process.exit(1);
    }
    console.log();

    // Step 5: Cleanup old backups
    console.log('Step 5: Cleaning up old backups...');
    await backup.cleanupOldBackups(10);
    console.log();

    console.log('='.repeat(60));
    console.log('✓ Migration completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error();
    console.error('='.repeat(60));
    console.error('✗ Migration failed:', error.message);
    console.error('='.repeat(60));
    
    const backups = await backup.listBackups();
    if (backups.length > 0) {
      console.error();
      console.error('Available backups:');
      backups.slice(0, 5).forEach((b, i) => {
        console.error(`  ${i + 1}. ${b.name} (${new Date(b.created).toLocaleString()})`);
      });
      console.error();
      console.error('To restore from the most recent backup:');
      console.error(`  node scripts/restore-backup.js "${backups[0].path}"`);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  safeMigrate();
}

module.exports = safeMigrate;
