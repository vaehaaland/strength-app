# Strength Tracker - Copilot Instructions

## Architecture Overview

**Strength Tracker** is a Next.js-based Progressive Web App (PWA) for workout tracking with a mobile-first design. It uses a three-tier architecture:

1. **Frontend** ([app/page.jsx](app/page.jsx)): React client-side app loaded as a single page. Navigation between views (Workouts, Programs, Stats) is client-side; state management via [public/app.js](public/app.js).
2. **Backend API** ([app/api/](app/api/)): Next.js Route Handlers (not server actions). Each resource has a folder with route.js (e.g., `/api/exercises/route.js`). Patterns: GET/POST in route.js, nested routes for IDs in `[id]/route.js`.
3. **Database** ([lib/db.js](lib/db.js)): SQLite with promise-based wrapper. Database initialized at `strength-app.db`. Schema created lazily on first app start.

**Key Design Decision**: All data stored locally (SQLite) with no backend sync. PWA works fully offline via service worker ([public/sw.js](public/sw.js)).

## Data Model & API Patterns

Core tables: `exercises`, `workout_programs`, `program_workouts`, `program_exercises`, `workout_logs`, `workout_log_exercises`, `health_stats`.

**API endpoints follow RESTful pattern**:
- `GET /api/exercises` → list all
- `POST /api/exercises` → create
- `GET /api/exercises/[id]` → detail
- `PUT/DELETE /api/exercises/[id]` → update/delete

**Database access pattern** ([app/api/exercises/route.js](app/api/exercises/route.js)):
```javascript
import { getDatabase } from '@/lib/db';

const database = await getDatabase();
const result = await database.run(sql, [params]);
```

Error handling: wrap in try-catch, return `NextResponse.json({ error: '...' }, { status: 500 })`.

## Frontend Integration Points

The main app [public/app.js](public/app.js) (1100+ lines) handles:
- **State management**: Global `state` object (currentView, currentWorkoutLog, exercises, programs, etc.)
- **View rendering**: Modals for create/edit operations; detail views for drill-downs
- **API communication**: `fetchAPI(endpoint, options)` wrapper around fetch
- **Special feature - 5/3/1 Program**: `create531Program()` generates a 4-day program with specific set/rep schemes (not obvious in code - requires domain knowledge of 5/3/1 strength training)

**Adding new features**: Follow the pattern:
1. Create API route in [app/api/](app/api/)
2. Add load/save functions in [public/app.js](public/app.js)
3. Add UI modal/view in [app/page.jsx](app/page.jsx)
4. Wire up event listeners in setupEventListeners()

## Development Workflow

```bash
npm install              # One-time setup
npm run dev            # Next.js dev server, localhost:3000
npm run build          # Production build
npm start              # Run built app
npm run lint           # ESLint (basic config)
```

The app auto-initializes the database on first run. Service worker is registered on page load ([app/page.jsx](app/page.jsx) useEffect).

## Critical Patterns to Preserve

1. **No server state**: Everything is request-scoped. Database connection obtained per-request via `getDatabase()`.
2. **Consistent error responses**: All API errors return JSON with `{ error: '...' }` and appropriate status codes.
3. **Mobile-first CSS**: Styles in [public/style.css](public/style.css); responsive breakpoints are important for PWA usability.
4. **PWA manifest**: [public/manifest.json](public/manifest.json) configures installability; changes here affect mobile install experience.

## Common Tasks & Examples

**Adding a new API resource**:
- Create `app/api/[resource]/route.js` with GET/POST
- Create `app/api/[resource]/[id]/route.js` with GET/PUT/DELETE
- Follow exercise/program routes as templates

**Modifying database schema**:
- Edit `initializeDatabase()` in [lib/db.js](lib/db.js)
- Schema is created once on startup; changes won't auto-migrate existing databases
- Consider adding a migration pattern if major schema changes are needed

**Updating UI**: Edit [public/app.js](public/app.js) for view logic or [app/page.jsx](app/page.jsx) for HTML structure. Styles in [public/style.css](public/style.css).
