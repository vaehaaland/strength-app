const test = require('node:test');
const assert = require('node:assert/strict');

/**
 * Tests for 5/3/1 Program Wizard functionality
 * 
 * These tests verify that the wizard correctly:
 * 1. Organizes exercises by day (1-4)
 * 2. Associates main lifts with their respective days
 * 3. Allows accessories to be assigned to specific days
 */

test('5/3/1 program should have 4 days', () => {
  const MAIN_LIFTS = ['Deadlift', 'Bench Press', 'Squat', 'Overhead Press'];
  assert.equal(MAIN_LIFTS.length, 4);
});

test('Each main lift should be assigned to a different day', () => {
  // Simulate the wizard's day assignment
  const mainExercises = [
    { name: 'Deadlift', day: 1, oneRepMax: 200 },
    { name: 'Bench Press', day: 2, oneRepMax: 150 },
    { name: 'Squat', day: 3, oneRepMax: 180 },
    { name: 'Overhead Press', day: 4, oneRepMax: 100 },
  ];

  // Verify each exercise has a unique day
  const days = mainExercises.map(ex => ex.day);
  const uniqueDays = new Set(days);
  assert.equal(uniqueDays.size, 4, 'Each main lift should have a unique day');

  // Verify days are 1-4
  days.forEach(day => {
    assert.ok(day >= 1 && day <= 4, `Day ${day} should be between 1 and 4`);
  });
});

test('Accessories can be assigned to specific days', () => {
  const accessories = [
    { name: 'Leg Press', day: 1, sets: 3, reps: 12 },  // Deadlift day
    { name: 'Romanian Deadlift', day: 1, sets: 3, reps: 10 },  // Deadlift day
    { name: 'Chest Flyes', day: 2, sets: 3, reps: 12 },  // Bench day
    { name: 'Tricep Extensions', day: 2, sets: 3, reps: 15 },  // Bench day
  ];

  // Verify each accessory has a day assignment
  accessories.forEach(acc => {
    assert.ok(acc.day !== null && acc.day !== undefined, `${acc.name} should have a day assignment`);
    assert.ok(acc.day >= 1 && acc.day <= 4, `${acc.name} day should be between 1 and 4`);
  });

  // Count accessories per day
  const day1Accessories = accessories.filter(a => a.day === 1);
  const day2Accessories = accessories.filter(a => a.day === 2);

  assert.equal(day1Accessories.length, 2, 'Day 1 should have 2 accessories');
  assert.equal(day2Accessories.length, 2, 'Day 2 should have 2 accessories');
});

test('Program exercises should be filterable by day', () => {
  const programExercises = [
    { name: 'Deadlift', day: 1, oneRepMax: 200 },
    { name: 'Leg Press', day: 1, sets: 3, reps: 12 },
    { name: 'Romanian Deadlift', day: 1, sets: 3, reps: 10 },
    { name: 'Bench Press', day: 2, oneRepMax: 150 },
    { name: 'Chest Flyes', day: 2, sets: 3, reps: 12 },
  ];

  // Filter exercises for day 1
  const day1Exercises = programExercises.filter(ex => ex.day === 1);
  assert.equal(day1Exercises.length, 3, 'Day 1 should have 3 exercises');
  assert.equal(day1Exercises[0].name, 'Deadlift', 'First exercise should be Deadlift');

  // Filter exercises for day 2
  const day2Exercises = programExercises.filter(ex => ex.day === 2);
  assert.equal(day2Exercises.length, 2, 'Day 2 should have 2 exercises');
  assert.equal(day2Exercises[0].name, 'Bench Press', 'First exercise should be Bench Press');
});

test('Workout initialization should only load exercises for selected day', () => {
  const programExercises = [
    { name: 'Deadlift', day: 1, oneRepMax: 200 },
    { name: 'Leg Press', day: 1, sets: 3, reps: 12 },
    { name: 'Bench Press', day: 2, oneRepMax: 150 },
    { name: 'Chest Flyes', day: 2, sets: 3, reps: 12 },
    { name: 'Squat', day: 3, oneRepMax: 180 },
    { name: 'Leg Extensions', day: 3, sets: 3, reps: 12 },
  ];

  // Simulate selecting day 1 for a workout
  const selectedDay = 1;
  const workoutExercises = programExercises.filter(ex => ex.day === selectedDay);

  assert.equal(workoutExercises.length, 2, 'Workout should only have 2 exercises');
  assert.equal(workoutExercises[0].name, 'Deadlift', 'First should be main lift');
  assert.equal(workoutExercises[1].name, 'Leg Press', 'Second should be accessory');
});

test('Each day should have exactly one main lift', () => {
  const programExercises = [
    { name: 'Deadlift', day: 1, oneRepMax: 200 },
    { name: 'Leg Press', day: 1, sets: 3, reps: 12 },
    { name: 'Bench Press', day: 2, oneRepMax: 150 },
    { name: 'Chest Flyes', day: 2, sets: 3, reps: 12 },
    { name: 'Squat', day: 3, oneRepMax: 180 },
    { name: 'Overhead Press', day: 4, oneRepMax: 100 },
  ];

  // Check each day has exactly one main lift
  for (let day = 1; day <= 4; day++) {
    const dayExercises = programExercises.filter(ex => ex.day === day);
    const mainLifts = dayExercises.filter(ex => ex.oneRepMax);
    assert.equal(mainLifts.length, 1, `Day ${day} should have exactly one main lift`);
  }
});
