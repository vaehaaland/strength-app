# strength-app

A comprehensive workout tracking application built with Next.js 16, featuring 5/3/1 program generation, body metrics tracking, and progress visualization.

## Features

- 📝 **Workout Logging**: Track exercises, sets, reps, and weights
- 📊 **5/3/1 Program Wizard**: Multi-step wizard to create personalized 5/3/1 programs with day-specific accessories based on your 1RM
- 📈 **Progress Tracking**: Visualize strength trends, body weight, and body fat percentage
- 🎨 **Modern UI**: Clean, responsive design optimized for mobile and desktop
- 📱 **PWA Ready**: Installable as a progressive web app
- 🗑️ **Soft Deletes**: Safely remove workouts and programs without permanent data loss

## Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/vaehaaland/strength-app.git
cd strength-app
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
node init-db.js
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Docker Deployment

For production deployment with Docker, see [DOCKER.md](DOCKER.md) for detailed instructions.

Quick start:
```bash
docker build -t strength-app .
docker run -p 3000:3000 -v $(pwd)/data:/data strength-app
```

## Database

The app uses SQLite with Prisma ORM. The database is automatically created with 12 pre-seeded exercises when you run `init-db.js`:

**Compound Exercises:**
- Squat
- Bench Press
- Deadlift
- Overhead Press
- Barbell Row
- Front Squat
- Incline Bench Press

**Accessory Exercises:**
- Romanian Deadlift
- Pull-ups
- Dips
- Lunges
- Leg Press

## Building for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Prisma ORM 5.22.0
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Usage

### Logging Workouts
1. Navigate to the "Workouts" page
2. Click "Log Workout"
3. Enter workout name, date, and exercises
4. Save your workout

### Creating 5/3/1 Programs
1. Navigate to the "Programs" page
2. Click "Create Program"
3. Select "5/3/1" as the program type
4. **Step 1:** Enter your 1RM (one-rep max) for each main lift:
   - Deadlift
   - Bench Press
   - Squat
   - Overhead Press
5. **Steps 2-5:** For each workout day, select accessory exercises with sets/reps:
   - Click "Next" to move through each day
   - Add accessories specific to that day's main lift (optional)
   - Click "+ Add Accessory" to add more exercises
6. Click "Create Program" to save
7. View the generated 4-week cycle with calculated weights

When logging a workout from a 5/3/1 program, select the program and then choose which day (e.g., "Day 1 - Deadlift") to automatically populate the main lift and accessories for that day.

### Tracking Progress
1. Navigate to the "Stats" page
2. Click "Log Body Metrics" to add body weight and body fat data
3. View charts showing your progress over time

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## License

MIT
