#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Cleanup old backups
 * Usage: node scripts/cleanup-backups.js [keep-count]
 */

const path = require('path');
const dotenv = require('dotenv');
const backup = require('../lib/backup');

// Load environment variables - try .env.local first, then .env
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function cleanupBackups() {
  const keepCount = parseInt(process.argv[2]) || 10;

  console.log(`Cleaning up old backups (keeping most recent ${keepCount})...`);
  console.log();

  try {
    const deletedCount = await backup.cleanupOldBackups(keepCount);
    
    if (deletedCount === 0) {
      console.log('✓ No cleanup needed.');
    } else {
      console.log(`✓ Deleted ${deletedCount} old backup(s)`);
    }

    // Show remaining backups
    const remaining = await backup.listBackups();
    if (remaining.length > 0) {
      console.log();
      console.log(`Remaining backups (${remaining.length}):`);
      remaining.forEach((b, i) => {
        const sizeMB = (b.size / 1024 / 1024).toFixed(2);
        console.log(`  ${i + 1}. ${b.name} (${sizeMB} MB)`);
      });
    }

  } catch (error) {
    console.error('✗ Cleanup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  cleanupBackups();
}

module.exports = cleanupBackups;
