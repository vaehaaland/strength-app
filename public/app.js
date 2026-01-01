// API Base URL
const API_URL = window.location.origin + '/api';

// App State
const state = {
  currentView: 'workouts',
  currentWorkoutLog: null,
  currentProgram: null,
  exercises: [],
  programs: [],
  workoutLogs: [],
  healthStats: []
};

// Initialize App
async function initializeApp() {
  await loadExercises();
  await loadPrograms();
  await loadWorkoutLogs();
  await loadHealthStats();

  setupNavigation();
  setupEventListeners();

  renderCurrentView();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Navigation
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const view = link.dataset.view;
      switchView(view);

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function switchView(viewName) {
  state.currentView = viewName;
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(`${viewName}-view`)?.classList.add('active');
  renderCurrentView();
}

// Event Listeners
function setupEventListeners() {
  // Start Workout
  document.getElementById('start-workout-btn').addEventListener('click', showStartWorkoutModal);

  // Create Program
  document.getElementById('create-program-btn').addEventListener('click', showCreateProgramModal);
  document.getElementById('create-531-btn').addEventListener('click', create531Program);

  // Add Stats
  document.getElementById('add-stats-btn').addEventListener('click', showAddStatsModal);

  // Back buttons
  document.getElementById('back-to-programs').addEventListener('click', () => switchView('programs'));
  document.getElementById('back-to-workouts').addEventListener('click', () => switchView('workouts'));

  // Complete Workout
  document.getElementById('complete-workout-btn').addEventListener('click', completeWorkout);
  document.getElementById('delete-workout-btn').addEventListener('click', deleteIncompleteWorkout);

  // Modal close
  document.querySelector('.modal-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
}

// API Functions
async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

async function loadExercises() {
  state.exercises = await fetchAPI('/exercises');
}

async function loadPrograms() {
  state.programs = await fetchAPI('/programs');
}

async function loadWorkoutLogs() {
  state.workoutLogs = await fetchAPI('/workout-logs');
}

async function loadHealthStats() {
  state.healthStats = await fetchAPI('/health-stats');
}

// Render Functions
function renderCurrentView() {
  switch (state.currentView) {
    case 'workouts':
      renderWorkoutLogs();
      break;
    case 'programs':
      renderPrograms();
      break;
    case 'stats':
      renderHealthStats();
      break;
  }
}

function renderWorkoutLogs() {
  const container = document.getElementById('workout-logs-list');

  if (state.workoutLogs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏋️</div>
        <div class="empty-state-text">No workouts logged yet</div>
        <button class="btn btn-primary" onclick="document.getElementById('start-workout-btn').click()">
          Start Your First Workout
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.workoutLogs.map(log => `
    <div class="card ${!log.completed ? 'card-in-progress' : ''}" onclick="${log.completed ? `viewWorkoutLog(${log.id})` : `resumeWorkout(${log.id})`}">
      <div class="card-header">
        <div>
          <div class="card-title">${log.workout_name || 'Custom Workout'}</div>
          <div class="card-subtitle">${log.program_name || ''}</div>
        </div>
        ${log.completed ? '<span class="badge badge-success">Completed</span>' : '<span class="badge badge-primary badge-pulse">In Progress</span>'}
      </div>
      <div class="card-meta">
        <span>📅 ${formatDate(log.date)}</span>
      </div>
    </div>
  `).join('');
}

function renderPrograms() {
  const container = document.getElementById('programs-list');

  if (state.programs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">No training programs yet</div>
        <button class="btn btn-primary" onclick="document.getElementById('create-531-btn').click()">
          Create 5/3/1 Program
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.programs.map(program => `
    <div class="card ${!program.is_active ? 'card-inactive' : ''}" onclick="viewProgram(${program.id})">
      <div class="card-header">
        <div>
          <div class="card-title">${program.name}</div>
          <div class="card-subtitle">${program.description || ''} ${!program.is_active ? '(Inactive)' : ''}</div>
        </div>
        ${program.program_type ? `<span class="badge badge-primary">${program.program_type}</span>` : ''}
      </div>
      <div class="card-meta">
        <span>📅 ${formatDate(program.created_at)}</span>
      </div>
    </div>
  `).join('');
}

function renderHealthStats() {
  const container = document.getElementById('stats-list');

  if (state.healthStats.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-text">No health stats recorded yet</div>
        <button class="btn btn-primary" onclick="document.getElementById('add-stats-btn').click()">
          Add Your First Entry
        </button>
      </div>
    `;
    return;
  }

  // Show latest stats at top
  const latest = state.healthStats[0];

  const statsGrid = `
    <div class="stats-grid">
      ${latest.weight ? `
        <div class="stat-card">
          <div class="stat-value">${latest.weight}</div>
          <div class="stat-label">Weight (kg)</div>
        </div>
      ` : ''}
      ${latest.body_fat_percentage ? `
        <div class="stat-card">
          <div class="stat-value">${latest.body_fat_percentage}%</div>
          <div class="stat-label">Body Fat</div>
        </div>
      ` : ''}
    </div>
  `;

  const statsHistory = state.healthStats.map(stat => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">📅 ${formatDate(stat.date)}</div>
        </div>
      </div>
      <div class="card-meta">
        ${stat.weight ? `<span>⚖️ ${stat.weight} kg</span>` : ''}
        ${stat.body_fat_percentage ? `<span>📊 ${stat.body_fat_percentage}% BF</span>` : ''}
      </div>
      ${stat.notes ? `<div class="mt-2 text-muted">${stat.notes}</div>` : ''}
    </div>
  `).join('');

  container.innerHTML = statsGrid + statsHistory;
}

// Modal Functions
function showModal(title, content) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `<h2 class="mb-3">${title}</h2>${content}`;
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

function showStartWorkoutModal() {
  const activePrograms = state.programs.filter(p => p.is_active !== 0);
  const programOptions = activePrograms.map(p =>
    `<option value="${p.id}">${p.name}</option>`
  ).join('');

  const content = `
    <form id="start-workout-form">
      <div class="form-group">
        <label class="form-label">Select Program Workout</label>
        <select class="form-select" id="program-select" onchange="loadProgramWorkouts(this.value)">
          <option value="">Custom Workout</option>
          ${programOptions}
        </select>
      </div>
      <div class="form-group" id="workout-select-group" style="display: none;">
        <label class="form-label">Select Workout</label>
        <select class="form-select" id="workout-select">
          <option value="">Select a workout</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="date" class="form-input" id="workout-date" value="${new Date().toISOString().split('T')[0]}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Notes (optional)</label>
        <textarea class="form-textarea" id="workout-notes"></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Start Workout</button>
    </form>
  `;

  showModal('Start Workout', content);

  document.getElementById('start-workout-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const workoutId = document.getElementById('workout-select').value;
    const date = document.getElementById('workout-date').value;
    const notes = document.getElementById('workout-notes').value;

    const workoutLog = await fetchAPI('/workout-logs', {
      method: 'POST',
      body: JSON.stringify({
        program_workout_id: workoutId || null,
        date,
        notes
      })
    });

    closeModal();
    await loadWorkoutLogs();

    if (workoutId) {
      // Load and start the workout
      const program = await fetchAPI(`/programs/${document.getElementById('program-select').value}`);
      const workout = program.workouts.find(w => w.id == workoutId);
      startWorkout(workoutLog.id, workout);
    } else {
      // Custom workout - show exercise selector
      startCustomWorkout(workoutLog.id);
    }
  });
}

async function loadProgramWorkouts(programId) {
  const selectGroup = document.getElementById('workout-select-group');
  const workoutSelect = document.getElementById('workout-select');

  if (!programId) {
    selectGroup.style.display = 'none';
    return;
  }

  const program = await fetchAPI(`/programs/${programId}`);

  workoutSelect.innerHTML = '<option value="">Select a workout</option>' +
    program.workouts.map(w => `<option value="${w.id}">${w.name} - Day ${w.day_number}</option>`).join('');

  selectGroup.style.display = 'block';
}

function startWorkout(logId, workout, existingExercises = []) {
  state.currentWorkoutLog = logId;

  // Check if any exercise has 1RM (5/3/1 program)
  const is531 = workout.exercises.some(ex => ex.one_rm);

  let weekSelector = '';
  if (is531) {
    weekSelector = `
      <div class="mb-3 p-3 bg-light rounded shadow-sm">
        <label class="form-label">5/3/1 Week Selector</label>
        <select class="form-select" id="week-selector" onchange="updateCalculatedWeights()">
          <option value="1">Week 1 (5/5/5+ @ 65, 75, 85%)</option>
          <option value="2">Week 2 (3/3/3+ @ 70, 80, 90%)</option>
          <option value="3">Week 3 (5/3/1+ @ 75, 85, 95%)</option>
          <option value="4">Week 4 (Deload @ 40, 50, 60%)</option>
        </select>
        <p class="text-muted small mt-1">Weights are calculated based on 90% Training Max.</p>
      </div>
    `;
  }

  const renderExercises = (week = 1) => {
    return workout.exercises.map(ex => {
      const progressMap = {};
      existingExercises.forEach(le => {
        if (!progressMap[le.exercise_id]) progressMap[le.exercise_id] = {};
        progressMap[le.exercise_id][le.set_number] = le;
      });

      const sets = [];
      const tm = ex.one_rm ? ex.one_rm * 0.9 : null;

      let weekPercentages = [0.65, 0.75, 0.85];
      let weekReps = [5, 5, 5];

      if (week == 2) {
        weekPercentages = [0.70, 0.80, 0.90];
        weekReps = [3, 3, 3];
      } else if (week == 3) {
        weekPercentages = [0.75, 0.85, 0.95];
        weekReps = [5, 3, 1];
      } else if (week == 4) {
        weekPercentages = [0.40, 0.50, 0.60];
        weekReps = [5, 5, 5];
      }

      for (let i = 1; i <= ex.sets; i++) {
        const saved = progressMap[ex.exercise_id]?.[i] || {};
        const repsValue = saved.reps || (ex.reps === '5/3/1' ? weekReps[i - 1] || 5 : (ex.reps && !isNaN(ex.reps) ? ex.reps : ''));

        let calculatedWeight = '';
        if (tm && i <= 3 && ex.reps === '5/3/1') {
          calculatedWeight = Math.round((tm * (weekPercentages[i - 1] || 0.5)) / 2.5) * 2.5;
        }

        const weightValue = saved.weight !== undefined && saved.weight !== null && saved.weight !== '' ? saved.weight : (calculatedWeight || '');

        sets.push(`
          <div class="set-entry">
            <div class="set-header">
              <span class="set-label">Set ${i}</span>
              <input type="checkbox" class="set-check" data-exercise="${ex.exercise_id}" data-set="${i}" ${saved.completed ? 'checked' : ''} onchange="saveSetImmediately(this)">
            </div>
            <div class="set-inputs">
              <div class="set-input-group">
                <label class="mobile-only-label">Reps</label>
                <input type="number" class="set-input" placeholder="Reps" data-exercise="${ex.exercise_id}" data-set="${i}" data-type="reps" value="${repsValue}" onblur="saveSetImmediately(this)">
              </div>
              <div class="set-input-group">
                <label class="mobile-only-label">Weight</label>
                <input type="number" class="set-input" placeholder="Weight" step="0.5" data-exercise="${ex.exercise_id}" data-set="${i}" data-type="weight" value="${weightValue}" onblur="saveSetImmediately(this)">
              </div>
            </div>
          </div>
        `);
      }

      return `
        <div class="exercise-entry" data-exercise-id="${ex.exercise_id}">
          <div class="exercise-entry-header">
            <div class="exercise-name">${ex.exercise_name}</div>
            <div class="text-muted">${ex.sets} sets × ${ex.reps === '5/3/1' ? (week == 3 ? '5/3/1' : (week == 2 ? '3' : '5')) : ex.reps} reps</div>
          </div>
          ${ex.one_rm ? `<div class="text-primary small mb-2">1RM: ${ex.one_rm}kg | TM: ${(tm).toFixed(1)}kg</div>` : ''}
          <div class="sets-container">
            ${sets.join('')}
            <div class="mt-2">
              <button class="btn btn-sm btn-outline" onclick="addSetToActiveExercise(${ex.exercise_id})">+ Add Set</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  window.updateCalculatedWeights = () => {
    const selector = document.getElementById('week-selector');
    const week = selector ? selector.value : 1;
    document.getElementById('exercises-list-container').innerHTML = renderExercises(week);
  };

  window.addSetToActiveExercise = (exerciseId) => {
    const ex = workout.exercises.find(e => e.exercise_id == exerciseId);
    if (ex) {
      ex.sets = (ex.sets || 0) + 1;
      updateCalculatedWeights();
    }
  };

  document.getElementById('workout-detail-content').innerHTML = `
    ${weekSelector}
    <div id="exercises-list-container">
      ${renderExercises(1)}
    </div>
    <div class="mt-4 p-3 bg-light rounded shadow-sm">
      <h3 class="mb-3">Add Exercise</h3>
      <div class="form-group">
        <select class="form-select" id="add-exercise-to-log-select">
          <option value="">Select exercise to add...</option>
          ${state.exercises.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-secondary w-100" onclick="addExerciseToActiveWorkout()">Add to Workout</button>
    </div>
  `;

  window.addExerciseToActiveWorkout = () => {
    const select = document.getElementById('add-exercise-to-log-select');
    const exerciseId = select.value;
    if (!exerciseId) return;

    const exercise = state.exercises.find(e => e.id == exerciseId);
    workout.exercises.push({
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: 1,
      reps: '10',
      weight_percentage: null,
      one_rm: null,
      notes: ''
    });

    select.value = '';
    updateCalculatedWeights();
  };
  document.getElementById('workout-detail-title').textContent = workout.name;

  // Switch to workout detail view
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('workout-detail-view').classList.add('active');
}

function startCustomWorkout(logId) {
  startWorkout(logId, { name: 'Custom Workout', exercises: [] });
}

async function saveSetImmediately(element) {
  const setEntry = element.closest('.set-entry');
  const checkbox = setEntry.querySelector('.set-check');
  const exerciseId = checkbox.dataset.exercise;
  const setNumber = checkbox.dataset.set;
  const repsInput = setEntry.querySelector('[data-type="reps"]');
  const weightInput = setEntry.querySelector('[data-type="weight"]');
  const reps = repsInput ? parseInt(repsInput.value) : 0;
  const weight = weightInput ? parseFloat(weightInput.value) : 0;
  const completed = checkbox.checked;

  if (!state.currentWorkoutLog) return;

  await fetchAPI(`/workout-logs/${state.currentWorkoutLog}/exercises`, {
    method: 'POST',
    body: JSON.stringify({
      exercise_id: parseInt(exerciseId),
      set_number: parseInt(setNumber),
      reps: reps || 0,
      weight: weight || 0,
      completed: completed ? 1 : 0,
      notes: ''
    })
  });
}

async function completeWorkout() {
  if (!state.currentWorkoutLog) return;

  // Collect all exercise data
  const sets = document.querySelectorAll('.set-entry');
  const exerciseData = [];

  sets.forEach(set => {
    const checkbox = set.querySelector('.set-check');
    if (checkbox.checked) {
      const exerciseId = set.querySelector('[data-exercise]').dataset.exercise;
      const setNumber = set.querySelector('[data-set]').dataset.set;
      const reps = set.querySelector('[data-type="reps"]').value;
      const weight = set.querySelector('[data-type="weight"]').value;

      if (reps && weight) {
        exerciseData.push({
          exercise_id: exerciseId,
          set_number: setNumber,
          reps: parseInt(reps),
          weight: parseFloat(weight),
          completed: true
        });
      }
    }
  });

  // Save exercise logs
  for (const data of exerciseData) {
    await fetchAPI(`/workout-logs/${state.currentWorkoutLog}/exercises`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Mark workout as completed
  await fetchAPI(`/workout-logs/${state.currentWorkoutLog}`, {
    method: 'PUT',
    body: JSON.stringify({ completed: true, notes: '' })
  });

  alert('Workout completed! 💪');

  state.currentWorkoutLog = null;
  await loadWorkoutLogs();
  switchView('workouts');
}

async function deleteWorkoutLog(id) {
  if (!confirm('Are you sure you want to delete this workout log?')) return;

  await fetchAPI(`/workout-logs/${id}`, { method: 'DELETE' });
  closeModal();
  await loadWorkoutLogs();
  renderWorkoutLogs();
}

async function deleteIncompleteWorkout() {
  if (!state.currentWorkoutLog) return;
  if (!confirm('Are you sure you want to delete this workout?')) return;

  await fetchAPI(`/workout-logs/${state.currentWorkoutLog}`, { method: 'DELETE' });
  state.currentWorkoutLog = null;
  await loadWorkoutLogs();
  switchView('workouts');
}

async function resumeWorkout(logId) {
  const log = await fetchAPI(`/workout-logs/${logId}`);
  state.currentWorkoutLog = logId;

  let workout = { name: log.workout_name || 'Custom Workout', exercises: [] };

  if (log.program_workout_id && log.program_id) {
    try {
      const program = await fetchAPI(`/programs/${log.program_id}`);
      const foundWorkout = program.workouts.find(w => w.id === log.program_workout_id);
      if (foundWorkout) {
        workout = JSON.parse(JSON.stringify(foundWorkout)); // Deep copy to avoid mutating cache
      }
    } catch (e) {
      console.error('Failed to load program for resumption', e);
    }
  }

  // Ensure any exercises logged that AREN'T in the template are added to the list for display
  log.exercises.forEach(le => {
    let ex = workout.exercises.find(e => e.exercise_id == le.exercise_id);
    if (!ex) {
      const maxSet = Math.max(...log.exercises.filter(e => e.exercise_id == le.exercise_id).map(e => e.set_number));
      workout.exercises.push({
        exercise_id: le.exercise_id,
        exercise_name: le.exercise_name,
        sets: maxSet,
        reps: '',
        one_rm: null,
        notes: ''
      });
    } else {
      // If it is in the template, ensure we have enough sets displayed to cover what was logged
      if (le.set_number > ex.sets) {
        ex.sets = le.set_number;
      }
    }
  });

  startWorkout(logId, workout, log.exercises);
}

async function viewWorkoutLog(id) {
  const log = await fetchAPI(`/workout-logs/${id}`);

  const exercisesHTML = log.exercises.length > 0 ?
    Object.values(log.exercises.reduce((acc, ex) => {
      if (!acc[ex.exercise_name]) {
        acc[ex.exercise_name] = {
          name: ex.exercise_name,
          sets: []
        };
      }
      acc[ex.exercise_name].sets.push(ex);
      return acc;
    }, {})).map(ex => `
      <div class="exercise-entry">
        <div class="exercise-name mb-2">${ex.name}</div>
        <div class="sets-container">
          ${ex.sets.map(set => `
            <div class="card-meta">
              <span>Set ${set.set_number}: ${set.reps} reps × ${set.weight} kg</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('') : '<div class="empty-state">No exercises logged</div>';

  showModal(`Workout - ${formatDate(log.date)}`, `
    <div class="mb-3">
      <strong>${log.workout_name || 'Custom Workout'}</strong>
      ${log.program_name ? `<div class="text-muted">${log.program_name}</div>` : ''}
      ${log.completed ? '<span class="badge badge-success mt-1">Completed</span>' : '<span class="badge mt-1">In Progress</span>'}
    </div>
    ${exercisesHTML}
    <div class="mt-3 card-actions">
      <button class="btn btn-danger" onclick="deleteWorkoutLog(${id})">Delete Workout</button>
    </div>
  `);
}

function showCreateProgramModal() {
  const content = `
    <form id="create-program-form">
      <div class="form-group">
        <label class="form-label">Program Name</label>
        <input type="text" class="form-input" id="program-name" required>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="program-description"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Program Type</label>
        <select class="form-select" id="program-type">
          <option value="custom">Custom</option>
          <option value="5/3/1">5/3/1</option>
          <option value="linear">Linear Progression</option>
          <option value="ppl">Push/Pull/Legs</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary">Create Program</button>
    </form>
    `;

  showModal('Create Program', content);

  document.getElementById('create-program-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const program = await fetchAPI('/programs', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('program-name').value,
        description: document.getElementById('program-description').value,
        program_type: document.getElementById('program-type').value
      })
    });

    closeModal();
    await loadPrograms();
    renderPrograms();
  });
}

function calculate531Weight(oneRm, sets) {
  // Training Max is typically 90% of 1RM
  const tm = oneRm * 0.9;
  // Standard 5/3/1 Week 1 percentages: 65%, 75%, 85%
  const percentages = [0.65, 0.75, 0.85];
  return percentages.map(p => Math.round((tm * p) / 2.5) * 2.5);
}

async function create531Program() {
  const content = `
    <form id="create-531-form">
      <div class="form-group">
        <label class="form-label">Program Name</label>
        <input type="text" class="form-input" id="program-name" value="5/3/1 Program" required>
      </div>
      <p class="text-muted mb-3">Select lifts and enter your current 1RM (1 Rep Max):</p>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Squat</label>
          <select class="form-select mb-1" id="squat-exercise">
            ${state.exercises.map(e => `<option value="${e.id}" ${e.name === 'Squat' ? 'selected' : ''}>${e.name}</option>`).join('')}
          </select>
          <input type="number" class="form-input" id="squat-1rm" placeholder="1RM (kg)" required>
        </div>
        <div class="form-group">
          <label class="form-label">Bench Press</label>
          <select class="form-select mb-1" id="bench-exercise">
            ${state.exercises.map(e => `<option value="${e.id}" ${e.name === 'Bench Press' ? 'selected' : ''}>${e.name}</option>`).join('')}
          </select>
          <input type="number" class="form-input" id="bench-1rm" placeholder="1RM (kg)" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Deadlift</label>
          <select class="form-select mb-1" id="deadlift-exercise">
            ${state.exercises.map(e => `<option value="${e.id}" ${e.name === 'Deadlift' ? 'selected' : ''}>${e.name}</option>`).join('')}
          </select>
          <input type="number" class="form-input" id="deadlift-1rm" placeholder="1RM (kg)" required>
        </div>
        <div class="form-group">
          <label class="form-label">OHP</label>
          <select class="form-select mb-1" id="ohp-exercise">
            ${state.exercises.map(e => `<option value="${e.id}" ${e.name === 'Overhead Press' ? 'selected' : ''}>${e.name}</option>`).join('')}
          </select>
          <input type="number" class="form-input" id="ohp-1rm" placeholder="1RM (kg)" required>
        </div>
      </div>
      <button type="submit" class="btn btn-primary mt-2">Create 5/3/1 Program</button>
    </form>
  `;

  showModal('Create 5/3/1 Program', content);

  document.getElementById('create-531-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const programName = document.getElementById('program-name').value;
    const squatEx = document.getElementById('squat-exercise').value;
    const benchEx = document.getElementById('bench-exercise').value;
    const deadliftEx = document.getElementById('deadlift-exercise').value;
    const ohpEx = document.getElementById('ohp-exercise').value;

    const liftData = [
      { name: 'Squat', id: squatEx, rm: document.getElementById('squat-1rm').value },
      { name: 'Bench', id: benchEx, rm: document.getElementById('bench-1rm').value },
      { name: 'Deadlift', id: deadliftEx, rm: document.getElementById('deadlift-1rm').value },
      { name: 'OHP', id: ohpEx, rm: document.getElementById('ohp-1rm').value }
    ];

    // Create program
    const program = await fetchAPI('/programs', {
      method: 'POST',
      body: JSON.stringify({
        name: programName,
        description: '5/3/1 strength program with calculated weights',
        program_type: '5/3/1'
      })
    });

    for (const lift of liftData) {
      const wo = await fetchAPI(`/programs/${program.id}/workouts`, {
        method: 'POST',
        body: JSON.stringify({
          name: `${lift.name} Day`,
          day_number: liftData.indexOf(lift) + 1
        })
      });

      await fetchAPI(`/program-workouts/${wo.id}/exercises`, {
        method: 'POST',
        body: JSON.stringify({
          exercise_id: lift.id,
          sets: 3,
          reps: '5/3/1',
          weight_percentage: 90, // We'll use 1rm field to store TM or 1RM
          one_rm: lift.rm,
          notes: 'Standard 5/3/1 sets',
          exercise_order: 1
        })
      });
    }

    closeModal();
    await loadPrograms();
    renderPrograms();
    alert('5/3/1 Program created successfully! 💪');
  });
}

async function viewProgram(id) {
  const program = await fetchAPI(`/programs/${id}`);
  state.currentProgram = program;

  const is531 = program.program_type === '5/3/1';
  let workoutsHTML = '';

  if (is531) {
    workoutsHTML = `
      <div class="mb-3">
        <ul class="nav-links d-flex gap-2" style="border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; overflow-x: auto;">
          <li class="active" style="cursor: pointer; font-weight: bold;" onclick="render531WeekView(1)">Week 1</li>
          <li style="cursor: pointer;" onclick="render531WeekView(2)">Week 2</li>
          <li style="cursor: pointer;" onclick="render531WeekView(3)">Week 3</li>
          <li style="cursor: pointer;" onclick="render531WeekView(4)">Deload</li>
        </ul>
      </div>
      <div id="531-workouts-container">
        ${render531Workouts(program.workouts, 1)}
      </div>
    `;

    // Define helper globally so the tabs can use it
    window.render531WeekView = (week) => {
      document.querySelectorAll('.nav-links li').forEach((li, idx) => {
        if (idx + 1 === week) {
          li.classList.add('active');
          li.style.fontWeight = 'bold';
        } else {
          li.classList.remove('active');
          li.style.fontWeight = 'normal';
        }
      });
      document.getElementById('531-workouts-container').innerHTML = render531Workouts(program.workouts, week);
    };

  } else {
    // Standard view for other programs
    workoutsHTML = program.workouts.map(workout => `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${workout.name}</div>
            <div class="card-subtitle">Day ${workout.day_number}</div>
          </div>
          <button class="btn btn-sm btn-outline" onclick="showAddExerciseToProgramModal(${workout.id})">Add Exercise</button>
        </div>
        <div class="mt-2">
          ${workout.exercises.map(ex => `
            <div class="card-meta mb-1 d-flex justify-content-between align-items-center">
              <span><strong>${ex.exercise_name}</strong> - ${ex.sets} × ${ex.reps} ${ex.one_rm ? `(1RM: ${ex.one_rm}kg)` : ''}</span>
              <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline" title="Add Set" onclick="updateProgramExerciseSets(${ex.id}, ${ex.sets + 1}, '${ex.reps}', ${ex.one_rm || 'null'})">+</button>
                <button class="btn btn-sm btn-outline" title="Remove Set" onclick="updateProgramExerciseSets(${ex.id}, ${Math.max(1, ex.sets - 1)}, '${ex.reps}', ${ex.one_rm || 'null'})">-</button>
                <button class="btn btn-sm btn-danger-outline" onclick="deleteProgramExercise(${ex.id})">×</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  document.getElementById('program-detail-title').textContent = program.name;
  document.getElementById('program-detail-content').innerHTML = `
    <div class="mb-3">
      <p class="text-muted">${program.description || ''}</p>
      <div class="mt-2 d-flex justify-content-between">
        <div class="d-flex gap-2">
          ${program.program_type ? `<span class="badge badge-primary">${program.program_type}</span>` : ''}
          <button class="btn btn-sm btn-outline" onclick="toggleProgramActive(${program.id}, ${program.is_active})">
            ${program.is_active ? 'Mark Inactive' : 'Mark Active'}
          </button>
        </div>
        <button class="btn btn-sm btn-primary" onclick="showAddWorkoutModal(${program.id})">Add Workout Day</button>
      </div>
    </div>
    ${workoutsHTML.length > 0 ? workoutsHTML : '<div class="empty-state">No workouts defined yet</div>'}
  `;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('program-detail-view').classList.add('active');
}

function render531Workouts(workouts, week) {
  let percentages = [0.65, 0.75, 0.85];
  let reps = [5, 5, 5];

  if (week === 2) {
    percentages = [0.70, 0.80, 0.90];
    reps = [3, 3, 3];
  } else if (week === 3) {
    percentages = [0.75, 0.85, 0.95];
    reps = [5, 3, 1];
  } else if (week === 4) { // Deload
    percentages = [0.40, 0.50, 0.60];
    reps = [5, 5, 5];
  }

  return workouts.map(workout => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${workout.name}</div>
          <div class="card-subtitle">Day ${workout.day_number}</div>
        </div>
        <button class="btn btn-sm btn-outline" onclick="showAddExerciseToProgramModal(${workout.id})">Add Exercise</button>
      </div>
      <div class="mt-2">
        ${workout.exercises.map(ex => {
    let details = `${ex.sets} × ${ex.reps}`;

    if (ex.reps === '5/3/1' && ex.one_rm) {
      const tm = ex.one_rm * 0.9;
      // Calculate weights for the 3 main sets
      const setWeights = percentages.map(p => Math.round((tm * p) / 2.5) * 2.5);
      details = `
               <div class="mt-1 small">
                 <div>Set 1: ${setWeights[0]}kg x ${reps[0]}</div>
                 <div>Set 2: ${setWeights[1]}kg x ${reps[1]}</div>
                 <div>Set 3: ${setWeights[2]}kg x ${week === 3 ? '1+' : reps[2]}</div>
               </div>
             `;
    }

    return `
          <div class="card-meta mb-1 d-flex justify-content-between align-items-start">
            <div>
              <strong>${ex.exercise_name}</strong>
              ${details}
            </div>
            <div class="d-flex gap-1">
               <button class="btn btn-sm btn-danger-outline" onclick="deleteProgramExercise(${ex.id})">×</button>
            </div>
          </div>
        `}).join('')}
      </div>
    </div>
  `).join('');
}

async function toggleProgramActive(id, currentStatus) {
  await fetchAPI(`/programs/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: state.currentProgram.name,
      description: state.currentProgram.description,
      is_active: currentStatus ? 0 : 1
    })
  });
  await loadPrograms();
  viewProgram(id);
}

function showAddStatsModal() {
  const content = `
    <form id="add-stats-form">
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="date" class="form-input" id="stats-date" value="${new Date().toISOString().split('T')[0]}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Weight (kg)</label>
          <input type="number" class="form-input" id="stats-weight" step="0.1">
        </div>
        <div class="form-group">
          <label class="form-label">Body Fat %</label>
          <input type="number" class="form-input" id="stats-bf" step="0.1">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes (optional)</label>
        <textarea class="form-textarea" id="stats-notes"></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Save Stats</button>
    </form>
  `;

  showModal('Add Health Stats', content);

  document.getElementById('add-stats-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    await fetchAPI('/health-stats', {
      method: 'POST',
      body: JSON.stringify({
        date: document.getElementById('stats-date').value,
        weight: parseFloat(document.getElementById('stats-weight').value) || null,
        body_fat_percentage: parseFloat(document.getElementById('stats-bf').value) || null,
        notes: document.getElementById('stats-notes').value
      })
    });

    closeModal();
    await loadHealthStats();
    renderHealthStats();
  });
}

// Helper Functions
function formatDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

// Program Management Helpers
function showAddWorkoutModal(programId) {
  const content = `
    <form id="add-workout-form">
      <div class="form-group">
        <label class="form-label">Workout Name (e.g., Pull Day)</label>
        <input type="text" class="form-input" id="new-workout-name" required>
      </div>
      <div class="form-group">
        <label class="form-label">Day Number</label>
        <input type="number" class="form-input" id="new-workout-day" value="${state.currentProgram.workouts.length + 1}" required>
      </div>
      <button type="submit" class="btn btn-primary">Add Workout</button>
    </form>
  `;
  showModal('Add Workout Day', content);

  document.getElementById('add-workout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetchAPI(`/programs/${programId}/workouts`, {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('new-workout-name').value,
        day_number: parseInt(document.getElementById('new-workout-day').value)
      })
    });
    closeModal();
    await loadPrograms();
    viewProgram(programId);
  });
}

function showAddExerciseToProgramModal(workoutId) {
  const content = `
    <form id="add-exercise-to-program-form">
      <div class="form-group">
        <label class="form-label">Select Exercise</label>
        <select class="form-select" id="new-exercise-id" required>
          ${state.exercises.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Sets</label>
          <input type="number" class="form-input" id="new-exercise-sets" value="3" required>
        </div>
        <div class="form-group">
          <label class="form-label">Reps</label>
          <input type="text" class="form-input" id="new-exercise-reps" value="10" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">1RM (optional, for 5/3/1)</label>
        <input type="number" class="form-input" id="new-exercise-1rm" placeholder="Optional">
      </div>
      <button type="submit" class="btn btn-primary">Add Exercise</button>
    </form>
  `;
  showModal('Add Exercise to Workout', content);

  document.getElementById('add-exercise-to-program-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const programId = state.currentProgram.id;
    await fetchAPI(`/program-workouts/${workoutId}/exercises`, {
      method: 'POST',
      body: JSON.stringify({
        exercise_id: document.getElementById('new-exercise-id').value,
        sets: parseInt(document.getElementById('new-exercise-sets').value),
        reps: document.getElementById('new-exercise-reps').value,
        one_rm: parseFloat(document.getElementById('new-exercise-1rm').value) || null,
        exercise_order: 1 // Default
      })
    });
    closeModal();
    await loadPrograms();
    viewProgram(programId);
  });
}

async function updateProgramExerciseSets(id, sets, reps, oneRm) {
  const programId = state.currentProgram.id;
  await fetchAPI(`/program-exercises/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ sets, reps, one_rm: oneRm, notes: '' })
  });
  await loadPrograms();
  viewProgram(programId);
}

async function deleteProgramExercise(id) {
  if (!confirm('Remove this exercise from the program?')) return;
  const programId = state.currentProgram.id;
  await fetchAPI(`/program-exercises/${id}`, { method: 'DELETE' });
  await loadPrograms();
  viewProgram(programId);
}
