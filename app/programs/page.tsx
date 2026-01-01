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
  oneRepMax: number
  trainingMax: number
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
  const [programExercises, setProgramExercises] = useState<{ exerciseId: string; oneRepMax: number }[]>([
    { exerciseId: '', oneRepMax: 0 }
  ])

  useEffect(() => {
    fetchPrograms()
    fetchExercises()
  }, [])

  async function fetchPrograms() {
    try {
      const res = await fetch('/api/programs')
      const data = await res.json()
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
      setExercises(data.filter((ex: Exercise) => ex.category === 'compound'))
    } catch (error) {
      console.error('Failed to fetch exercises:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: programName,
          type: '531',
          description: programDescription,
          exercises: programExercises.filter(ex => ex.exerciseId && ex.oneRepMax > 0),
        }),
      })

      if (res.ok) {
        setIsFormOpen(false)
        setProgramName('')
        setProgramDescription('')
        setProgramExercises([{ exerciseId: '', oneRepMax: 0 }])
        fetchPrograms()
      }
    } catch (error) {
      console.error('Failed to create program:', error)
    }
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

  function addExerciseRow() {
    setProgramExercises([...programExercises, { exerciseId: '', oneRepMax: 0 }])
  }

  function removeExerciseRow(index: number) {
    setProgramExercises(programExercises.filter((_, i) => i !== index))
  }

  function updateExerciseRow(index: number, field: 'exerciseId' | 'oneRepMax', value: any) {
    const updated = [...programExercises]
    updated[index] = { ...updated[index], [field]: value }
    setProgramExercises(updated)
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
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">5/3/1 Programs</h1>
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
            <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Create 5/3/1 Program</h2>
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

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Exercises & 1RM
                  </label>
                  <button
                    type="button"
                    onClick={addExerciseRow}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    + Add Exercise
                  </button>
                </div>

                <div className="space-y-3">
                  {programExercises.map((ex, index) => (
                    <div key={index} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-3">
                      <div className="flex gap-3">
                        <select
                          value={ex.exerciseId}
                          onChange={(e) => updateExerciseRow(index, 'exerciseId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                        >
                          <option value="">Select compound exercise...</option>
                          {exercises.map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>
                              {exercise.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={ex.oneRepMax || ''}
                          onChange={(e) => updateExerciseRow(index, 'oneRepMax', parseFloat(e.target.value) || 0)}
                          placeholder="1RM (kg)"
                          min="0"
                          step="0.5"
                          className="w-32 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                        />
                        {programExercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExerciseRow(index)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Generate Program
                </button>
              </div>
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
              {selectedProgram.exercises.map((exercise) => {
                const weeks = generate531Program(exercise.oneRepMax)
                return (
                  <div key={exercise.id} className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                    <div className="bg-purple-50 dark:bg-purple-950 px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{exercise.exercise.name}</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        1RM: {exercise.oneRepMax}kg • Training Max: {exercise.trainingMax}kg (90%)
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
            Create your first 5/3/1 program based on your one-rep maxes
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
              {program.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{program.description}</p>
              )}
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Exercises:</p>
                {program.exercises.map((ex) => (
                  <div key={ex.id} className="flex justify-between items-center text-sm">
                    <span className="text-zinc-900 dark:text-zinc-50">{ex.exercise.name}</span>
                    <span className="text-zinc-600 dark:text-zinc-400">1RM: {ex.oneRepMax}kg</span>
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
