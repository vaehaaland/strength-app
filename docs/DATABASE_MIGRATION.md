# Database Migration & Backup Guide

## Overview

This application uses a **safe migration system** that automatically backs up your database before applying any schema changes. This ensures data safety and provides easy recovery options if something goes wrong.

## Key Features

- ✅ **Automatic backups** before every migration
- ✅ **Database integrity checks** before and after migrations
- ✅ **Easy restoration** from any backup point
- ✅ **JSON exports** for data portability
- ✅ **Automatic cleanup** of old backups
- ✅ **Docker-compatible** with persistent volume support

## Quick Commands

```bash
# Create a manual backup
npm run backup

# Create backup with JSON export
npm run backup:with-json

# Run safe migration (development)
npm run migrate

# Run safe migration (production/Docker)
npm run migrate:deploy

# List all backups
npm run restore -- --list

# Restore from latest backup
npm run restore -- --latest

# Restore from specific backup
npm run restore -- /path/to/backup.db

# Clean up old backups (keep 10 most recent)
npm run cleanup-backups
```

## How It Works

### Safe Migration Process

When you run `npm run migrate`, the system performs these steps:

1. **Integrity Check**: Verifies current database is healthy
2. **Backup Creation**: Creates a timestamped backup in `backups/` directory
3. **Migration Execution**: Runs Prisma migrations
4. **Post-Migration Check**: Verifies database is still healthy after migration
5. **Cleanup**: Removes old backups (keeps 10 most recent by default)

If any step fails, the process stops and provides instructions for recovery.

### User Model Migration

The application includes a migration that adds user authentication support. When migrating existing data:

- A default system user is automatically created (email: `system@strength-app.local`)
- All existing Programs, Workouts, and BodyMetrics are assigned to this default user
- This ensures backward compatibility and allows existing installations to upgrade smoothly
- After migration, you can create new users and transfer ownership of data if needed

### Backup Naming Convention

Backups are stored with descriptive names:
```
backup-pre-migration-2026-01-03T12-30-45-123Z.db
backup-manual-2026-01-03T14-15-22-456Z.db
```

- `pre-migration`: Automatic backup before migration
- `manual`: User-initiated backup
- Timestamp includes date and time in ISO format

## Development Workflow

### Making Schema Changes

1. **Modify Prisma schema** (`prisma/schema.prisma`)
2. **Create migration**:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
   This automatically uses the safe migration process.

3. **Verify changes**: The system will report success or failure

### If Migration Fails

If a migration fails, you'll see:
- Error message explaining what went wrong
- List of available backups
- Command to restore from the most recent backup

To restore:
```bash
npm run restore -- --latest
```

Or restore from a specific backup:
```bash
npm run restore -- /path/to/backup/backup-pre-migration-2026-01-03T12-30-45-123Z.db
```

## Production/Docker Deployment

### First-Time Setup

When deploying with Docker, the database is automatically initialized:

```bash
docker-compose up -d
```

The entrypoint script will:
1. Create database if it doesn't exist
2. Run initial migrations
3. Seed with default exercises

### Updating with New Migrations

When you deploy a new version with schema changes:

1. **Pull new image**:
   ```bash
   docker pull your-registry/strength-app:latest
   ```

2. **Restart container**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Check logs**:
   ```bash
   docker-compose logs -f
   ```

The safe migration process runs automatically and creates backups in `/data/db/backups/`.

### Accessing Backups in Docker

Backups are stored in the persistent volume:

```bash
# List backups
docker exec strength-app ls -lh /data/db/backups/

# Copy backup to host
docker cp strength-app:/data/db/backups/backup-pre-migration-2026-01-03T12-30-45-123Z.db ./

# Restore backup in container
docker exec strength-app node scripts/restore-backup.js /data/db/backups/backup-pre-migration-2026-01-03T12-30-45-123Z.db
docker-compose restart
```

## Manual Backup Strategies

### Before Major Changes

Create a manual backup before making significant changes:

```bash
npm run backup:with-json
```

This creates both:
- SQLite database backup
- JSON export of all data (portable, human-readable)

### Scheduled Backups

You can set up automated backups using cron (Linux/Mac) or Task Scheduler (Windows).

**Example cron job** (daily at 2 AM):
```bash
0 2 * * * cd /path/to/strength-app && npm run backup:with-json
```

**Docker example** with cron:
```bash
# Add to docker-compose.yml
services:
  backup:
    image: your-registry/strength-app:latest
    volumes:
      - ./data:/data
    entrypoint: node scripts/backup.js --with-json
    # Use a cron container to trigger this daily
```

## Data Export & Import

### Exporting Data

Export all data to JSON format:

```bash
npm run backup:with-json
```

The JSON file contains:
- All exercises
- All programs with their exercises
- All workouts with sets
- All body metrics

JSON files are stored in `exports/` directory.

### Importing Data

To import data, you can:

1. **Restore from JSON manually** by using the Prisma client
2. **Use the database backup** for exact restoration

Example import script (create your own):
```javascript
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();
const data = JSON.parse(fs.readFileSync('export-2026-01-03.json'));

// Import exercises
for (const exercise of data.exercises) {
  await prisma.exercise.create({ data: exercise });
}
// ... similar for other models
```

## Backup Storage Locations

### Local Development
- Database: `./dev.db`
- Backups: `./backups/`
- Exports: `./exports/`

### Docker Production
- Database: `/data/db/app.db`
- Backups: `/data/db/backups/`
- Exports: `/data/db/exports/`

### Volume Mounting

Ensure your `docker-compose.yml` mounts the data directory:

```yaml
services:
  app:
    image: strength-app:latest
    volumes:
      - ./data:/data  # Mounts backups, exports, and database
    ports:
      - "3000:3000"
```

## Troubleshooting

### "Database integrity check failed"

This means the database might be corrupted. Try:

1. Check disk space
2. Verify file permissions
3. Restore from most recent backup:
   ```bash
   npm run restore -- --latest
   ```

### "No backups found"

If you have no backups:

1. Create a backup immediately:
   ```bash
   npm run backup:with-json
   ```

2. For future protection, migrations will create automatic backups

### "Migration failed"

If a migration fails:

1. Review the error message
2. Check Prisma migration logs
3. Restore from pre-migration backup:
   ```bash
   npm run restore -- --latest
   ```
4. Fix the schema issue
5. Try migration again

### Disk Space Management

Backups can accumulate over time. Clean up old backups:

```bash
# Keep only 10 most recent
npm run cleanup-backups

# Keep only 5 most recent
npm run cleanup-backups 5
```

## Best Practices

1. **Always create a backup** before major changes
2. **Test migrations** in development first
3. **Monitor disk space** for backup storage
4. **Keep at least 10 backups** for recovery options
5. **Create JSON exports** before version upgrades
6. **Verify backups** periodically by testing restoration

## Security Notes

- Backups contain all your application data
- Store backups securely if they contain sensitive information
- Restrict access to backup directories in production
- Consider encrypting backup files for sensitive deployments

## Recovery Scenarios

### Scenario 1: Migration Gone Wrong

```bash
# Restore from pre-migration backup
npm run restore -- --latest

# Verify database works
npm run dev
```

### Scenario 2: Accidental Data Deletion

```bash
# List available backups
npm run restore -- --list

# Restore from before deletion occurred
npm run restore -- /path/to/backup.db
```

### Scenario 3: Database Corruption

```bash
# Try to restore from latest working backup
npm run restore -- --latest

# If that doesn't work, try earlier backups
npm run restore -- --list
npm run restore -- /path/to/earlier/backup.db
```

### Scenario 4: Complete Data Loss

If you lose the database but have JSON exports:

1. Restore from JSON export manually
2. Or restore from SQLite backup if available
3. Initialize new database: `node init-db.js`
4. Import your data

## Monitoring

### Check Backup Health

```bash
# List all backups with sizes and dates
npm run restore -- --list

# Check disk usage
du -sh backups/
```

### Verify Latest Backup

```bash
# Create a test restore
npm run restore -- --latest

# Run integrity check (custom script needed)
node -e "require('./lib/backup').verifyIntegrity()"
```

## Support

For issues related to backups and migrations:

1. Check this guide first
2. Review application logs
3. Check GitHub issues
4. Create a new issue with:
   - Error messages
   - Steps to reproduce
   - Backup/restore commands used
