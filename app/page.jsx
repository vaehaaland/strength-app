'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const API_ROOT = '/api';
const STORAGE_KEYS = {
  profile: 'strength-tracker:profile:v1',
  goals: 'strength-tracker:goals:v1'
};
const NAV_LINKS = [
  { key: 'workouts', label: 'Workouts' },
  { key: 'programs', label: 'Programs' },
  { key: 'stats', label: 'Stats' }
];
const PROGRAM_TYPES = [
  { value: 'custom', label: 'Custom' },
  { value: '5/3/1', label: '5/3/1' },
  { value: 'linear', label: 'Linear Progression' },
  { value: 'ppl', label: 'Push / Pull / Legs' }
];

const fetchJson = async (endpoint, options = {}) => {
  const response = await fetch(`${API_ROOT}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    },
    ...options
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || 'Unexpected API error');
  }

  return payload;
};

const parseTimestamp = (value) => {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

const sortByDateDesc = (items = []) =>
  [...items].sort((a, b) => parseTimestamp(b.date) - parseTimestamp(a.date));

const sortByDateAsc = (items = []) =>
  [...items].sort((a, b) => parseTimestamp(a.date) - parseTimestamp(b.date));

function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      if (!stored) return initialValue;
      return JSON.parse(stored);
    } catch (error) {
      console.warn('Failed to read local storage key', key, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to write local storage key', key, error);
    }
  }, [key, value]);

  return [value, setValue];
}

export default function HomePage() {
  const [currentView, setCurrentView] = useState('workouts');
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [healthStats, setHealthStats] = useState([]);
  const [profile, setProfile] = useLocalStorageState(STORAGE_KEYS.profile, {
    height_cm: null
  });
  const [goals, setGoals] = useLocalStorageState(STORAGE_KEYS.goals, {
    target_weight_kg: null,
    target_body_fat_percentage: null,
    strength_goals_by_exercise_id: {}
  });
  const [loadingStates, setLoadingStates] = useState({
    workouts: false,
    programs: false,
    stats: false
  });
  const [modalState, setModalState] = useState({
    open: false,
    title: '',
    children: null
  });
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [programDetailLoadingId, setProgramDetailLoadingId] = useState(null);

  const loadWorkoutLogs = useCallback(async () => {
    setLoadingStates((prev) => ({ ...prev, workouts: true }));
    try {
      const data = await fetchJson('/workout-logs');
      setWorkoutLogs(data);
    } catch (error) {
      console.error('Unable to load workout logs', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, workouts: false }));
    }
  }, []);

  const loadPrograms = useCallback(async () => {
    setLoadingStates((prev) => ({ ...prev, programs: true }));
    try {
      const data = await fetchJson('/programs');
      setPrograms(data);
    } catch (error) {
      console.error('Unable to load programs', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, programs: false }));
    }
  }, []);

  const loadHealthStats = useCallback(async () => {
    setLoadingStates((prev) => ({ ...prev, stats: true }));
    try {
      const data = await fetchJson('/health-stats');
      setHealthStats(sortByDateDesc(data));
    } catch (error) {
      console.error('Unable to load health stats', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, stats: false }));
    }
  }, []);

  const loadExercises = useCallback(async () => {
    try {
      const data = await fetchJson('/exercises');
      setExercises(data);
    } catch (error) {
      console.error('Unable to load exercises', error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      if (!mounted) return;
      await Promise.all([loadWorkoutLogs(), loadPrograms(), loadHealthStats(), loadExercises()]);
    };
    loadAll();

    return () => {
      mounted = false;
    };
  }, [loadHealthStats, loadPrograms, loadWorkoutLogs]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => console.error('Service worker registration failed', error));
  }, []);

  const showModal = useCallback((title, children) => {
    setModalState({
      open: true,
      title,
      children
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => (prev.open ? { ...prev, open: false } : prev));
  }, []);

  const handleViewWorkout = useCallback(
    async (logId) => {
      setDetailLoadingId(logId);
      try {
        const log = await fetchJson(`/workout-logs/${logId}`);

        if (log.completed) {
          showModal(`Workout - ${formatDate(log.date)}`, <WorkoutDetail log={log} />);
          return;
        }

        let workoutTemplate = null;
        if (log.program_id && log.program_workout_id) {
          const program = await fetchJson(`/programs/${log.program_id}`);
          const match = (program.workouts || []).find(
            (workout) => String(workout.id) === String(log.program_workout_id)
          );
          if (match) workoutTemplate = match;
        }

        showModal(
          log.workout_name || 'Current Workout',
          <WorkoutEditor
            log={log}
            exercisesCatalog={exercises}
            templateWorkout={workoutTemplate}
            onClose={closeModal}
            onUpdated={async () => {
              await loadWorkoutLogs();
            }}
          />
        );
      } catch (error) {
        console.error('Unable to load workout detail', error);
      } finally {
        setDetailLoadingId(null);
      }
    },
    [closeModal, exercises, loadWorkoutLogs, showModal]
  );

  const handleViewProgram = useCallback(
    async (program) => {
      setProgramDetailLoadingId(program.id);
      try {
        const detail = await fetchJson(`/programs/${program.id}`);
        showModal(detail.name, (
          <ProgramDetail
            program={detail}
            exercises={exercises}
            onProgramChanged={async () => {
              await loadPrograms();
            }}
          />
        ));
      } catch (error) {
        console.error('Unable to load program detail', error);
      } finally {
        setProgramDetailLoadingId(null);
      }
    },
    [exercises, loadPrograms, showModal]
  );

  const handleStartWorkout = useCallback(() => {
    showModal(
      'Start Workout',
      <StartWorkoutForm
        programs={programs}
        onClose={closeModal}
        onStarted={async (logId) => {
          closeModal();
          await loadWorkoutLogs();
          await handleViewWorkout(logId);
        }}
      />
    );
  }, [closeModal, handleViewWorkout, loadWorkoutLogs, programs, showModal]);

  const handleCreateProgram = useCallback(
    async (values) => {
      try {
        const created = await fetchJson('/programs', {
          method: 'POST',
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            program_type: values.program_type
          })
        });

        if (values.program_type === '5/3/1') {
          const lifts = Array.isArray(values.lifts) ? values.lifts : [];
          for (let index = 0; index < lifts.length; index += 1) {
            const lift = lifts[index];
            if (!lift?.exercise_id || !lift?.one_rm) continue;
            const workout = await fetchJson(`/programs/${created.id}/workouts`, {
              method: 'POST',
              body: JSON.stringify({
                name: `${lift.label} Day`,
                day_number: index + 1
              })
            });

            await fetchJson(`/program-workouts/${workout.id}/exercises`, {
              method: 'POST',
              body: JSON.stringify({
                exercise_id: lift.exercise_id,
                sets: 3,
                reps: '5/3/1',
                weight_percentage: 90,
                one_rm: lift.one_rm,
                notes: 'Standard 5/3/1 sets',
                exercise_order: 1
              })
            });
          }
        }

        closeModal();
        await loadPrograms();
        setCurrentView('programs');
      } catch (error) {
        console.error('Failed to create program', error);
      }
    },
    [closeModal, loadPrograms]
  );

  const handleSaveStats = useCallback(
    async (values) => {
      try {
        await fetchJson('/health-stats', {
          method: 'POST',
          body: JSON.stringify(values)
        });
        closeModal();
        await loadHealthStats();
        setCurrentView('stats');
      } catch (error) {
        console.error('Failed to save stats', error);
      }
    },
    [closeModal, loadHealthStats]
  );

  const sortedStats = useMemo(() => sortByDateDesc(healthStats), [healthStats]);
  const latestStats = sortedStats[0] ?? null;
  const statsHistory = sortedStats.slice(1);
  const previousStats = sortedStats[1] ?? null;

  const openGoalsModal = useCallback(() => {
    showModal(
      'Goals & Profile',
      <GoalsForm
        profile={profile}
        goals={goals}
        exercises={exercises}
        onSubmit={({ nextProfile, nextGoals }) => {
          setProfile(nextProfile);
          setGoals(nextGoals);
          closeModal();
        }}
        onCancel={closeModal}
      />
    );
  }, [closeModal, exercises, goals, profile, setGoals, setProfile, showModal]);

  return (
    <>
      <NavBar currentView={currentView} onChangeView={setCurrentView} />

      <main className="main">
        {currentView === 'workouts' && (
          <WorkoutsView
            workouts={workoutLogs}
            loading={loadingStates.workouts}
            onStartWorkout={handleStartWorkout}
            onViewWorkout={handleViewWorkout}
            detailLoadingId={detailLoadingId}
            isActive={currentView === 'workouts'}
          />
        )}

        {currentView === 'programs' && (
          <ProgramsView
            programs={programs}
            loading={loadingStates.programs}
            onCreateProgram={() =>
              showModal(
                'Create Program',
                <ProgramForm exercises={exercises} onSubmit={handleCreateProgram} />
              )
            }
            onViewProgram={handleViewProgram}
            isActive={currentView === 'programs'}
            programDetailLoadingId={programDetailLoadingId}
          />
        )}

        {currentView === 'stats' && (
          <StatsView
            stats={statsHistory}
            allStats={sortedStats}
            latestStats={latestStats}
            previousStats={previousStats}
            profile={profile}
            goals={goals}
            exercises={exercises}
            loading={loadingStates.stats}
            onAddEntry={() =>
              showModal('Add Health Stats', <StatsForm onSubmit={handleSaveStats} />)
            }
            onEditGoals={openGoalsModal}
            isActive={currentView === 'stats'}
          />
        )}
      </main>

      <Modal open={modalState.open} title={modalState.title} onClose={closeModal}>
        {modalState.children}
      </Modal>
    </>
  );
}

function NavBar({ currentView, onChangeView }) {
  return (
    <nav className="nav">
      <div className="nav-container">
        <h1 className="nav-title">🏋️ Strength Tracker</h1>
        <div className="nav-links">
          {NAV_LINKS.map((link) => (
            <button
              key={link.key}
              className={`nav-link${currentView === link.key ? ' active' : ''}`}
              onClick={() => onChangeView(link.key)}
              type="button"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function WorkoutsView({
  workouts,
  loading,
  onStartWorkout,
  onViewWorkout,
  detailLoadingId,
  isActive
}) {
  return (
    <section className={`view${isActive ? ' active' : ''}`}>
      <div className="view-header">
        <h2>Workout Log</h2>
        <button className="btn btn-primary" type="button" onClick={onStartWorkout}>
          Start Workout
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Loading workouts…</p>
      ) : workouts.length === 0 ? (
        <EmptyState
          icon="💪"
          text="No workouts have been logged yet."
          action={{ label: 'Start Your First Workout', handler: onStartWorkout }}
        />
      ) : (
        <div className="list">
          {workouts.map((log) => (
            <div
              key={log.id}
              className={`card ${log.completed ? '' : 'card-in-progress'}`}
              onClick={() => onViewWorkout(log.id)}
              role="button"
              tabIndex={0}
            >
              <div className="card-header">
                <div>
                  <div className="card-title">{log.workout_name || 'Custom Workout'}</div>
                  <div className="card-subtitle">{log.program_name || 'Standalone session'}</div>
                </div>
                <Badge variant={log.completed ? 'success' : 'primary'}>
                  {log.completed
                    ? 'Completed'
                    : detailLoadingId === log.id
                    ? 'Loading…'
                    : 'In Progress'}
                </Badge>
              </div>
              <div className="card-meta">
                <span>📅 {formatDate(log.date)}</span>
                {log.notes && <span>🗒 {log.notes}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProgramsView({
  programs,
  loading,
  onCreateProgram,
  onViewProgram,
  isActive,
  programDetailLoadingId
}) {
  return (
    <section className={`view${isActive ? ' active' : ''}`}>
      <div className="view-header">
        <h2>Training Programs</h2>
        <button className="btn btn-primary" type="button" onClick={onCreateProgram}>
          Create Program
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Loading programs…</p>
      ) : programs.length === 0 ? (
        <EmptyState
          icon="📆"
          text="No programs defined yet."
          action={{ label: 'Create a Program', handler: onCreateProgram }}
        />
      ) : (
        <div className="list">
          {programs.map((program) => (
            <div
              key={program.id}
              className="card"
              onClick={() => onViewProgram(program)}
              role="button"
              tabIndex={0}
            >
              <div className="card-header">
                <div>
                  <div className="card-title">{program.name}</div>
                  <div className="card-subtitle">{program.description || 'No description'}</div>
                </div>
                <div className="d-flex gap-1">
                  {program.program_type && <Badge variant="primary">{program.program_type}</Badge>}
                  <Badge variant={program.is_active ? 'success' : 'secondary'}>
                    {program.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="card-meta">
                <span>📅 {formatDate(program.created_at)}</span>
                {programDetailLoadingId === program.id && <span>Loading…</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
const getTrend = (latestValue, previousValue) => {
  if (latestValue == null || previousValue == null) return null;
  const delta = Number(latestValue) - Number(previousValue);
  if (!Number.isFinite(delta)) return null;

  const epsilon = 0.001;
  if (Math.abs(delta) <= epsilon) {
    return { direction: 'flat', delta: 0 };
  }
  return { direction: delta > 0 ? 'up' : 'down', delta };
};

const formatTrend = (trend, unit = '') => {
  if (!trend) return null;
  const arrow = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→';
  const magnitude = Math.abs(trend.delta);
  const formatted = magnitude >= 10 ? magnitude.toFixed(0) : magnitude.toFixed(1);
  return `${arrow} ${formatted}${unit}`;
};

const clampNumber = (value, min, max) => Math.max(min, Math.min(max, value));

function MiniLineChart({ points, stroke = 'var(--primary)', height = 90 }) {
  const safePoints = Array.isArray(points) ? points.filter((p) => Number.isFinite(p?.y)) : [];
  if (safePoints.length < 2) {
    return <div className="chart-empty text-muted">Not enough data to chart yet.</div>;
  }

  const width = 320;
  const paddingX = 10;
  const paddingY = 10;
  const minY = Math.min(...safePoints.map((p) => p.y));
  const maxY = Math.max(...safePoints.map((p) => p.y));
  const rangeY = maxY - minY || 1;

  const toX = (idx) =>
    paddingX + (idx * (width - paddingX * 2)) / Math.max(1, safePoints.length - 1);
  const toY = (y) => paddingY + ((maxY - y) * (height - paddingY * 2)) / rangeY;

  const path = safePoints
    .map((point, idx) => `${toX(idx).toFixed(2)},${toY(point.y).toFixed(2)}`)
    .join(' ');

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Trend chart"
      >
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={path}
        />
        {safePoints.map((point, idx) => (
          <circle key={`${point.x ?? idx}`} cx={toX(idx)} cy={toY(point.y)} r="3.5" fill={stroke}>
            <title>{`${point.label ?? ''}${point.label ? ': ' : ''}${point.y}`}</title>
          </circle>
        ))}
      </svg>
      <div className="chart-labels">
        <span className="text-muted">{safePoints[0].label}</span>
        <span className="text-muted">{safePoints[safePoints.length - 1].label}</span>
      </div>
    </div>
  );
}

function StatsView({
  stats,
  allStats,
  latestStats,
  previousStats,
  profile,
  goals,
  exercises,
  loading,
  onAddEntry,
  onEditGoals,
  isActive
}) {
  const weightTrend = useMemo(
    () => getTrend(latestStats?.weight, previousStats?.weight),
    [latestStats?.weight, previousStats?.weight]
  );
  const bodyFatTrend = useMemo(
    () => getTrend(latestStats?.body_fat_percentage, previousStats?.body_fat_percentage),
    [latestStats?.body_fat_percentage, previousStats?.body_fat_percentage]
  );

  const bmi = useMemo(() => {
    const weight = latestStats?.weight;
    const heightCm = profile?.height_cm;
    if (weight == null || heightCm == null) return null;
    const heightM = Number(heightCm) / 100;
    if (!Number.isFinite(heightM) || heightM <= 0) return null;
    const bmiValue = Number(weight) / (heightM * heightM);
    if (!Number.isFinite(bmiValue)) return null;
    return clampNumber(bmiValue, 0, 100);
  }, [latestStats?.weight, profile?.height_cm]);

  const weightPoints = useMemo(() => {
    const ordered = sortByDateAsc(allStats || []);
    return ordered
      .filter((entry) => entry?.weight != null)
      .map((entry) => ({
        x: parseTimestamp(entry.date),
        y: Number(entry.weight),
        label: formatDateShort(entry.date)
      }));
  }, [allStats]);

  const bodyFatPoints = useMemo(() => {
    const ordered = sortByDateAsc(allStats || []);
    return ordered
      .filter((entry) => entry?.body_fat_percentage != null)
      .map((entry) => ({
        x: parseTimestamp(entry.date),
        y: Number(entry.body_fat_percentage),
        label: formatDateShort(entry.date)
      }));
  }, [allStats]);

  return (
    <section className={`view${isActive ? ' active' : ''}`}>
      <div className="view-header">
        <h2>Health Stats</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline" type="button" onClick={onEditGoals}>
            Goals
          </button>
          <button className="btn btn-primary" type="button" onClick={onAddEntry}>
            Add Entry
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Loading stats.</p>
      ) : latestStats ? (
        <>
          <div className="stats-grid mb-3">
            {latestStats.weight != null && (
              <StatCard
                label="Weight (kg)"
                value={`${latestStats.weight}`}
                trend={formatTrend(weightTrend, 'kg')}
                trendDirection={weightTrend?.direction ?? null}
              />
            )}
            {latestStats.body_fat_percentage != null && (
              <StatCard
                label="Body Fat"
                value={`${latestStats.body_fat_percentage}%`}
                trend={formatTrend(bodyFatTrend, '%')}
                trendDirection={bodyFatTrend?.direction ?? null}
              />
            )}
            {bmi != null && <StatCard label="BMI" value={bmi.toFixed(1)} trendDirection={null} />}
          </div>

          <div className="list mb-3">
            <div className="card chart-card" role="region" aria-label="Weight over time chart">
              <div className="card-header">
                <div>
                  <div className="card-title">Weight Over Time</div>
                  <div className="card-subtitle">
                    {goals?.target_weight_kg != null
                      ? `Goal: ${goals.target_weight_kg} kg`
                      : 'Set a target weight in Goals.'}
                  </div>
                </div>
              </div>
              <MiniLineChart points={weightPoints} stroke="var(--primary)" />
            </div>

            <div className="card chart-card" role="region" aria-label="Body fat over time chart">
              <div className="card-header">
                <div>
                  <div className="card-title">Body Fat Over Time</div>
                  <div className="card-subtitle">
                    {goals?.target_body_fat_percentage != null
                      ? `Goal: ${goals.target_body_fat_percentage}%`
                      : 'Set a target body fat in Goals.'}
                  </div>
                </div>
              </div>
              <MiniLineChart points={bodyFatPoints} stroke="#8b5cf6" />
            </div>

            <StrengthProgressCard exercises={exercises} goals={goals} />
          </div>

          <div className="list">
            {stats.map((entry) => (
              <div key={entry.id} className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">{formatDate(entry.date)}</div>
                    <div className="card-subtitle">
                      {entry.weight ? `Weight: ${entry.weight} kg` : ''}
                      {entry.body_fat_percentage ? ` · Body Fat: ${entry.body_fat_percentage}%` : ''}
                    </div>
                  </div>
                </div>
                {entry.notes && <div className="card-meta text-muted">{entry.notes}</div>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon="??"
          text="No health stats recorded yet."
          action={{ label: 'Add Entry', handler: onAddEntry }}
        />
      )}
    </section>
  );
}

function StatsViewLegacy({ stats, latestStats, loading, onAddEntry, isActive }) {
  return (
    <section className={`view${isActive ? ' active' : ''}`}>
      <div className="view-header">
        <h2>Health Stats</h2>
        <button className="btn btn-primary" type="button" onClick={onAddEntry}>
          Add Entry
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Loading stats…</p>
      ) : latestStats ? (
        <>
          <div className="stats-grid mb-3">
            {latestStats.weight && (
              <StatCard label="Weight (kg)" value={`${latestStats.weight}`} />
            )}
            {latestStats.body_fat_percentage && (
              <StatCard label="Body Fat" value={`${latestStats.body_fat_percentage}%`} />
            )}
          </div>
          <div className="list">
            {stats.map((entry) => (
              <div key={entry.id} className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">{formatDate(entry.date)}</div>
                    <div className="card-subtitle">
                      {entry.weight ? `Weight: ${entry.weight} kg` : ''}
                      {entry.body_fat_percentage ? ` • Body Fat: ${entry.body_fat_percentage}%` : ''}
                    </div>
                  </div>
                </div>
                {entry.notes && <div className="card-meta text-muted">{entry.notes}</div>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon="📈"
          text="No health stats recorded yet."
          action={{ label: 'Add Entry', handler: onAddEntry }}
        />
      )}
    </section>
  );
}

function Modal({ open, title, onClose, children }) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal active" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-content">
        <button className="modal-close" type="button" onClick={onClose}>
          &times;
        </button>
        {title && <h2 className="mb-3">{title}</h2>}
        <div id="modal-body">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-text">{text}</div>
      {action && (
        <button className="btn btn-primary" type="button" onClick={action.handler}>
          {action.label}
        </button>
      )}
    </div>
  );
}

function Badge({ variant, children }) {
  const classes = ['badge'];
  if (variant === 'success') classes.push('badge-success');
  if (variant === 'primary') classes.push('badge-primary');
  if (variant === 'secondary') classes.push('badge-secondary');
  return <span className={classes.join(' ')}>{children}</span>;
}

function StatCard({ label, value, trend, trendDirection }) {
  const trendClass =
    trendDirection === 'up'
      ? 'trend-up'
      : trendDirection === 'down'
      ? 'trend-down'
      : trendDirection === 'flat'
      ? 'trend-flat'
      : '';

  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">
        {label}
        {trend ? <span className={`stat-trend ${trendClass}`}>{trend}</span> : null}
      </div>
    </div>
  );
}

function GoalsForm({ profile, goals, exercises, onSubmit, onCancel }) {
  const [heightCm, setHeightCm] = useState(profile?.height_cm ?? '');
  const [targetWeightKg, setTargetWeightKg] = useState(goals?.target_weight_kg ?? '');
  const [targetBodyFat, setTargetBodyFat] = useState(goals?.target_body_fat_percentage ?? '');

  const submit = (event) => {
    event.preventDefault();

    const nextProfile = {
      ...(profile ?? {}),
      height_cm: heightCm === '' ? null : Number(heightCm)
    };

    const nextGoals = {
      ...(goals ?? {}),
      target_weight_kg: targetWeightKg === '' ? null : Number(targetWeightKg),
      target_body_fat_percentage: targetBodyFat === '' ? null : Number(targetBodyFat),
      strength_goals_by_exercise_id: goals?.strength_goals_by_exercise_id ?? {}
    };

    onSubmit({ nextProfile, nextGoals });
  };

  return (
    <form onSubmit={submit}>
      <div className="form-group">
        <label className="form-label" htmlFor="profile-height">
          Height (cm) (for BMI)
        </label>
        <input
          className="form-input"
          id="profile-height"
          type="number"
          step="0.1"
          value={heightCm}
          onChange={(event) => setHeightCm(event.target.value)}
          placeholder="e.g. 180"
        />
        <p className="text-muted small mt-1">BMI uses your latest weight entry and height.</p>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="goal-weight">
            Target Weight (kg)
          </label>
          <input
            className="form-input"
            id="goal-weight"
            type="number"
            step="0.1"
            value={targetWeightKg}
            onChange={(event) => setTargetWeightKg(event.target.value)}
            placeholder="e.g. 85"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="goal-bf">
            Target Body Fat (%)
          </label>
          <input
            className="form-input"
            id="goal-bf"
            type="number"
            step="0.1"
            value={targetBodyFat}
            onChange={(event) => setTargetBodyFat(event.target.value)}
            placeholder="e.g. 15"
          />
        </div>
      </div>

      {!!(exercises || []).length && (
        <p className="text-muted small">
          Strength goals per exercise are supported in storage, but the UI depends on how you want to measure progress
          (estimated 1RM vs. max weight vs. volume).
        </p>
      )}

      <div className="d-flex gap-2 mt-2">
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" type="submit">
          Save
        </button>
      </div>
    </form>
  );
}

function StrengthProgressCard({ exercises, goals }) {
  const [exerciseId, setExerciseId] = useState('');
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedExercise = useMemo(
    () => (exercises || []).find((exercise) => String(exercise.id) === String(exerciseId)) ?? null,
    [exerciseId, exercises]
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!exerciseId) {
        setSeries([]);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchJson(`/strength-progress?exercise_id=${encodeURIComponent(exerciseId)}`);
        if (!mounted) return;
        setSeries(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load strength progress', error);
        if (mounted) setSeries([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [exerciseId]);

  const points = useMemo(() => {
    return (series || []).map((row) => ({
      x: parseTimestamp(row.date),
      y: Number(row.estimated_1rm),
      label: formatDateShort(row.date)
    }));
  }, [series]);

  const goalValue = useMemo(() => {
    const map = goals?.strength_goals_by_exercise_id ?? {};
    return map?.[exerciseId] ?? null;
  }, [exerciseId, goals?.strength_goals_by_exercise_id]);

  return (
    <div className="card chart-card" role="region" aria-label="Strength progress chart">
      <div className="card-header">
        <div>
          <div className="card-title">Strength Progress</div>
          <div className="card-subtitle">
            {selectedExercise ? (
              <>
                Estimated 1RM for <strong>{selectedExercise.name}</strong>
                {goalValue != null ? ` · Goal: ${goalValue}` : ''}
              </>
            ) : (
              'Pick an exercise to chart your estimated 1RM.'
            )}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="strength-exercise">
          Exercise
        </label>
        <select
          className="form-select"
          id="strength-exercise"
          value={exerciseId}
          onChange={(event) => setExerciseId(event.target.value)}
        >
          <option value="">Select exercise.</option>
          {(exercises || []).map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? <div className="text-muted">Loading strength progress.</div> : <MiniLineChart points={points} stroke="#16a34a" />}
    </div>
  );
}

function ProgramForm({ onSubmit, exercises }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [programType, setProgramType] = useState(PROGRAM_TYPES[0].value);
  const [lifts, setLifts] = useState(() => [
    { label: 'Squat', exercise_id: '', one_rm: '' },
    { label: 'Bench Press', exercise_id: '', one_rm: '' },
    { label: 'Deadlift', exercise_id: '', one_rm: '' },
    { label: 'Overhead Press', exercise_id: '', one_rm: '' }
  ]);

  useEffect(() => {
    if (programType !== '5/3/1') return;
    if (!Array.isArray(exercises) || exercises.length === 0) return;

    const matchByName = (targetName) => {
      const found = exercises.find((exercise) => exercise.name === targetName);
      return found ? String(found.id) : '';
    };

    setLifts((prev) =>
      prev.map((lift) => {
        if (lift.exercise_id) return lift;
        return {
          ...lift,
          exercise_id:
            lift.label === 'Squat'
              ? matchByName('Squat')
              : lift.label === 'Bench Press'
              ? matchByName('Bench Press')
              : lift.label === 'Deadlift'
              ? matchByName('Deadlift')
              : matchByName('Overhead Press')
        };
      })
    );
  }, [exercises, programType]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      name,
      description,
      program_type: programType,
      lifts:
        programType === '5/3/1'
          ? lifts.map((lift) => ({
              label: lift.label,
              exercise_id: lift.exercise_id ? parseInt(lift.exercise_id, 10) : null,
              one_rm: lift.one_rm ? parseFloat(lift.one_rm) : null
            }))
          : []
    });
  };

  return (
    <form id="create-program-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="program-name">
          Program Name
        </label>
        <input
          className="form-input"
          id="program-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="program-description">
          Description
        </label>
        <textarea
          className="form-textarea"
          id="program-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="program-type">
          Program Type
        </label>
        <select
          className="form-select"
          id="program-type"
          value={programType}
          onChange={(event) => setProgramType(event.target.value)}
        >
          {PROGRAM_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {programType === '5/3/1' && (
        <div className="mb-3">
          <p className="text-muted mb-2">Select lifts and enter your current 1RM (kg):</p>
          {lifts.map((lift, idx) => (
            <div key={lift.label} className="form-row mb-2">
              <div className="form-group">
                <label className="form-label">{lift.label}</label>
                <select
                  className="form-select"
                  value={lift.exercise_id}
                  onChange={(event) => {
                    const value = event.target.value;
                    setLifts((prev) =>
                      prev.map((item, itemIdx) =>
                        itemIdx === idx ? { ...item, exercise_id: value } : item
                      )
                    );
                  }}
                >
                  <option value="">Select exercise…</option>
                  {(exercises || []).map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">1RM</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.5"
                  value={lift.one_rm}
                  onChange={(event) => {
                    const value = event.target.value;
                    setLifts((prev) =>
                      prev.map((item, itemIdx) =>
                        itemIdx === idx ? { ...item, one_rm: value } : item
                      )
                    );
                  }}
                  required
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-primary" type="submit">
        Create Program
      </button>
    </form>
  );
}

function StatsForm({ onSubmit }) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      date,
      weight: weight ? parseFloat(weight) : null,
      body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null,
      notes
    });
  };

  return (
    <form id="add-stats-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="stats-date">
          Date
        </label>
        <input
          className="form-input"
          id="stats-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="stats-weight">
            Weight (kg)
          </label>
          <input
            className="form-input"
            id="stats-weight"
            type="number"
            step="0.1"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="stats-bf">
            Body Fat %
          </label>
          <input
            className="form-input"
            id="stats-bf"
            type="number"
            step="0.1"
            value={bodyFat}
            onChange={(event) => setBodyFat(event.target.value)}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="stats-notes">
          Notes (optional)
        </label>
        <textarea
          className="form-textarea"
          id="stats-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
      <button className="btn btn-primary" type="submit">
        Save Stats
      </button>
    </form>
  );
}

function StartWorkoutForm({ programs, onClose, onStarted }) {
  const [programId, setProgramId] = useState('');
  const [workoutId, setWorkoutId] = useState('');
  const [workouts, setWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const activePrograms = useMemo(
    () => (Array.isArray(programs) ? programs.filter((p) => p.is_active !== 0) : []),
    [programs]
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!programId) {
        setWorkouts([]);
        setWorkoutId('');
        return;
      }
      setLoadingWorkouts(true);
      try {
        const program = await fetchJson(`/programs/${programId}`);
        if (!mounted) return;
        setWorkouts(program.workouts || []);
        setWorkoutId('');
      } catch (error) {
        console.error('Unable to load program workouts', error);
      } finally {
        if (mounted) setLoadingWorkouts(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [programId]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const created = await fetchJson('/workout-logs', {
        method: 'POST',
        body: JSON.stringify({
          program_workout_id: workoutId ? parseInt(workoutId, 10) : null,
          date,
          notes
        })
      });
      await onStarted(created.id);
    } catch (error) {
      console.error('Failed to start workout', error);
    }
  };

  return (
    <form id="start-workout-form" onSubmit={submit}>
      <div className="form-group">
        <label className="form-label" htmlFor="program-select">
          Select Program Workout
        </label>
        <select
          className="form-select"
          id="program-select"
          value={programId}
          onChange={(event) => setProgramId(event.target.value)}
        >
          <option value="">Custom Workout</option>
          {activePrograms.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
      </div>

      {programId && (
        <div className="form-group">
          <label className="form-label" htmlFor="workout-select">
            Select Workout
          </label>
          <select
            className="form-select"
            id="workout-select"
            value={workoutId}
            onChange={(event) => setWorkoutId(event.target.value)}
            required
            disabled={loadingWorkouts}
          >
            <option value="">Select a workout</option>
            {workouts.map((workout) => (
              <option key={workout.id} value={workout.id}>
                {workout.name} - Day {workout.day_number}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="workout-date">
          Date
        </label>
        <input
          type="date"
          className="form-input"
          id="workout-date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="workout-notes">
          Notes (optional)
        </label>
        <textarea
          className="form-textarea"
          id="workout-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-secondary" type="button" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" type="submit">
          Start Workout
        </button>
      </div>
    </form>
  );
}

function WorkoutEditor({ log, templateWorkout, exercisesCatalog, onClose, onUpdated }) {
  const [week, setWeek] = useState(1);
  const [exerciseLogs, setExerciseLogs] = useState(() => (log.exercises ? [...log.exercises] : []));
  const [exerciseEntries, setExerciseEntries] = useState(() => {
    const logs = Array.isArray(log.exercises) ? log.exercises : [];
    const map = new Map();

    const addOrUpdate = (entry) => {
      const existing = map.get(entry.exercise_id);
      const next = existing
        ? { ...existing, ...entry, sets: Math.max(existing.sets || 1, entry.sets || 1) }
        : { ...entry };
      map.set(entry.exercise_id, next);
    };

    if (templateWorkout?.exercises?.length) {
      templateWorkout.exercises.forEach((ex) => {
        addOrUpdate({
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_name,
          sets: ex.sets || 1,
          reps: ex.reps || '',
          one_rm: ex.one_rm ?? null
        });
      });
    }

    logs.forEach((entry) => {
      const maxSet = entry.set_number || 1;
      if (map.has(entry.exercise_id)) {
        addOrUpdate({
          exercise_id: entry.exercise_id,
          exercise_name: entry.exercise_name,
          sets: maxSet
        });
      } else {
        addOrUpdate({
          exercise_id: entry.exercise_id,
          exercise_name: entry.exercise_name,
          sets: maxSet,
          reps: '',
          one_rm: null
        });
      }
    });

    return Array.from(map.values());
  });

  const logMap = useMemo(() => {
    const map = new Map();
    exerciseLogs.forEach((entry) => {
      map.set(`${entry.exercise_id}:${entry.set_number}`, entry);
    });
    return map;
  }, [exerciseLogs]);

  const is531 = useMemo(
    () => exerciseEntries.some((ex) => ex.reps === '5/3/1' && ex.one_rm),
    [exerciseEntries]
  );

  const get531 = (setNumber) => {
    const table = {
      1: { perc: [0.65, 0.75, 0.85], reps: [5, 5, 5] },
      2: { perc: [0.7, 0.8, 0.9], reps: [3, 3, 3] },
      3: { perc: [0.75, 0.85, 0.95], reps: [5, 3, 1] },
      4: { perc: [0.4, 0.5, 0.6], reps: [5, 5, 5] }
    }[week] || { perc: [0.65, 0.75, 0.85], reps: [5, 5, 5] };

    return { percent: table.perc[setNumber - 1], reps: table.reps[setNumber - 1] };
  };

  const roundTo2_5 = (value) => Math.round(value / 2.5) * 2.5;

  const saveSet = useCallback(
    async (exerciseId, setNumber, reps, weight, completed) => {
      await fetchJson(`/workout-logs/${log.id}/exercises`, {
        method: 'POST',
        body: JSON.stringify({
          exercise_id: exerciseId,
          set_number: setNumber,
          reps: reps || 0,
          weight: weight || 0,
          completed: completed ? 1 : 0,
          notes: ''
        })
      });

      setExerciseLogs((prev) => {
        const next = [...prev];
        const idx = next.findIndex(
          (entry) => entry.exercise_id === exerciseId && entry.set_number === setNumber
        );
        const exerciseName =
          next[idx]?.exercise_name ||
          exerciseEntries.find((ex) => ex.exercise_id === exerciseId)?.exercise_name ||
          '';
        const updated = {
          ...(idx >= 0 ? next[idx] : {}),
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          set_number: setNumber,
          reps: reps || 0,
          weight: weight || 0,
          completed: completed ? 1 : 0
        };
        if (idx >= 0) next[idx] = updated;
        else next.push(updated);
        return next;
      });
    },
    [exerciseEntries, log.id]
  );

  const saveFromRow = async (row) => {
    const exerciseId = parseInt(row.dataset.exerciseId, 10);
    const setNumber = parseInt(row.dataset.setNumber, 10);
    const repsInput = row.querySelector('input[data-field=\"reps\"]');
    const weightInput = row.querySelector('input[data-field=\"weight\"]');
    const completedInput = row.querySelector('input[data-field=\"completed\"]');

    const reps = repsInput?.value ? parseInt(repsInput.value, 10) : 0;
    const weight = weightInput?.value ? parseFloat(weightInput.value) : 0;
    const completed = completedInput?.checked ?? false;

    await saveSet(exerciseId, setNumber, reps, weight, completed);
  };

  const completeWorkout = async () => {
    await fetchJson(`/workout-logs/${log.id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: true, notes: log.notes || '' })
    });
    await onUpdated?.();
    onClose?.();
  };

  const deleteWorkout = async () => {
    await fetchJson(`/workout-logs/${log.id}`, { method: 'DELETE' });
    await onUpdated?.();
    onClose?.();
  };

  const [addExerciseId, setAddExerciseId] = useState('');

  const addExercise = () => {
    if (!addExerciseId) return;
    const found = (exercisesCatalog || []).find((ex) => String(ex.id) === String(addExerciseId));
    if (!found) return;
    setExerciseEntries((prev) => [
      ...prev,
      { exercise_id: found.id, exercise_name: found.name, sets: 1, reps: '10', one_rm: null }
    ]);
    setAddExerciseId('');
  };

  return (
    <div>
      {is531 && (
        <div className="mb-3 p-3 bg-light rounded shadow-sm">
          <label className="form-label" htmlFor="week-selector">
            5/3/1 Week Selector
          </label>
          <select
            className="form-select"
            id="week-selector"
            value={week}
            onChange={(event) => setWeek(parseInt(event.target.value, 10))}
          >
            <option value={1}>Week 1 (5/5/5+ @ 65, 75, 85%)</option>
            <option value={2}>Week 2 (3/3/3+ @ 70, 80, 90%)</option>
            <option value={3}>Week 3 (5/3/1+ @ 75, 85, 95%)</option>
            <option value={4}>Week 4 (Deload @ 40, 50, 60%)</option>
          </select>
          <p className="text-muted small mt-1">Weights use a 90% training max and round to 2.5kg.</p>
        </div>
      )}

      {exerciseEntries.length === 0 ? (
        <p className="text-muted">No exercises yet. Add one below.</p>
      ) : (
        exerciseEntries.map((exercise) => (
          <div key={exercise.exercise_id} className="exercise-entry" data-exercise-id={exercise.exercise_id}>
            <div className="exercise-entry-header">
              <div className="exercise-name">{exercise.exercise_name}</div>
              <div className="text-muted">
                {exercise.sets} sets {exercise.reps ? `x ${exercise.reps}` : ''}
              </div>
            </div>
            <div className="sets-container">
              {Array.from({ length: exercise.sets }, (_, idx) => {
                const setNumber = idx + 1;
                const saved = logMap.get(`${exercise.exercise_id}:${setNumber}`);
                const defaultReps =
                  saved?.reps ??
                  (exercise.reps === '5/3/1' ? get531(setNumber).reps : parseInt(exercise.reps, 10) || '');
                let defaultWeight = saved?.weight ?? '';
                if (defaultWeight === '' && exercise.reps === '5/3/1' && exercise.one_rm && setNumber <= 3) {
                  const tm = exercise.one_rm * 0.9;
                  const suggested = roundTo2_5(tm * (get531(setNumber).percent || 0.5));
                  defaultWeight = suggested || '';
                }
                const defaultCompleted = Boolean(saved?.completed);

                return (
                  <div
                    key={`${exercise.exercise_id}-${setNumber}`}
                    className="set-entry"
                    data-set-entry="1"
                    data-exercise-id={exercise.exercise_id}
                    data-set-number={setNumber}
                  >
                    <div className="set-header">
                      <span className="set-label">Set {setNumber}</span>
                      <input
                        type="checkbox"
                        className="set-check"
                        data-field="completed"
                        defaultChecked={defaultCompleted}
                        onChange={(event) => {
                          const row = event.currentTarget.closest('[data-set-entry=\"1\"]');
                          if (row) saveFromRow(row);
                        }}
                      />
                    </div>
                    <div className="set-inputs">
                      <div className="set-input-group">
                        <label className="mobile-only-label">Reps</label>
                        <input
                          type="number"
                          className="set-input"
                          placeholder="Reps"
                          data-field="reps"
                          defaultValue={defaultReps}
                          onBlur={(event) => {
                            const row = event.currentTarget.closest('[data-set-entry=\"1\"]');
                            if (row) saveFromRow(row);
                          }}
                        />
                      </div>
                      <div className="set-input-group">
                        <label className="mobile-only-label">Weight</label>
                        <input
                          type="number"
                          className="set-input"
                          placeholder="Weight"
                          step="0.5"
                          data-field="weight"
                          defaultValue={defaultWeight}
                          onBlur={(event) => {
                            const row = event.currentTarget.closest('[data-set-entry=\"1\"]');
                            if (row) saveFromRow(row);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-2">
                <button
                  className="btn btn-sm btn-outline"
                  type="button"
                  onClick={() =>
                    setExerciseEntries((prev) =>
                      prev.map((entry) =>
                        entry.exercise_id === exercise.exercise_id
                          ? { ...entry, sets: (entry.sets || 1) + 1 }
                          : entry
                      )
                    )
                  }
                >
                  + Add Set
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      <div className="mt-4 p-3 bg-light rounded shadow-sm">
        <h3 className="mb-3">Add Exercise</h3>
        <div className="form-group">
          <select
            className="form-select"
            value={addExerciseId}
            onChange={(event) => setAddExerciseId(event.target.value)}
          >
            <option value="">Select exercise to add…</option>
            {(exercisesCatalog || []).map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-secondary w-100" type="button" onClick={addExercise}>
          Add to Workout
        </button>
      </div>

      <div className="workout-actions">
        <div className="button-group" role="group" aria-label="Workout actions">
          <button className="btn btn-success" type="button" onClick={completeWorkout}>
            Complete Workout
          </button>
          <button className="btn btn-danger" type="button" onClick={deleteWorkout}>
            Delete Workout
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkoutDetail({ log }) {
  const groupedExercises = useMemo(() => {
    const grouping = new Map();
    (log.exercises || []).forEach((entry) => {
      const key = entry.exercise_name || `exercise-${entry.exercise_id}`;
      if (!grouping.has(key)) {
        grouping.set(key, {
          name: entry.exercise_name || 'Exercise',
          sets: []
        });
      }
      grouping.get(key).sets.push(entry);
    });
    return Array.from(grouping.values());
  }, [log.exercises]);

  return (
    <div>
      <p className="text-muted mb-2">{log.program_name}</p>
      <div className="card-meta mb-3">
        <span>📅 {formatDate(log.date)}</span>
        <span>{log.completed ? '✅ Completed' : '🟡 In Progress'}</span>
      </div>
      {groupedExercises.length === 0 ? (
        <p className="text-muted">No exercises logged yet.</p>
      ) : (
        groupedExercises.map((exercise) => (
          <div key={exercise.name} className="mb-3">
            <div className="exercise-entry-header">
              <strong>{exercise.name}</strong>
            </div>
            <div className="sets-container">
              {exercise.sets.map((set) => (
                <div key={`${exercise.name}-${set.set_number}`} className="card-meta">
                  Set {set.set_number}: {set.reps} reps x {set.weight} kg
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      {log.notes && <p className="text-muted">Notes: {log.notes}</p>}
    </div>
  );
}

function ProgramDetail({ program: initialProgram, exercises, onProgramChanged }) {
  const [program, setProgram] = useState(initialProgram);
  const [loading, setLoading] = useState(false);
  const programId = initialProgram.id;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const latest = await fetchJson(/programs/);
      setProgram(latest);
      await onProgramChanged?.();
    } catch (error) {
      console.error('Unable to refresh program', error);
    } finally {
      setLoading(false);
    }
  }, [onProgramChanged, programId]);

  const toggleActive = async () => {
    try {
      await fetchJson(/programs/, {
        method: 'PUT',
        body: JSON.stringify({
          name: program.name,
          description: program.description,
          is_active: program.is_active ? 0 : 1
        })
      });
      await refresh();
    } catch (error) {
      console.error('Failed to update program', error);
    }
  };

  const [addingWorkout, setAddingWorkout] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [newWorkoutDay, setNewWorkoutDay] = useState(() => (program.workouts?.length || 0) + 1);

  const addWorkout = async (event) => {
    event.preventDefault();
    try {
      await fetchJson(/programs//workouts, {
        method: 'POST',
        body: JSON.stringify({
          name: newWorkoutName,
          day_number: parseInt(newWorkoutDay, 10)
        })
      });
      setAddingWorkout(false);
      setNewWorkoutName('');
      await refresh();
    } catch (error) {
      console.error('Failed to add workout', error);
    }
  };

  const [addExerciseWorkoutId, setAddExerciseWorkoutId] = useState(null);
  const [newExerciseId, setNewExerciseId] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState('3');
  const [newExerciseReps, setNewExerciseReps] = useState('10');
  const [newExerciseOneRm, setNewExerciseOneRm] = useState('');

  const addExercise = async (event) => {
    event.preventDefault();
    if (!addExerciseWorkoutId) return;
    try {
      await fetchJson(/program-workouts//exercises, {
        method: 'POST',
        body: JSON.stringify({
          exercise_id: parseInt(newExerciseId, 10),
          sets: parseInt(newExerciseSets, 10),
          reps: newExerciseReps,
          weight_percentage: null,
          one_rm: newExerciseOneRm ? parseFloat(newExerciseOneRm) : null,
          notes: '',
          exercise_order: 1
        })
      });
      setAddExerciseWorkoutId(null);
      setNewExerciseId('');
      setNewExerciseSets('3');
      setNewExerciseReps('10');
      setNewExerciseOneRm('');
      await refresh();
    } catch (error) {
      console.error('Failed to add exercise', error);
    }
  };

  const updateExerciseSets = async (exercise, sets) => {
    try {
      await fetchJson(/program-exercises/, {
        method: 'PUT',
        body: JSON.stringify({
          sets,
          reps: exercise.reps,
          one_rm: exercise.one_rm ?? null,
          notes: exercise.notes || ''
        })
      });
      await refresh();
    } catch (error) {
      console.error('Failed to update exercise', error);
    }
  };

  const deleteProgramExercise = async (exerciseId) => {
    try {
      await fetchJson(/program-exercises/, { method: 'DELETE' });
      await refresh();
    } catch (error) {
      console.error('Failed to delete exercise', error);
    }
  };

  return (
    <div>
      <p className="text-muted mb-2">{program.description || 'No description provided.'}</p>
      <div className="d-flex gap-2 mb-3 align-items-center">
        {program.program_type && <Badge variant="primary">{program.program_type}</Badge>}
        <Badge variant={program.is_active ? 'success' : 'secondary'}>
          {program.is_active ? 'Active' : 'Inactive'}
        </Badge>
        <button
          className="btn btn-sm btn-outline"
          type="button"
          onClick={toggleActive}
          disabled={loading}
        >
          {program.is_active ? 'Mark Inactive' : 'Mark Active'}
        </button>
      </div>

      <div className="mb-3">
        <button
          className="btn btn-sm btn-primary"
          type="button"
          onClick={() => setAddingWorkout((prev) => !prev)}
        >
          {addingWorkout ? 'Cancel' : 'Add Workout Day'}
        </button>
      </div>

      {addingWorkout && (
        <form onSubmit={addWorkout} className="mb-3">
          <div className="form-group">
            <label className="form-label">Workout Name</label>
            <input
              className="form-input"
              value={newWorkoutName}
              onChange={(event) => setNewWorkoutName(event.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Day Number</label>
            <input
              className="form-input"
              type="number"
              value={newWorkoutDay}
              onChange={(event) => setNewWorkoutDay(event.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Add Workout
          </button>
        </form>
      )}

      {(program.workouts || []).map((workout) => (
        <div key={workout.id} className="mb-3 card">
          <div className="card-header">
            <div>
              <div className="card-title">{workout.name}</div>
              <div className="card-subtitle">Day {workout.day_number}</div>
            </div>
            <button
              className="btn btn-sm btn-outline"
              type="button"
              onClick={() => setAddExerciseWorkoutId(workout.id)}
            >
              Add Exercise
            </button>
          </div>

          {addExerciseWorkoutId === workout.id && (
            <form onSubmit={addExercise} className="mb-2">
              <div className="form-group">
                <label className="form-label">Exercise</label>
                <select
                  className="form-select"
                  value={newExerciseId}
                  onChange={(event) => setNewExerciseId(event.target.value)}
                  required
                >
                  <option value="">Select exercise…</option>
                  {(exercises || []).map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sets</label>
                  <input
                    className="form-input"
                    type="number"
                    value={newExerciseSets}
                    onChange={(event) => setNewExerciseSets(event.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reps</label>
                  <input
                    className="form-input"
                    value={newExerciseReps}
                    onChange={(event) => setNewExerciseReps(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">1RM (optional)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.5"
                  value={newExerciseOneRm}
                  onChange={(event) => setNewExerciseOneRm(event.target.value)}
                />
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setAddExerciseWorkoutId(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Add
                </button>
              </div>
            </form>
          )}

          <div className="mt-2">
            {(workout.exercises || []).length === 0 ? (
              <p className="text-muted">No exercises yet.</p>
            ) : (
              (workout.exercises || []).map((exercise) => (
                <div
                  key={exercise.id}
                  className="card-meta mb-1 d-flex justify-content-between align-items-center"
                >
                  <span>
                    <strong>{exercise.exercise_name}</strong> - {exercise.sets} x {exercise.reps}
                  </span>
                  <div className="d-flex gap-1">
                    <button
                      className="btn btn-sm btn-outline"
                      type="button"
                      onClick={() => updateExerciseSets(exercise, (exercise.sets || 1) + 1)}
                    >
                      +
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      type="button"
                      onClick={() =>
                        updateExerciseSets(exercise, Math.max(1, (exercise.sets || 1) - 1))
                      }
                    >
                      -
                    </button>
                    <button
                      className="btn btn-sm btn-danger-outline"
                      type="button"
                      onClick={() => deleteProgramExercise(exercise.id)}
                    >
                      x
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
