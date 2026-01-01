'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function HomePage() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => console.error('Service worker registration failed', error));
    }
  }, []);

  return (
    <>
      <nav className="nav">
        <div className="nav-container">
          <h1 className="nav-title">💪 Strength Tracker</h1>
          <div className="nav-links">
            <button className="nav-link active" data-view="workouts">
              Workouts
            </button>
            <button className="nav-link" data-view="programs">Programs</button>
            <button className="nav-link" data-view="stats">Stats</button>
          </div>
        </div>
      </nav>

      <main className="main">
        <div id="workouts-view" className="view active">
          <div className="view-header">
            <h2>Workout Log</h2>
            <button className="btn btn-primary" id="start-workout-btn">
              Start Workout
            </button>
          </div>
          <div id="workout-logs-list" className="list" />
        </div>

        <div id="programs-view" className="view">
          <div className="view-header">
            <h2>Training Programs</h2>
            <button className="btn btn-primary" id="create-program-btn">
              Create Program
            </button>
          </div>
          <div className="program-templates">
            <button className="btn btn-secondary" id="create-531-btn">
              Create 5/3/1 Program
            </button>
          </div>
          <div id="programs-list" className="list" />
        </div>

        <div id="stats-view" className="view">
          <div className="view-header">
            <h2>Health Stats</h2>
            <button className="btn btn-primary" id="add-stats-btn">
              Add Entry
            </button>
          </div>
          <div id="stats-list" className="list" />
        </div>

        <div id="program-detail-view" className="view">
          <div className="view-header">
            <button className="btn btn-back" id="back-to-programs">
              ← Back
            </button>
            <h2 id="program-detail-title" />
          </div>
          <div id="program-detail-content" />
        </div>

        <div id="workout-detail-view" className="view">
          <div className="view-header">
            <button className="btn btn-back" id="back-to-workouts">
              ← Back
            </button>
            <h2 id="workout-detail-title">Current Workout</h2>
          </div>
          <div id="workout-detail-content" />
          <div className="workout-actions">
            <button className="btn btn-success" id="complete-workout-btn">
              Complete Workout
            </button>
          </div>
        </div>
      </main>

      <div id="modal" className="modal">
        <div className="modal-content">
          <button className="modal-close">&times;</button>
          <div id="modal-body" />
        </div>
      </div>

      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
