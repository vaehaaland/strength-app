'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Dumbbell, ChevronDown, Search, Pencil, Smartphone, Radio } from 'lucide-react'
import { format } from 'date-fns'

interface Exercise {
  id: string
  name: string
  category: string
}

interface WorkoutSet {
  id?: string
  reps: number
  weight: number | null
  rpe?: number
}

interface WorkoutExercise {
  id?: string
  exerciseId: string
  notes?: string
  sets: WorkoutSet[]
  exercise?: Exercise
}

interface Workout {
  id: string
  name: string
  date: string
  notes?: string
  programId?: string | null
  program?: Program | null
  exercises: WorkoutExercise[]
}

interface ProgramExercise {
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

interface Program {
  id: string
  name: string
  type: string
  description?: string
  exercises: ProgramExercise[]
}

function ExerciseSelect({
  exercises,
  value,
  onChange
}: {
  exercises: Exercise[],
  value: string,
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selectedExercise = exercises.find(e => e.id === value)
  const selectedName = selectedExercise?.name || ''

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [wrapperRef])

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative flex-1 max-w-sm" ref={wrapperRef}>
      <div
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setSearch('')
        }}
        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm flex justify-between items-center cursor-pointer hover:border-blue-500 transition-colors"
      >
        <span className={!selectedName ? "text-zinc-500" : ""}>
          {selectedName || "Select exercise..."}
        </span>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-white dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-zinc-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          {filteredExercises.length === 0 ? (
            <div className="p-3 text-sm text-zinc-500 text-center">No exercises found</div>
          ) : (
            filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                onClick={() => {
                  onChange(exercise.id)
                  setIsOpen(false)
                }}
                className={`px-3 py-2 text-sm cursor-pointer flex justify-between items-center ${exercise.id === value
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
              >
                <span>{exercise.name}</span>
                {exercise.category && (
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                    {exercise.category}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null)
  const [selectedProgramId, setSelectedProgramId] = useState('')

  // Form state
  const [workoutName, setWorkoutName] = useState('')
  const [workoutDate, setWorkoutDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([
    {
      exerciseId: '',
      sets: [{ reps: 10, weight: 0 }]
    }
  ])

  useEffect(() => {
    fetchWorkouts()
    fetchExercises()
    fetchPrograms()
    const updateIsMobile = () => setIsMobile(window.innerWidth < 640)
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
    return () => window.removeEventListener('resize', updateIsMobile)
  }, [])

  async function fetchWorkouts() {
    try {
      const res = await fetch('/api/workouts')
      const data = await res.json()
      setWorkouts(data)
    } catch (error) {
      console.error('Failed to fetch workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchExercises() {
    try {
      const res = await fetch('/api/exercises')
      const data = await res.json()
      setExercises(data)
    } catch (error) {
      console.error('Failed to fetch exercises:', error)
    }
  }

  async function fetchPrograms() {
    try {
      const res = await fetch('/api/programs')
      const data = await res.json()
      if (!res.ok || !Array.isArray(data)) {
        console.error('Failed to fetch programs:', data)
        setPrograms([])
        return
      }
      setPrograms(data)
    } catch (error) {
      console.error('Failed to fetch programs:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const payload = {
        name: workoutName,
        date: workoutDate,
        notes: workoutNotes,
        programId: selectedProgramId || null,
        exercises: workoutExercises.filter(ex => ex.exerciseId),
      }

      const url = editingWorkoutId ? `/api/workouts/${editingWorkoutId}` : '/api/workouts'
      const method = editingWorkoutId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setIsFormOpen(false)
        resetForm()
        fetchWorkouts()
      }
    } catch (error) {
      console.error('Failed to create workout:', error)
    }
  }

  function resetForm() {
    setWorkoutName('')
    setWorkoutDate(format(new Date(), 'yyyy-MM-dd'))
    setWorkoutNotes('')
    setWorkoutExercises([{ exerciseId: '', sets: [{ reps: 10, weight: 0 }] }])
    setEditingWorkoutId(null)
    setSelectedProgramId('')
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this workout?')) return

    try {
      const res = await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchWorkouts()
      }
    } catch (error) {
      console.error('Failed to delete workout:', error)
    }
  }

  // Exercise Management
  function addExercise() {
    setWorkoutExercises([
      ...workoutExercises,
      { exerciseId: '', sets: [{ reps: 10, weight: 0 }] }
    ])
  }

  function handleProgramSelect(programId: string) {
    setSelectedProgramId(programId)

    if (!programId) {
      setWorkoutExercises([{ exerciseId: '', sets: [{ reps: 10, weight: 0 }] }])
      return
    }

    const program = programs.find(p => p.id === programId)
    if (!program) return

    const populatedExercises = program.exercises?.map((ex: ProgramExercise) => {
      if (program.type === '531') {
        if (ex.oneRepMax || ex.trainingMax) {
          return {
            exerciseId: ex.exerciseId,
            notes: '',
            sets: [{ reps: 5, weight: ex.trainingMax ?? 0 }],
          }
        }
        if (ex.sets && ex.reps) {
          return {
            exerciseId: ex.exerciseId,
            notes: '',
            sets: Array.from({ length: ex.sets }, () => ({
              reps: ex.reps || 10,
              weight: ex.weight ?? null,
            })),
          }
        }
      }

      if (ex.sets && ex.reps) {
        return {
          exerciseId: ex.exerciseId,
          notes: '',
          sets: Array.from({ length: ex.sets }, () => ({
            reps: ex.reps || 10,
            weight: ex.weight ?? null,
          })),
        }
      }

      return {
        exerciseId: ex.exerciseId,
        notes: '',
        sets: [{ reps: 10, weight: null }],
      }
    }) || []

    setWorkoutName(program.name)
    setWorkoutExercises(populatedExercises.length ? populatedExercises : [{ exerciseId: '', sets: [{ reps: 10, weight: 0 }] }])
  }

  function removeExercise(index: number) {
    setWorkoutExercises(workoutExercises.filter((_, i) => i !== index))
  }

  function updateExercise(index: number, field: keyof WorkoutExercise, value: string) {
    const updated = [...workoutExercises]
    updated[index] = { ...updated[index], [field]: value }
    setWorkoutExercises(updated)
  }

  // Set Management
  function addSet(exerciseIndex: number) {
    const updated = [...workoutExercises]
    // Copy previous set values if available, otherwise default
    const previousSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1]

    updated[exerciseIndex].sets.push({
      reps: previousSet ? previousSet.reps : 10,
      weight: previousSet ? previousSet.weight : 0
    })
    setWorkoutExercises(updated)
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    const updated = [...workoutExercises]
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex)
    setWorkoutExercises(updated)
  }

  function updateSet(exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: number | null) {
    const updated = [...workoutExercises]
    updated[exerciseIndex].sets[setIndex] = {
      ...updated[exerciseIndex].sets[setIndex],
      [field]: value
    }
    setWorkoutExercises(updated)
  }

  function handleEditWorkout(workout: Workout) {
    setEditingWorkoutId(workout.id)
    setWorkoutName(workout.name)
    setWorkoutDate(format(new Date(workout.date), 'yyyy-MM-dd'))
    setWorkoutNotes(workout.notes || '')
    setSelectedProgramId(workout.programId || '')

    const mappedExercises: WorkoutExercise[] = workout.exercises.map(ex => ({
      id: ex.id,
      exerciseId: ex.exerciseId,
      notes: ex.notes,
      sets: ex.sets.map(set => ({
        reps: set.reps,
        weight: set.weight ?? null,
        rpe: set.rpe,
      })),
    }))

    setWorkoutExercises(mappedExercises.length ? mappedExercises : [{ exerciseId: '', sets: [{ reps: 10, weight: 0 }] }])
    setIsFormOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    )
  }

  const filteredWorkouts = workouts.filter((workout) => {
    if (!searchTerm) return true

    const term = searchTerm.toLowerCase()
    const matchesName = workout.name.toLowerCase().includes(term)
    const matchesExercise = workout.exercises.some((ex) =>
      ex.exercise?.name.toLowerCase().includes(term)
    )

    return matchesName || matchesExercise
  })

  const workoutForm = (
    <div className={`bg-white dark:bg-zinc-800 rounded-2xl w-full ${isMobile ? '' : 'max-w-3xl max-h-[90vh] overflow-y-auto'} p-6 shadow-xl`}>
      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Log Workout</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Program</label>
            <select
              value={selectedProgramId}
              onChange={(e) => handleProgramSelect(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Custom økt</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              Workout Name *
            </label>
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Upper Body Push"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              Date
            </label>
            <input
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            Notes
          </label>
          <textarea
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="How did the workout feel?"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Exercises</h3>
            <button
              type="button"
              onClick={addExercise}
              className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <Plus className="h-4 w-4" />
              <span>Add Exercise</span>
            </button>
          </div>

          <div className="space-y-4">
            {workoutExercises.map((ex, exerciseIndex) => (
              <div key={exerciseIndex} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex justify-between items-start mb-4">
                  <ExerciseSelect
                    exercises={exercises}
                    value={ex.exerciseId}
                    onChange={(val) => updateExercise(exerciseIndex, 'exerciseId', val)}
                  />
                  <button
                    type="button"
                    onClick={() => removeExercise(exerciseIndex)}
                    className="ml-2 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Remove Exercise"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-10 gap-2 mb-1 px-1">
                    <div className="col-span-1 text-xs font-medium text-zinc-500 text-center">Set</div>
                    <div className="col-span-4 text-xs font-medium text-zinc-500">Weight (kg)</div>
                    <div className="col-span-4 text-xs font-medium text-zinc-500">Reps</div>
                    <div className="col-span-1"></div>
                  </div>

                  {ex.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-10 gap-2 items-center">
                      <div className="col-span-1 flex items-center justify-center">
                        <span className="text-sm font-medium text-zinc-400 bg-zinc-200 dark:bg-zinc-800 rounded-full w-6 h-6 flex items-center justify-center">
                          {setIndex + 1}
                        </span>
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={set.weight ?? ''}
                          onChange={(e) =>
                            updateSet(
                              exerciseIndex,
                              setIndex,
                              'weight',
                              e.target.value === ''
                                ? null
                                : Number.isNaN(parseFloat(e.target.value))
                                ? null
                                : parseFloat(e.target.value)
                            )
                          }
                          min="0"
                          step="0.5"
                          className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm text-center"
                          placeholder="BW"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value, 10) || 1)}
                          min="1"
                          className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm text-center"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {ex.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                            className="text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addSet(exerciseIndex)}
                  className="mt-3 text-xs flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline px-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Set</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => {
              resetForm()
              setIsFormOpen(false)
            }}
            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {editingWorkoutId ? 'Update Workout' : 'Save Workout'}
          </button>
        </div>
      </form>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Workouts</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Log Workout</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          {editingWorkoutId && (
            <span className="text-sm px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">Editing workout</span>
          )}
          {selectedProgramId && (
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200">Program: {programs.find(p => p.id === selectedProgramId)?.name}</span>
          )}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search workouts or exercises"
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <Link
        href="/workouts/live"
        className="sm:hidden fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-semibold shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Smartphone className="h-4 w-4" />
        Live log
      </Link>

      {/* Workout Form Modal */}
      {isFormOpen && (
        isMobile ? (
          <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-2">
            {workoutForm}
          </div>
        ) : (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            {workoutForm}
          </div>
        )
      )}

      {/* Workouts List */}
      {workouts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <Dumbbell className="h-16 w-16 mx-auto mb-4 text-zinc-400" />
          <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-50">No workouts yet</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Start tracking your fitness journey by logging your first workout
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Log Your First Workout</span>
          </button>
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-50">No matching workouts</h3>
          <p className="text-zinc-600 dark:text-zinc-400">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkouts.map((workout) => (
            <div
              key={workout.id}
              className="p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{workout.name}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {format(new Date(workout.date), 'PPP')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditWorkout(workout)}
                    className="hidden sm:inline-flex p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                    title="Edit workout"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <Link
                    href={`/workouts/live?id=${workout.id}`}
                    className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors"
                    title="Continue in live"
                  >
                    <Radio className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/workouts/live?id=${workout.id}`}
                    className="hidden sm:inline-flex p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-colors text-sm"
                    title="Continue in live"
                  >
                    Live
                  </Link>
                  <button
                    onClick={() => handleDelete(workout.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {workout.notes && (
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-6 italic bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  {workout.notes}
                </p>
              )}

              <div className="space-y-4">
                {workout.exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 pb-4 last:pb-0"
                  >
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2 flex items-center">
                      <div className="w-1 h-4 bg-blue-500 rounded-full mr-2"></div>
                      {ex.exercise?.name}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ex.sets.map((set, i) => (
                        <div key={i} className="inline-flex items-center px-2 py-1 bg-zinc-100 dark:bg-zinc-900 rounded text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {set.weight === null ? (
                            <span className="font-bold mr-1">BW</span>
                          ) : (
                            <span className="font-bold mr-1">{set.weight}kg</span>
                          )}
                          <span className="text-zinc-400 mx-1">×</span>
                          <span>{set.reps}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
