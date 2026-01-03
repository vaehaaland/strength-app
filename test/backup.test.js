/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const backup = require('../lib/backup');

test('getDatabasePath should return valid path', () => {
  const dbPath = backup.getDatabasePath();
  assert.ok(dbPath, 'Database path should be defined');
  assert.ok(typeof dbPath === 'string', 'Database path should be a string');
});

test('backup utility exports expected functions', () => {
  assert.ok(typeof backup.createBackup === 'function', 'createBackup should be a function');
  assert.ok(typeof backup.restoreBackup === 'function', 'restoreBackup should be a function');
  assert.ok(typeof backup.listBackups === 'function', 'listBackups should be a function');
  assert.ok(typeof backup.cleanupOldBackups === 'function', 'cleanupOldBackups should be a function');
  assert.ok(typeof backup.exportToJson === 'function', 'exportToJson should be a function');
  assert.ok(typeof backup.verifyIntegrity === 'function', 'verifyIntegrity should be a function');
});
