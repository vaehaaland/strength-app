'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calculator } from 'lucide-react'
import { generate531Program } from '@/lib/531-calculator'

interface Exercise {
  id: string
  name: string
  category: string
}

interface ProgramExercise {
  id: string
  exercise: Exercise
  oneRepMax?: number | null
  trainingMax?: number | null
  sets?: number | null
  reps?: number | null
  weight?: number | null
  day?: number | null
}

interface Program {
  id: string
  name: string
  type: string
  description?: string
  exercises: ProgramExercise[]
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)

  // Form state
  const [programName, setProgramName] = useState('')
  const [programDescription, setProgramDescription] = useState('')
  const [programType, setProgramType] = useState<'531' | 'custom' | 'hypertrophy'>('531')
  const [programMainExercises, setProgramMainExercises] = useState<{ exerciseId: string; oneRepMax: number }[]>([
    { exerciseId: '', oneRepMax: 0 },
    { exerciseId: '', oneRepMax: 0 },
    { exerciseId: '', oneRepMax: 0 },
    { exerciseId: '', oneRepMax: 0 },
  ])
  const [programAccessoryExercises, setProgramAccessoryExercises] = useState<{ exerciseId: string; sets: number; reps: number; weight: number | null }[]>([])
  const [programCustomExercises, setProgramCustomExercises] = useState<{ exerciseId: string; sets: number; reps: number; weight: number | null }[]>([
    { exerciseId: '', sets: 3, reps: 10, weight: null },
  ])

  // 5/3/1 Wizard state
  const [wizardStep, setWizardStep] = useState(0) // 0 = 1RMs, 1-4 = accessories per day
  const [dayAccessories, setDayAccessories] = useState<{ exerciseId: string; sets: number; reps: number; weight: number | null }[][]>([
    [], [], [], []
  ])

  const MAIN_LIFTS = ['Deadlift', 'Bench Press', 'Squat', 'Overhead Press']

  const buildMainLifts = (previousOneRms?: Record<string, number>) =>
    MAIN_LIFTS.map((liftName) => {
      const exerciseMatch = exercises.find((exercise) => exercise.name === liftName)
      const exerciseId = exerciseMatch?.id || ''
      const oneRepMax =
        exerciseId && previousOneRms && previousOneRms[exerciseId] !== undefined
          ? previousOneRms[exerciseId]
          : 0

      return { exerciseId, oneRepMax }
    })

  useEffect(() => {
    fetchPrograms()
    fetchExercises()
  }, [])

  useEffect(() => {
    if (exercises.length === 0) return

    setProgramMainExercises((current) => {
      const previousOneRms = current.reduce<Record<string, number>>((acc, item) => {
        if (item.exerciseId) {
          acc[item.exerciseId] = item.oneRepMax
        }
        return acc
      }, {})

      return buildMainLifts(previousOneRms)
    })
  }, [exercises])

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
      if (programType === '531') {
        // Build exercises with day assignments for 5/3/1 wizard
        const mainExercises = programMainExercises
          .filter((ex) => ex.exerciseId && ex.oneRepMax > 0)
          .map((ex, index) => ({
            exerciseId: ex.exerciseId,
            oneRepMax: ex.oneRepMax,
            day: index + 1, // Day 1-4 for each main lift
          }))

        // Add accessories for each day
        const allAccessories: any[] = []
        dayAccessories.forEach((accessories, dayIndex) => {
          accessories
            .filter((ex) => ex.exerciseId && ex.sets > 0 && ex.reps > 0)
            .forEach((ex) => {
              allAccessories.push({
                exerciseId: ex.exerciseId,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight ?? null,
                day: dayIndex + 1, // Day 1-4
              })
            })
        })

        const exercisesPayload = [...mainExercises, ...allAccessories]

        const res = await fetch('/api/programs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: programName,
            type: programType,
            description: programDescription,
            exercises: exercisesPayload,
          }),
        })

        if (res.ok) {
          setIsFormOpen(false)
          resetForm()
          fetchPrograms()
        }
      } else {
        // Custom/Hypertrophy programs (no wizard)
        const customExercises = programCustomExercises
          .filter((ex) => ex.exerciseId && ex.sets > 0 && ex.reps > 0)
          .map((ex) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight ?? null,
          }))

        const res = await fetch('/api/programs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: programName,
            type: programType,
            description: programDescription,
            exercises: customExercises,
          }),
        })

        if (res.ok) {
          setIsFormOpen(false)
          resetForm()
          fetchPrograms()
        }
      }
    } catch (error) {
      console.error('Failed to create program:', error)
    }
  }

  function resetForm() {
    setProgramName('')
    setProgramDescription('')
    setProgramType('531')
    setProgramMainExercises(buildMainLifts())
    setProgramAccessoryExercises([])
    setProgramCustomExercises([{ exerciseId: '', sets: 3, reps: 10, weight: null }])
    setWizardStep(0)
    setDayAccessories([[], [], [], []])
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this program?')) return

    try {
      const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSelectedProgram(null)
        fetchPrograms()
      }
    } catch (error) {
      console.error('Failed to delete program:', error)
    }
  }

  function updateMainExerciseRow(index: number, field: 'exerciseId' | 'oneRepMax', value: string | number) {
    const updated = [...programMainExercises]
    updated[index] = { ...updated[index], [field]: value }
    setProgramMainExercises(updated)
  }

  function addAccessoryExerciseRow() {
    setProgramAccessoryExercises([
      ...programAccessoryExercises,
      { exerciseId: '', sets: 3, reps: 12, weight: null },
    ])
  }

  function removeAccessoryExerciseRow(index: number) {
    setProgramAccessoryExercises(programAccessoryExercises.filter((_, i) => i !== index))
  }

  function updateAccessoryExerciseRow(
    index: number,
    field: 'exerciseId' | 'sets' | 'reps' | 'weight',
    value: string | number | null
  ) {
    const updated = [...programAccessoryExercises]
    updated[index] = { ...updated[index], [field]: value }
    setProgramAccessoryExercises(updated)
  }

  function addCustomExerciseRow() {
    setProgramCustomExercises([
      ...programCustomExercises,
      { exerciseId: '', sets: 3, reps: 10, weight: null },
    ])
  }

  function removeCustomExerciseRow(index: number) {
    setProgramCustomExercises(programCustomExercises.filter((_, i) => i !== index))
  }

  function updateCustomExerciseRow(
    index: number,
    field: 'exerciseId' | 'sets' | 'reps' | 'weight',
    value: string | number | null
  ) {
    const updated = [...programCustomExercises]
    updated[index] = { ...updated[index], [field]: value }
    setProgramCustomExercises(updated)
  }

  // Day accessory management for 5/3/1 wizard
  function addDayAccessoryRow(dayIndex: number) {
    const updated = [...dayAccessories]
    updated[dayIndex] = [...updated[dayIndex], { exerciseId: '', sets: 3, reps: 12, weight: null }]
    setDayAccessories(updated)
  }

  function removeDayAccessoryRow(dayIndex: number, exerciseIndex: number) {
    const updated = [...dayAccessories]
    updated[dayIndex] = updated[dayIndex].filter((_, i) => i !== exerciseIndex)
    setDayAccessories(updated)
  }

  function updateDayAccessoryRow(
    dayIndex: number,
    exerciseIndex: number,
    field: 'exerciseId' | 'sets' | 'reps' | 'weight',
    value: string | number | null
  ) {
    const updated = [...dayAccessories]
    updated[dayIndex][exerciseIndex] = { ...updated[dayIndex][exerciseIndex], [field]: value }
    setDayAccessories(updated)
  }

  const formatProgramType = (type: string) => {
    if (type === '531') return '5/3/1'
    if (type === 'hypertrophy') return 'Hypertrophy'
    return 'Custom'
  }

  const formatExerciseSummary = (exercise: ProgramExercise) => {
    if (exercise.oneRepMax) {
      return `1RM: ${exercise.oneRepMax}kg`
    }
    if (exercise.sets && exercise.reps) {
      const weightLabel =
        exercise.weight === null || exercise.weight === undefined ? 'BW' : `${exercise.weight}kg`
      return `${exercise.sets}x${exercise.reps} - ${weightLabel}`
    }
    return '-'
  }
  const mainProgramExercises = selectedProgram?.exercises.filter(
    (exercise) => exercise.oneRepMax || exercise.trainingMax
  ) || []
  const accessoryProgramExercises = selectedProgram?.exercises.filter(
    (exercise) => !exercise.oneRepMax && !exercise.trainingMax && exercise.sets && exercise.reps
  ) || []

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
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Programs</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Create Program</span>
        </button>
      </div>

      {/* Program Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Create Program</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Program Name *
                </label>
                <input
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Starting Strength Cycle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Program Type
                </label>
                <select
                  value={programType}
                  onChange={(e) => setProgramType(e.target.value as '531' | 'custom' | 'hypertrophy')}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="531">5/3/1</option>
                  <option value="custom">Custom</option>
                  <option value="hypertrophy">Hypertrophy</option>
                </select>
                {programType === 'hypertrophy' && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Hypertrophy: focus on higher reps and moderate loads.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Description
                </label>
                <textarea
                  value={programDescription}
                  onChange={(e) => setProgramDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Cycle goals and notes..."
                />
              </div>

              {programType === '531' ? (
                <div className="space-y-6">
                  {/* Wizard Progress Indicator */}
                  <div className="flex items-center justify-between mb-4">
                    {['1RMs', ...MAIN_LIFTS.map((_, i) => `Day ${i + 1}`)].map((step, index) => (
                      <div key={index} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            wizardStep === index
                              ? 'bg-purple-600 text-white'
                              : wizardStep > index
                              ? 'bg-green-500 text-white'
                              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {wizardStep > index ? '✓' : index + 1}
                        </div>
                        {index < 4 && (
                          <div
                            className={`w-12 h-0.5 ${
                              wizardStep > index ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Step 0: Enter 1RMs */}
                  {wizardStep === 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                        Step 1: Enter your 1RM for each main lift
                      </h3>
                      <div className="space-y-3">
                        {programMainExercises.map((ex, index) => (
                          <div key={index} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                  {exercises.find((exercise) => exercise.id === ex.exerciseId)?.name || MAIN_LIFTS[index]}
                                </p>
                                <p className="text-xs text-zinc-500">Main lift</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={ex.oneRepMax || ''}
                                  onChange={(e) => updateMainExerciseRow(index, 'oneRepMax', parseFloat(e.target.value) || 0)}
                                  placeholder="1RM (kg)"
                                  min="0"
                                  step="0.5"
                                  className="w-32 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Steps 1-4: Select accessories for each day */}
                  {wizardStep > 0 && wizardStep <= 4 && (
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                        Step {wizardStep + 1}: Accessories for {MAIN_LIFTS[wizardStep - 1]} Day
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                        Select accessory exercises to perform on {MAIN_LIFTS[wizardStep - 1]} day
                      </p>

                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Accessories (optional)
                        </label>
                        <button
                          type="button"
                          onClick={() => addDayAccessoryRow(wizardStep - 1)}
                          className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          + Add Accessory
                        </button>
                      </div>

                      {dayAccessories[wizardStep - 1].length === 0 ? (
                        <p className="text-xs text-zinc-500 mb-4">No accessories added yet. Click "+ Add Accessory" to add some.</p>
                      ) : (
                        <div className="space-y-3">
                          {dayAccessories[wizardStep - 1].map((ex, index) => (
                            <div key={index} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <select
                                  value={ex.exerciseId}
                                  onChange={(e) => updateDayAccessoryRow(wizardStep - 1, index, 'exerciseId', e.target.value)}
                                  className="md:col-span-2 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                                >
                                  <option value="">Select exercise...</option>
                                  {exercises.map((exercise) => (
                                    <option key={exercise.id} value={exercise.id}>
                                      {exercise.name}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  value={ex.sets || ''}
                                  onChange={(e) => updateDayAccessoryRow(wizardStep - 1, index, 'sets', parseInt(e.target.value, 10) || 0)}
                                  placeholder="Sets"
                                  min="1"
                                  className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                                />
                                <input
                                  type="number"
                                  value={ex.reps || ''}
                                  onChange={(e) => updateDayAccessoryRow(wizardStep - 1, index, 'reps', parseInt(e.target.value, 10) || 0)}
                                  placeholder="Reps"
                                  min="1"
                                  className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                                />
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={ex.weight ?? ''}
                                    onChange={(e) =>
                                      updateDayAccessoryRow(
                                        wizardStep - 1,
                                        index,
                                        'weight',
                                        e.target.value === '' ? null : parseFloat(e.target.value)
                                      )
                                    }
                                    placeholder="Weight (kg)"
                                    min="0"
                                    step="0.5"
                                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeDayAccessoryRow(wizardStep - 1, index)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Wizard Navigation */}
                  <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsFormOpen(false)
                          resetForm()
                        }}
                        className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
                        disabled={wizardStep === 0}
                        className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                    </div>
                    {wizardStep < 4 ? (
                      <button
                        type="button"
                        onClick={() => setWizardStep(wizardStep + 1)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Create Program
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Exercises (sets/reps)
                    </label>
                    <button
                      type="button"
                      onClick={addCustomExerciseRow}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      + Add Exercise
                    </button>
                  </div>

                  <div className="space-y-3">
                    {programCustomExercises.map((ex, index) => (
                      <div key={index} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <select
                            value={ex.exerciseId}
                            onChange={(e) => updateCustomExerciseRow(index, 'exerciseId', e.target.value)}
                            className="md:col-span-2 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                          >
                            <option value="">Select exercise...</option>
                            {exercises.map((exercise) => (
                              <option key={exercise.id} value={exercise.id}>
                                {exercise.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={ex.sets || ''}
                            onChange={(e) => updateCustomExerciseRow(index, 'sets', parseInt(e.target.value, 10) || 0)}
                            placeholder="Sets"
                            min="1"
                            className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                          />
                          <input
                            type="number"
                            value={ex.reps || ''}
                            onChange={(e) => updateCustomExerciseRow(index, 'reps', parseInt(e.target.value, 10) || 0)}
                            placeholder="Reps"
                            min="1"
                            className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={ex.weight ?? ''}
                              onChange={(e) =>
                                updateCustomExerciseRow(
                                  index,
                                  'weight',
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                )
                              }
                              placeholder="Weight (kg)"
                              min="0"
                              step="0.5"
                              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                            />
                            {programCustomExercises.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCustomExerciseRow(index)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form buttons for non-531 programs */}
              {programType !== '531' && (
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
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save Program
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Program Details Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{selectedProgram.name}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
                  {formatProgramType(selectedProgram.type)}
                </p>
                {selectedProgram.description && (
                  <p className="text-zinc-600 dark:text-zinc-400 mt-1">{selectedProgram.description}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedProgram(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-8">
              {selectedProgram.type === '531' ? (
                <>
                  {mainProgramExercises.map((exercise) => {
                    const baseMax = exercise.oneRepMax || (exercise.trainingMax ? exercise.trainingMax / 0.9 : 0)
                    const weeks = generate531Program(baseMax)
                    return (
                      <div key={exercise.id} className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                        <div className="bg-purple-50 dark:bg-purple-950 px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{exercise.exercise.name}</h3>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                            1RM: {exercise.oneRepMax ?? '-'}kg - Training Max: {exercise.trainingMax ?? '-'}kg (90%)
                          </p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                  Week
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                  Set 1
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                  Set 2
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                  Set 3
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-700">
                              {weeks.map((week) => (
                                <tr key={week.week}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                    Week {week.week} {week.week === 4 && <span className="text-zinc-500 dark:text-zinc-400">(Deload)</span>}
                                  </td>
                                  {week.sets.map((set, idx) => (
                                    <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">
                                      <div className="font-medium">{set.weight}kg</div>
                                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {set.reps} reps ({set.percentage}%)
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}

                  {accessoryProgramExercises.length > 0 && (
                    <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Accessories</h3>
                      <div className="space-y-2">
                        {accessoryProgramExercises.map((exercise) => (
                          <div key={exercise.id} className="flex items-center justify-between text-sm">
                            <span className="text-zinc-900 dark:text-zinc-50">{exercise.exercise.name}</span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {exercise.sets}x{exercise.reps} - {exercise.weight == null ? 'BW' : `${exercise.weight}kg`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Program Structure</h3>
                  <div className="space-y-2">
                    {selectedProgram.exercises.map((exercise) => (
                      <div key={exercise.id} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-900 dark:text-zinc-50">{exercise.exercise.name}</span>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {formatExerciseSummary(exercise)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleDelete(selectedProgram.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Program
              </button>
              <button
                onClick={() => setSelectedProgram(null)}
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Programs List */}
      {programs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <Calculator className="h-16 w-16 mx-auto mb-4 text-zinc-400" />
          <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-50">No programs yet</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Create your first program (5/3/1, custom, or hypertrophy)
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Program</span>
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {programs.map((program) => (
            <div
              key={program.id}
              onClick={() => setSelectedProgram(program)}
              className="p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors cursor-pointer"
            >
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{program.name}</h3>
              <p className="text-[11px] uppercase font-semibold tracking-wide text-purple-600 dark:text-purple-300 mb-2">
                {formatProgramType(program.type)}
              </p>
              {program.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{program.description}</p>
              )}
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Exercises:</p>
                {program.exercises.map((ex) => (
                  <div key={ex.id} className="flex justify-between items-center text-sm">
                    <span className="text-zinc-900 dark:text-zinc-50">{ex.exercise.name}</span>
                    <span className="text-zinc-600 dark:text-zinc-400">{formatExerciseSummary(ex)}</span>
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

