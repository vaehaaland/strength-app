'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  ChevronDown,
  Search,
  Minus,
  Pause,
  Plus,
  Save,
  Smartphone,
} from 'lucide-react'
import { format } from 'date-fns'
import { generate531Program } from '@/lib/531-calculator'

type Exercise = {
  id: string
  name: string
  category: string
}

type ProgramExercise = {
  id: string
  exerciseId: string
  oneRepMax?: number | null
  trainingMax?: number | null
  sets?: number | null
  reps?: number | null
  weight?: number | null
  order: number
  exercise?: Exercise
}

type Program = {
  id: string
  name: string
  type: string
  description?: string
  exercises: ProgramExercise[]
}

type LiveSet = {
  reps: number
  weight: number | null
  done?: boolean
  target?: string
}

type LiveExercise = {
  exerciseId: string
  exercise?: Exercise
  notes?: string
  sets: LiveSet[]
}

function parseReps(value: string) {
  const numeric = parseInt(value.replace(/\D/g, ''), 10)
  return Number.isNaN(numeric) ? 5 : numeric
}

function buildFromProgram(program: Program, week: number): LiveExercise[] {
  return program.exercises
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      if (program.type === '531' && (item.oneRepMax || item.trainingMax)) {
        const baseMax = item.oneRepMax || (item.trainingMax ? item.trainingMax / 0.9 : 0)
        const weeks = generate531Program(baseMax)
        const safeWeekIndex = Math.min(Math.max(week - 1, 0), weeks.length - 1)
        const weekPlan = weeks[safeWeekIndex]

        const sets: LiveSet[] = weekPlan.sets.map((set) => ({
          reps: parseReps(set.reps),
          weight: Number(set.weight.toFixed(1)),
          done: false,
          target: `${set.reps} @ ${set.weight}kg`,
        }))

        return {
          exerciseId: item.exerciseId,
          exercise: item.exercise,
          sets,
        }
      }

      const targetSets = item.sets || 3
      const targetReps = item.reps || 10
      const targetWeight = item.weight ?? null

      return {
        exerciseId: item.exerciseId,
        exercise: item.exercise,
        sets: Array.from({ length: targetSets }, () => ({
          reps: targetReps,
          weight: targetWeight,
          done: false,
        })),
      }
    })
}

export default function LiveWorkoutPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [selectedSessionExerciseId, setSelectedSessionExerciseId] = useState('')
  const [week, setWeek] = useState(1)
  const [sessionName, setSessionName] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')
  const [sessionExercises, setSessionExercises] = useState<LiveExercise[]>([])
  const [saving, setSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [startedAt] = useState(new Date())
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [setupOpen, setSetupOpen] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchPrograms = async () => {
      const res = await fetch('/api/programs')
      const data = await res.json()
      if (!res.ok || !Array.isArray(data)) {
        console.error('Failed to fetch programs:', data)
        setPrograms([])
        return
      }
      setPrograms(data)
    }

    const fetchExercises = async () => {
      const res = await fetch('/api/exercises')
      const data = await res.json()
      setExercises(data)
    }

    fetchPrograms()
    fetchExercises()

    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const id = searchParams.get('id')
    if (!id) return

    const loadWorkout = async () => {
      try {
        const res = await fetch(`/api/workouts/${id}`)
        if (!res.ok) return
        const workout = await res.json()
        setEditingId(workout.id)
        setSelectedProgramId(workout.programId || '')
        setSessionName(workout.name || '')
        setSessionNotes(workout.notes || '')
        const mapped: LiveExercise[] = workout.exercises.map((ex: any) => ({
          exerciseId: ex.exerciseId,
          exercise: ex.exercise,
          notes: ex.notes,
          sets: ex.sets.map((set: any) => ({
            reps: set.reps,
            weight: set.weight ?? null,
            rpe: set.rpe,
            done: false,
          })),
        }))
        setSessionExercises(mapped)
      } catch (error) {
        console.error('Failed to load workout', error)
      }
    }

    loadWorkout()
  }, [searchParams])

  useEffect(() => {
    const program = programs.find((p) => p.id === selectedProgramId)
    if (!program) {
      setSessionExercises([])
      setSessionName('')
      return
    }

    const subset = selectedSessionExerciseId
      ? program.exercises.filter((ex) => ex.exerciseId === selectedSessionExerciseId)
      : program.exercises

    const sessionProgram = { ...program, exercises: subset }

    setSessionExercises(buildFromProgram(sessionProgram, week))

    const mainLift = program.exercises.find((ex) => ex.exerciseId === selectedSessionExerciseId)?.exercise?.name
    const weekLabel = program.type === '531' ? `Week ${week}` : null
    const label = [program.name, mainLift, weekLabel].filter(Boolean).join(' - ')
    setSessionName(label)
  }, [programs, selectedProgramId, week, selectedSessionExerciseId])

  const program = useMemo(() => programs.find((p) => p.id === selectedProgramId), [programs, selectedProgramId])
  const filteredExercises = useMemo(() => {
    const term = exerciseSearch.toLowerCase().trim()
    if (!term) return exercises
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(term) ||
        ex.category.toLowerCase().includes(term),
    )
  }, [exerciseSearch, exercises])

  const handleAddExercise = () => {
    setExercisePickerOpen(true)
    setExerciseSearch('')
  }

  const updateExercise = (index: number, exerciseId: string) => {
    const exercise = exercises.find((ex) => ex.id === exerciseId)
    setSessionExercises((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], exerciseId, exercise }
      return copy
    })
  }

  const addSet = (exerciseIndex: number) => {
    setSessionExercises((prev) => {
      const copy = [...prev]
      const last = copy[exerciseIndex].sets.at(-1)
      copy[exerciseIndex].sets.push({
        reps: last ? last.reps : 8,
        weight: last ? last.weight : 0,
        done: false,
      })
      return copy
    })
  }

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight' | 'done',
    value: number | boolean | null,
  ) => {
    setSessionExercises((prev) => {
      const copy = [...prev]
      const sets = [...copy[exerciseIndex].sets]
      sets[setIndex] = { ...sets[setIndex], [field]: value }
      copy[exerciseIndex] = { ...copy[exerciseIndex], sets }
      return copy
    })
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setSessionExercises((prev) => {
      const copy = [...prev]
      copy[exerciseIndex].sets = copy[exerciseIndex].sets.filter((_, i) => i !== setIndex)
      return copy
    })
  }

  const removeExercise = (exerciseIndex: number) => {
    setSessionExercises((prev) => prev.filter((_, idx) => idx !== exerciseIndex))
  }

  const chooseExercise = (exercise: Exercise) => {
    setSessionExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        exercise,
        sets: [{ reps: 8, weight: 0 }],
      },
    ])
    setExercisePickerOpen(false)
    setExerciseSearch('')
  }

  const handleSave = async () => {
    if (!sessionExercises.length) return
    setSaving(true)

    const payload = {
      name: sessionName || program?.name || 'Workout',
      date: new Date(),
      notes: sessionNotes,
      programId: selectedProgramId || null,
      exercises: sessionExercises
        .filter((ex) => ex.exerciseId)
        .map((ex) => ({
          exerciseId: ex.exerciseId,
          notes: ex.notes,
          sets: ex.sets.map((set) => ({ reps: set.reps, weight: set.weight ?? null })),
        })),
    }

    try {
      const url = editingId ? `/api/workouts/${editingId}` : '/api/workouts'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        window.location.href = '/workouts'
      }
    } catch (error) {
      console.error('Failed to save workout', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-28">
      <header className="flex items-center gap-3 mb-4">
        <Link href="/workouts" className="p-2 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Smartphone className="h-4 w-4" />
          <span>Live logging - mobile first</span>
        </div>
      </header>

      {!isMobile && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-3 text-sm">
          This live view is tuned for mobile. Try it on a phone-sized window for the best experience.
        </div>
      )}

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-5 mb-5 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-blue-100">{format(startedAt, 'EEEE, MMM d')}</p>
            <h1 className="text-2xl font-bold">Live Workout</h1>
          </div>
          <div className="flex items-center gap-2 text-sm bg-white/15 px-3 py-1.5 rounded-full border border-white/20">
            <Clock3 className="h-4 w-4" />
            <span>{format(startedAt, 'HH:mm')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-blue-100 text-sm">
          <Flame className="h-4 w-4" />
          <span>Vel veke og økt (hovedløft) før du starter.</span>
        </div>
      </section>

      <section className="space-y-3 mb-5">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase">Program</label>
            <button
              type="button"
              onClick={() => setSetupOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              <span>{setupOpen ? 'Skjul' : 'Vis'}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${setupOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {!setupOpen && (
            <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
              <div><span className="font-semibold">Økt:</span> {sessionName || 'Custom'}</div>
              <div className="text-xs text-zinc-500">Trykk “Vis” for å endre oppsett.</div>
            </div>
          )}

          {setupOpen && (
            <>
          <div className="mt-2 flex items-center gap-2">
            <select
              value={selectedProgramId}
              onChange={(e) => {
                setSelectedProgramId(e.target.value)
                setSelectedSessionExerciseId('')
              }}
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm"
            >
              <option value="">Custom økt</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {selectedProgramId && program?.type === '531' && (
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWeek(w)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                      week === w
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-100'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300'
                    }`}
                  >
                    {w === 4 ? 'Deload' : `Veke ${w}`}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedProgramId && program?.type === '531' && (
            <div className="mt-3 flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Økt (hovedløft)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSessionExerciseId('')}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    selectedSessionExerciseId === ''
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-100'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300'
                  }`}
                >
                  Alle økter
                </button>
                {program?.exercises.map((ex) => (
                  <button
                    key={ex.exerciseId}
                    type="button"
                    onClick={() => setSelectedSessionExerciseId(ex.exerciseId)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold text-left ${
                      selectedSessionExerciseId === ex.exerciseId
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-100'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300'
                    }`}
                  >
                    {ex.exercise?.name || 'Økt'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Session name"
            className="mt-3 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm"
          />
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            rows={2}
            placeholder="Quick notes for today"
            className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm"
          />
            </>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            <span>Session exercises</span>
          </div>
          <button
            type="button"
            onClick={handleAddExercise}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-3 py-1 text-xs font-semibold dark:bg-white dark:text-zinc-900"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {sessionExercises.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500">
            Vel program + veke + økt, eller legg til en øvelse for å starte logging.
          </div>
        )}

        {sessionExercises.map((exercise, exerciseIndex) => (
          <div key={`${exercise.exerciseId}-${exerciseIndex}`} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <select
                  value={exercise.exerciseId}
                  onChange={(e) => updateExercise(exerciseIndex, e.target.value)}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm"
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
                {exercise.exercise?.category && (
                  <span className="mt-1 text-[11px] uppercase tracking-wide text-blue-600 dark:text-blue-300">{exercise.exercise.category}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeExercise(exerciseIndex)}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>

            <div className="space-y-2">
              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3">
                  <div className="flex flex-col items-center text-[11px] font-semibold text-zinc-500 w-10">
                    <span>Set</span>
                    <span className="text-zinc-900 dark:text-zinc-50">{setIndex + 1}</span>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() =>
                          updateSet(exerciseIndex, setIndex, 'weight', Math.max(0, (set.weight ?? 0) - 2.5))
                        }
                        className="p-2"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.weight ?? ''}
                        onChange={(e) =>
                          updateSet(
                            exerciseIndex,
                            setIndex,
                            'weight',
                            e.target.value === '' ? null : parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="BW"
                        className="w-full bg-transparent text-center outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateSet(exerciseIndex, setIndex, 'weight', Math.max(0, (set.weight ?? 0) + 2.5))
                        }
                        className="p-2"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => updateSet(exerciseIndex, setIndex, 'reps', Math.max(1, set.reps - 1))}
                        className="p-2"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-transparent text-center outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateSet(exerciseIndex, setIndex, 'reps', set.reps + 1)}
                        className="p-2"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateSet(exerciseIndex, setIndex, 'done', !set.done)}
                    className={`h-8 w-8 flex items-center justify-center rounded-full border text-xs ${
                      set.done
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                    }`}
                    title={set.done ? 'Markert som ferdig' : 'Marker som ferdig'}
                  >
                    {set.done ? <CheckCircle2 className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>

              <button
                type="button"
                onClick={() => removeSet(exerciseIndex, setIndex)}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/30 text-xs"
                title="Fjern sett"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
                onClick={() => addSet(exerciseIndex)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400"
              >
                + Add set
              </button>
            </div>
          </div>
        ))}
      </section>

      {exercisePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setExercisePickerOpen(false)}
          ></div>
          <div className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase font-semibold text-zinc-500">Legg til øvelse</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">Søk og velg fra biblioteket</p>
              </div>
              <button
                type="button"
                onClick={() => setExercisePickerOpen(false)}
                className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Lukk
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Søk etter øvelse"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 pl-9 pr-3 py-2 text-sm"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => chooseExercise(ex)}
                  className="w-full text-left rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">{ex.name}</span>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      {ex.category}
                    </span>
                  </div>
                </button>
              ))}

              {filteredExercises.length === 0 && (
                <div className="text-center text-sm text-zinc-500 py-4">
                  Ingen øvelser matcher søket.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-24 left-0 right-0 sm:bottom-8 px-4 pb-safe">
        <div className="mx-auto max-w-md rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 flex items-center gap-3">
          <div className="flex-1 text-sm">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">Ready to save?</p>
            <p className="text-xs text-zinc-500">Stores sets with reps and optional weight.</p>
          </div>
          <button
            type="button"
            disabled={saving || sessionExercises.length === 0}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold disabled:bg-zinc-400"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
