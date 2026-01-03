const test = require('node:test');
const assert = require('node:assert/strict');

const exercises = require('../lib/seed-exercises');

test('seed-exercises exports a non-empty list of exercises', () => {
  assert.ok(Array.isArray(exercises));
  assert.ok(exercises.length > 0);
});

test('seed-exercises entries have name + category', () => {
  for (const exercise of exercises) {
    assert.equal(typeof exercise.name, 'string');
    assert.ok(exercise.name.trim().length > 0);
    assert.equal(typeof exercise.category, 'string');
    assert.ok(exercise.category.trim().length > 0);
  }
});

test('seed-exercises categories are expected values', () => {
  const categories = new Set(exercises.map((e) => e.category));
  for (const category of categories) {
    assert.ok(category === 'compound' || category === 'accessory');
  }
});

test('seed-exercises contains key compound lifts', () => {
  const names = new Set(exercises.map((e) => e.name));
  for (const lift of ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press']) {
    assert.ok(names.has(lift));
  }
});

test('seed-exercises has no duplicate names (case-insensitive)', () => {
  const seen = new Set();
  for (const { name } of exercises) {
    const key = name.toLowerCase();
    assert.ok(!seen.has(key), `duplicate exercise name: ${name}`);
    seen.add(key);
  }
});

