import Link from "next/link";
import { Dumbbell, TrendingUp, Calendar } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
          Strength Tracker
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Track your workouts, manage 5/3/1 programs, and monitor your strength progress
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          href="/workouts"
          className="group p-8 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-full group-hover:scale-110 transition-transform">
              <Dumbbell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Log Workouts
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Record your exercises, sets, reps, and weights. Keep a detailed history of your training.
            </p>
          </div>
        </Link>

        <Link
          href="/programs"
          className="group p-8 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-full group-hover:scale-110 transition-transform">
              <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              5/3/1 Programs
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Generate personalized 5/3/1 training programs based on your one-rep maxes.
            </p>
          </div>
        </Link>

        <Link
          href="/stats"
          className="group p-8 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-full group-hover:scale-110 transition-transform">
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Track Progress
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Visualize your strength trends, body weight, and body fat percentage over time.
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Info */}
      <div className="bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">
          Getting Started
        </h3>
        <ul className="space-y-2 text-zinc-700 dark:text-zinc-300">
          <li className="flex items-start">
            <span className="font-bold mr-2">1.</span>
            <span>Log your first workout to start tracking your training</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">2.</span>
            <span>Create a 5/3/1 program by entering your one-rep maxes</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">3.</span>
            <span>Monitor your progress with charts and analytics in the Stats page</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
