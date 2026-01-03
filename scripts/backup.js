#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Manual backup script with export options
 * Usage: node scripts/backup.js [--with-json]
 */

const dotenv = require('dotenv');
const backup = require('../lib/backup');

// Load environment variables
dotenv.config();

async function createManualBackup() {
  const includeJson = process.argv.includes('--with-json');

  console.log('Creating database backup...');
  console.log();

  try {
    // Create database backup
    const backupPath = await backup.createBackup('manual');
    console.log();

    // Create JSON export if requested
    if (includeJson) {
      console.log('Creating JSON export...');
      const exportPath = await backup.exportToJson();
      console.log();
    }

    // Show backup statistics
    const backups = await backup.listBackups();
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

    console.log('Backup Summary:');
    console.log(`  Total backups: ${backups.length}`);
    console.log(`  Total size: ${totalSizeMB} MB`);
    console.log();
    console.log('Recent backups:');
    backups.slice(0, 5).forEach((b, i) => {
      const sizeMB = (b.size / 1024 / 1024).toFixed(2);
      console.log(`  ${i + 1}. ${b.name} (${sizeMB} MB)`);
    });

    if (backups.length > 10) {
      console.log();
      console.log(`Note: You have ${backups.length} backups. Consider cleaning up old backups:`);
      console.log('  node scripts/cleanup-backups.js');
    }

  } catch (error) {
    console.error('✗ Backup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  createManualBackup();
}

module.exports = createManualBackup;
