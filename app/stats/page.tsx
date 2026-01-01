'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Plus, TrendingUp, Weight, Activity } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface BodyMetric {
  id: string
  date: string
  weight?: number
  bodyFat?: number
  notes?: string
}

interface WorkoutExercise {
  id: string
  sets: number
  reps: number
  weight: number
  exercise: {
    name: string
  }
}

interface Workout {
  id: string
  date: string
  exercises: WorkoutExercise[]
}

export default function StatsPage() {
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state
  const [metricDate, setMetricDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [metricWeight, setMetricWeight] = useState('')
  const [metricBodyFat, setMetricBodyFat] = useState('')
  const [metricNotes, setMetricNotes] = useState('')

  useEffect(() => {
    fetchBodyMetrics()
    fetchWorkouts()
  }, [])

  async function fetchBodyMetrics() {
    try {
      const res = await fetch('/api/body-metrics')
      const data = await res.json()
      setBodyMetrics(data.reverse()) // Oldest first for charts
    } catch (error) {
      console.error('Failed to fetch body metrics:', error)
    }
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const res = await fetch('/api/body-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: metricDate,
          weight: metricWeight ? parseFloat(metricWeight) : null,
          bodyFat: metricBodyFat ? parseFloat(metricBodyFat) : null,
          notes: metricNotes,
        }),
      })

      if (res.ok) {
        setIsFormOpen(false)
        setMetricDate(format(new Date(), 'yyyy-MM-dd'))
        setMetricWeight('')
        setMetricBodyFat('')
        setMetricNotes('')
        fetchBodyMetrics()
      }
    } catch (error) {
      console.error('Failed to create body metric:', error)
    }
  }

  // Calculate strength trends per exercise
  const strengthTrends = workouts.reduce((acc, workout) => {
    workout.exercises.forEach((ex) => {
      const exerciseName = ex.exercise.name
      const maxWeight = ex.weight

      if (!acc[exerciseName]) {
        acc[exerciseName] = []
      }

      acc[exerciseName].push({
        date: format(parseISO(workout.date), 'MMM dd'),
        weight: maxWeight,
      })
    })
    return acc
  }, {} as Record<string, Array<{ date: string; weight: number }>>)

  // Get main compound lifts for display
  const mainLifts = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press']
    .filter((lift) => strengthTrends[lift])
    .slice(0, 4)

  // Prepare body metrics chart data
  const bodyMetricsData = bodyMetrics.map((metric) => ({
    date: format(parseISO(metric.date), 'MMM dd'),
    weight: metric.weight || null,
    bodyFat: metric.bodyFat || null,
  }))

  // Summary stats
  const totalWorkouts = workouts.length
  const latestWeight = bodyMetrics[bodyMetrics.length - 1]?.weight
  const latestBodyFat = bodyMetrics[bodyMetrics.length - 1]?.bodyFat

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
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Statistics</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Log Body Metrics</span>
        </button>
      </div>

      {/* Body Metrics Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Log Body Metrics</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Date
                </label>
                <input
                  type="date"
                  value={metricDate}
                  onChange={(e) => setMetricDate(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Body Weight (kg)
                </label>
                <input
                  type="number"
                  value={metricWeight}
                  onChange={(e) => setMetricWeight(e.target.value)}
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                  placeholder="e.g., 75.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Body Fat (%)
                </label>
                <input
                  type="number"
                  value={metricBodyFat}
                  onChange={(e) => setMetricBodyFat(e.target.value)}
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                  placeholder="e.g., 15.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Notes
                </label>
                <textarea
                  value={metricNotes}
                  onChange={(e) => setMetricNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                  placeholder="Any observations..."
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Metrics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-2xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Total Workouts</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-50">{totalWorkouts}</p>
            </div>
            <Activity className="h-12 w-12 text-blue-600 dark:text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-2xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Current Weight</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-50">
                {latestWeight ? `${latestWeight}kg` : 'N/A'}
              </p>
            </div>
            <Weight className="h-12 w-12 text-purple-600 dark:text-purple-400 opacity-50" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-2xl border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Body Fat %</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-50">
                {latestBodyFat ? `${latestBodyFat}%` : 'N/A'}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-600 dark:text-green-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Body Weight & Body Fat Chart */}
      {bodyMetricsData.length > 0 && (
        <div className="p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Body Composition Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bodyMetricsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                name="Weight (kg)"
              />
              <Line
                type="monotone"
                dataKey="bodyFat"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                name="Body Fat (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Strength Trends */}
      {mainLifts.length > 0 && (
        <div className="p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Strength Progress</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {mainLifts.map((liftName) => (
              <div key={liftName}>
                <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-50">{liftName}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={strengthTrends[liftName].slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '10px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb',
                      }}
                    />
                    <Bar dataKey="weight" fill="#3b82f6" name="Weight (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {workouts.length === 0 && bodyMetrics.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <TrendingUp className="h-16 w-16 mx-auto mb-4 text-zinc-400" />
          <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-50">No data yet</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Start logging workouts and body metrics to see your progress
          </p>
        </div>
      )}
    </div>
  )
}
