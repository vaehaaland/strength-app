'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Dumbbell } from 'lucide-react'
import { format } from 'date-fns'

interface Exercise {
  id: string
  name: string
  category: string
}

interface WorkoutExercise {
  exerciseId: string
  sets: number
  reps: number
  weight: number
  notes?: string
}

interface Workout {
  id: string
  name: string
  date: string
  notes?: string
  exercises: {
    id: string
    sets: number
    reps: number
    weight: number
    notes?: string
    exercise: Exercise
  }[]
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state
  const [workoutName, setWorkoutName] = useState('')
  const [workoutDate, setWorkoutDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([
    { exerciseId: '', sets: 3, reps: 10, weight: 0 }
  ])

  useEffect(() => {
    fetchWorkouts()
    fetchExercises()
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workoutName,
          date: workoutDate,
          notes: workoutNotes,
          exercises: workoutExercises.filter(ex => ex.exerciseId),
        }),
      })

      if (res.ok) {
        setIsFormOpen(false)
        setWorkoutName('')
        setWorkoutDate(format(new Date(), 'yyyy-MM-dd'))
        setWorkoutNotes('')
        setWorkoutExercises([{ exerciseId: '', sets: 3, reps: 10, weight: 0 }])
        fetchWorkouts()
      }
    } catch (error) {
      console.error('Failed to create workout:', error)
    }
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

  function addExerciseRow() {
    setWorkoutExercises([...workoutExercises, { exerciseId: '', sets: 3, reps: 10, weight: 0 }])
  }

  function removeExerciseRow(index: number) {
    setWorkoutExercises(workoutExercises.filter((_, i) => i !== index))
  }

  function updateExerciseRow(index: number, field: keyof WorkoutExercise, value: any) {
    const updated = [...workoutExercises]
    updated[index] = { ...updated[index], [field]: value }
    setWorkoutExercises(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    )
  }

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

      {/* Workout Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Log Workout</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Notes
                </label>
                <textarea
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How did the workout feel?"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Exercises
                  </label>
                  <button
                    type="button"
                    onClick={addExerciseRow}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Add Exercise
                  </button>
                </div>

                <div className="space-y-3">
                  {workoutExercises.map((ex, index) => (
                    <div key={index} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <select
                          value={ex.exerciseId}
                          onChange={(e) => updateExerciseRow(index, 'exerciseId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                        >
                          <option value="">Select exercise...</option>
                          {exercises.map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>
                              {exercise.name}
                            </option>
                          ))}
                        </select>
                        {workoutExercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExerciseRow(index)}
                            className="ml-2 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-zinc-600 dark:text-zinc-400">
                            Sets
                          </label>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => updateExerciseRow(index, 'sets', parseInt(e.target.value))}
                            min="1"
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-zinc-600 dark:text-zinc-400">
                            Reps
                          </label>
                          <input
                            type="number"
                            value={ex.reps}
                            onChange={(e) => updateExerciseRow(index, 'reps', parseInt(e.target.value))}
                            min="1"
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-zinc-600 dark:text-zinc-400">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            value={ex.weight}
                            onChange={(e) => updateExerciseRow(index, 'weight', parseFloat(e.target.value))}
                            min="0"
                            step="0.5"
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Workout
                </button>
              </div>
            </form>
          </div>
        </div>
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
      ) : (
        <div className="space-y-4">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{workout.name}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {format(new Date(workout.date), 'PPP')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(workout.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {workout.notes && (
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4 italic">
                  {workout.notes}
                </p>
              )}

              <div className="space-y-2">
                {workout.exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {ex.exercise.name}
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {ex.sets} × {ex.reps} @ {ex.weight}kg
                    </span>
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
