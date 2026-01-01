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
document.addEventListener('DOMContentLoaded', async () => {
  await loadExercises();
  await loadPrograms();
  await loadWorkoutLogs();
  await loadHealthStats();
  
  setupNavigation();
  setupEventListeners();
  
  renderCurrentView();
});

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
    <div class="card" onclick="viewWorkoutLog(${log.id})">
      <div class="card-header">
        <div>
          <div class="card-title">${log.workout_name || 'Custom Workout'}</div>
          <div class="card-subtitle">${log.program_name || ''}</div>
        </div>
        ${log.completed ? '<span class="badge badge-success">Completed</span>' : '<span class="badge">In Progress</span>'}
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
    <div class="card" onclick="viewProgram(${program.id})">
      <div class="card-header">
        <div>
          <div class="card-title">${program.name}</div>
          <div class="card-subtitle">${program.description || ''}</div>
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
  const programOptions = state.programs.map(p => 
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

function startWorkout(logId, workout) {
  state.currentWorkoutLog = logId;
  
  const exercisesHTML = workout.exercises.map(ex => {
    const sets = [];
    for (let i = 1; i <= ex.sets; i++) {
      sets.push(`
        <div class="set-entry">
          <span class="set-label">Set ${i}</span>
          <input type="number" class="set-input" placeholder="Reps" data-exercise="${ex.exercise_id}" data-set="${i}" data-type="reps" value="${ex.reps || ''}">
          <input type="number" class="set-input" placeholder="Weight" step="0.5" data-exercise="${ex.exercise_id}" data-set="${i}" data-type="weight" ${ex.weight_percentage ? `placeholder="${ex.weight_percentage}%"` : ''}>
          <input type="checkbox" class="set-check" data-exercise="${ex.exercise_id}" data-set="${i}">
        </div>
      `);
    }
    
    return `
      <div class="exercise-entry">
        <div class="exercise-entry-header">
          <div class="exercise-name">${ex.exercise_name}</div>
          <div class="text-muted">${ex.sets} sets × ${ex.reps} reps</div>
        </div>
        ${ex.notes ? `<div class="text-muted mb-2">${ex.notes}</div>` : ''}
        <div class="sets-container">
          ${sets.join('')}
        </div>
      </div>
    `;
  }).join('');
  
  document.getElementById('workout-detail-content').innerHTML = exercisesHTML;
  document.getElementById('workout-detail-title').textContent = workout.name;
  
  // Switch to workout detail view
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('workout-detail-view').classList.add('active');
}

function startCustomWorkout(logId) {
  state.currentWorkoutLog = logId;
  
  const content = `
    <div class="empty-state">
      <div class="empty-state-icon">🏋️</div>
      <div class="empty-state-text">Custom workouts allow you to add any exercises as you go</div>
      <p class="text-muted">Start logging sets and reps, and we'll track them for you!</p>
    </div>
  `;
  
  document.getElementById('workout-detail-content').innerHTML = content;
  document.getElementById('workout-detail-title').textContent = 'Custom Workout';
  
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('workout-detail-view').classList.add('active');
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

async function create531Program() {
  const content = `
    <form id="create-531-form">
      <div class="form-group">
        <label class="form-label">Program Name</label>
        <input type="text" class="form-input" id="program-name" value="5/3/1 Program" required>
      </div>
      <p class="text-muted mb-3">Select your main lifts for the 5/3/1 program:</p>
      <div class="form-group">
        <label class="form-label">Squat Exercise</label>
        <select class="form-select" id="squat-exercise" required>
          ${state.exercises.map(e => `<option value="${e.id}" ${e.name === 'Squat' ? 'selected' : ''}>${e.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Bench Press Exercise</label>
        <select class="form-select" id="bench-exercise" required>
          ${state.exercises.map(e => `<option value="${e.id}" ${e.name === 'Bench Press' ? 'selected' : ''}>${e.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Deadlift Exercise</label>
        <select class="form-select" id="deadlift-exercise" required>
          ${state.exercises.map(e => `<option value="${e.id}" ${e.name === 'Deadlift' ? 'selected' : ''}>${e.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Overhead Press Exercise</label>
        <select class="form-select" id="ohp-exercise" required>
          ${state.exercises.map(e => `<option value="${e.id}" ${e.name === 'Overhead Press' ? 'selected' : ''}>${e.name}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn btn-primary">Create 5/3/1 Program</button>
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
    
    // Create program
    const program = await fetchAPI('/programs', {
      method: 'POST',
      body: JSON.stringify({
        name: programName,
        description: '5/3/1 strength program with main lifts',
        program_type: '5/3/1'
      })
    });
    
    // Create 4 workouts (one for each main lift)
    const workouts = [
      { name: 'Squat Day', exercise_id: squatEx, day: 1 },
      { name: 'Bench Day', exercise_id: benchEx, day: 2 },
      { name: 'Deadlift Day', exercise_id: deadliftEx, day: 3 },
      { name: 'OHP Day', exercise_id: ohpEx, day: 4 }
    ];
    
    for (const workout of workouts) {
      const wo = await fetchAPI(`/programs/${program.id}/workouts`, {
        method: 'POST',
        body: JSON.stringify({
          name: workout.name,
          day_number: workout.day
        })
      });
      
      // Add main lift with 5/3/1 sets
      await fetchAPI(`/program-workouts/${wo.id}/exercises`, {
        method: 'POST',
        body: JSON.stringify({
          exercise_id: workout.exercise_id,
          sets: 3,
          reps: '5/3/1',
          weight_percentage: 75,
          notes: 'Week 1: 5 reps, Week 2: 3 reps, Week 3: 5/3/1',
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
  
  const workoutsHTML = program.workouts.map(workout => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${workout.name}</div>
          <div class="card-subtitle">Day ${workout.day_number}</div>
        </div>
      </div>
      <div class="mt-2">
        ${workout.exercises.map(ex => `
          <div class="card-meta mb-1">
            <strong>${ex.exercise_name}</strong> - ${ex.sets} × ${ex.reps} ${ex.weight_percentage ? `@ ${ex.weight_percentage}%` : ''}
            ${ex.notes ? `<div class="text-muted">${ex.notes}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
  
  document.getElementById('program-detail-title').textContent = program.name;
  document.getElementById('program-detail-content').innerHTML = `
    <div class="mb-3">
      <p class="text-muted">${program.description || ''}</p>
      ${program.program_type ? `<span class="badge badge-primary">${program.program_type}</span>` : ''}
    </div>
    ${workoutsHTML.length > 0 ? workoutsHTML : '<div class="empty-state">No workouts defined yet</div>'}
  `;
  
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('program-detail-view').classList.add('active');
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
