# strength-app

A comprehensive workout tracking application built with Next.js 16, featuring 5/3/1 program generation, body metrics tracking, and progress visualization.

## Features

- 📝 **Workout Logging**: Track exercises, sets, reps, and weights
- 📊 **5/3/1 Program Generator**: Create personalized strength programs based on your 1RM
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

### Database Migrations & Backups

The application includes a **safe migration system** that automatically backs up your database before any schema changes. See the [Database Migration & Backup Guide](docs/DATABASE_MIGRATION.md) for details on:

- Automatic backup before migrations
- Database integrity checks
- Easy restoration from backups
- JSON data exports
- Docker deployment with data persistence

**Quick backup commands:**
```bash
npm run backup              # Create manual backup
npm run migrate             # Safe migration with backup
npm run restore -- --list   # List available backups
npm run restore -- --latest # Restore from latest backup
```

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
3. Enter program name and your 1RM for each exercise
4. View the generated 4-week cycle with calculated weights

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
