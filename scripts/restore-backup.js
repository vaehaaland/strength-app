#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Restore database from backup
 * Usage: node scripts/restore-backup.js [backup-path]
 *        node scripts/restore-backup.js --list
 *        node scripts/restore-backup.js --latest
 */

const dotenv = require('dotenv');
const backup = require('../lib/backup');

// Load environment variables
dotenv.config();

async function restoreBackupCommand() {
  const arg = process.argv[2];

  if (!arg || arg === '--help' || arg === '-h') {
    console.log('Database Backup Restore Tool');
    console.log();
    console.log('Usage:');
    console.log('  node scripts/restore-backup.js <backup-path>  Restore from specific backup');
    console.log('  node scripts/restore-backup.js --list          List all available backups');
    console.log('  node scripts/restore-backup.js --latest        Restore from most recent backup');
    console.log();
    return;
  }

  if (arg === '--list' || arg === '-l') {
    const backups = await backup.listBackups();
    
    if (backups.length === 0) {
      console.log('No backups found.');
      return;
    }

    console.log('Available backups:');
    console.log();
    backups.forEach((b, i) => {
      const sizeMB = (b.size / 1024 / 1024).toFixed(2);
      console.log(`${i + 1}. ${b.name}`);
      console.log(`   Created: ${b.created.toLocaleString()}`);
      console.log(`   Size: ${sizeMB} MB`);
      console.log(`   Path: ${b.path}`);
      console.log();
    });
    return;
  }

  if (arg === '--latest') {
    const backups = await backup.listBackups();
    
    if (backups.length === 0) {
      console.error('No backups found.');
      process.exit(1);
    }

    const latest = backups[0];
    console.log(`Restoring from most recent backup: ${latest.name}`);
    console.log(`Created: ${latest.created.toLocaleString()}`);
    console.log();
    
    await backup.restoreBackup(latest.path);
    console.log();
    console.log('✓ Database restored successfully!');
    return;
  }

  // Restore from specified path
  console.log(`Restoring from backup: ${arg}`);
  console.log();
  
  await backup.restoreBackup(arg);
  console.log();
  console.log('✓ Database restored successfully!');
}

if (require.main === module) {
  restoreBackupCommand().catch((error) => {
    console.error('✗ Restore failed:', error.message);
    process.exit(1);
  });
}

module.exports = restoreBackupCommand;
