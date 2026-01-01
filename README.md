# 💪 Strength Tracker

A modern Progressive Web App (PWA) for tracking workouts, health stats, and managing training programs. Built with a mobile-first approach, perfect for use on smartphones while also functional on desktop computers.

## Features

- **Workout Logging**: Track sets, reps, and weights for each exercise
- **Training Programs**: Create custom workout programs or use the built-in 5/3/1 template
- **Health Stats**: Monitor body weight and body fat percentage over time
- **5/3/1 Support**: Pre-configured template for the popular 5/3/1 strength program
- **Progressive Web App**: Install on mobile devices and use offline
- **Mobile-First Design**: Optimized for smartphone use with responsive desktop support
- **Local Database**: All data stored locally using SQLite

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vaehaaland/strength-app.git
cd strength-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the Next.js dev server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

5. For a production build:
```bash
npm run build
npm start
```

### For Homelab Deployment

The app runs on port 3000 by default. You can change this by setting the PORT environment variable:

```bash
PORT=8080 npm start
```

To run in production mode behind a reverse proxy (nginx, Apache, Caddy, etc.), configure your proxy to forward requests to `http://localhost:3000`.

Example Caddy configuration:
```
strength.yourdomain.com {
    reverse_proxy localhost:3000
}
```

Example nginx configuration:
```nginx
server {
    server_name strength.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Usage

### Creating a 5/3/1 Program

1. Navigate to the **Programs** tab
2. Click **Create 5/3/1 Program**
3. Select your main lifts (Squat, Bench Press, Deadlift, Overhead Press)
4. Click **Create 5/3/1 Program**

The app will automatically create a 4-day program with appropriate sets and rep schemes.

### Logging a Workout

1. Navigate to the **Workouts** tab
2. Click **Start Workout**
3. Select a program workout or create a custom workout
4. Enter sets, reps, and weights for each exercise
5. Check off completed sets
6. Click **Complete Workout** when finished

### Tracking Health Stats

1. Navigate to the **Stats** tab
2. Click **Add Entry**
3. Enter your weight, body fat percentage, and any notes
4. Click **Save Stats**

## Project Structure

```
strength-app/
├── app/
│   ├── api/              # Next.js route handlers (replaces Express API)
│   ├── head.js           # (Optional) document <head> metadata (CSS is not loaded here in the App Router)
│   ├── layout.js         # App Router root layout & metadata; imports global CSS/styles
│   └── page.jsx          # Main UI shell that mounts the existing JS app
├── lib/
│   └── db.js             # Shared SQLite connection & schema setup
├── public/
│   ├── style.css         # Styles (still served for the PWA + service worker)
│   ├── app.js            # Frontend JavaScript (runs in the Next.js page)
│   ├── manifest.json     # PWA manifest
│   ├── sw.js             # Service worker for offline functionality
│   └── icon-*.svg        # App icons
├── server/               # Legacy Express server (kept for reference)
├── jsconfig.json         # Path aliases for @/* imports
├── package.json
└── README.md
```

## Database Schema

The app uses SQLite with the following tables:

- **exercises**: Available exercises
- **workout_programs**: Training programs
- **program_workouts**: Workouts within programs
- **program_exercises**: Exercises within workouts
- **workout_logs**: Logged workout sessions
- **exercise_logs**: Individual set logs
- **health_stats**: Body measurements over time

## API Endpoints

### Exercises
- `GET /api/exercises` - List all exercises
- `POST /api/exercises` - Create new exercise
- `GET /api/exercises/:id` - Get exercise details

### Programs
- `GET /api/programs` - List all programs
- `POST /api/programs` - Create new program
- `GET /api/programs/:id` - Get program with workouts
- `POST /api/programs/:id/workouts` - Add workout to program
- `POST /api/program-workouts/:id/exercises` - Add exercise to workout

### Workout Logs
- `GET /api/workout-logs` - List recent workout logs
- `POST /api/workout-logs` - Create new workout log
- `GET /api/workout-logs/:id` - Get workout log details
- `PUT /api/workout-logs/:id` - Update workout log
- `POST /api/workout-logs/:id/exercises` - Log exercise set

### Health Stats
- `GET /api/health-stats` - List health stats
- `POST /api/health-stats` - Add new health stat entry

## Mobile Installation

### iOS (iPhone/iPad)
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android
1. Open the app in Chrome
2. Tap the menu button (three dots)
3. Tap "Add to Home screen"
4. Tap "Add"

## Development

The app is built with:
- **Runtime**: Next.js (App Router) + React 18
- **API**: Next.js route handlers backed by SQLite (see `app/api/*`)
- **Frontend**: Existing vanilla JS UI mounted in `app/page.jsx` with shared styling served from `public/style.css`
- **PWA**: Service Worker and Web App Manifest served from `public/`

Build workflow:
- `npm run dev` to develop with hot reload on port 3000
- `npm run build && npm start` for production

Future cleanups can progressively migrate the DOM-driven UI in `public/app.js` into React components while reusing the current API routes.

## Security Considerations

This application is designed for local/homelab use. If deploying to a public-facing server, consider adding:
- Rate limiting middleware (e.g., express-rate-limit)
- Authentication and authorization
- HTTPS/TLS encryption
- Input sanitization beyond basic validation
- CSRF protection

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
