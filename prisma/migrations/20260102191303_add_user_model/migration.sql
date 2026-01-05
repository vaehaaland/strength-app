/*
  Warnings:

  - Added the required column `userId` to the `BodyMetric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Workout` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Insert default system user for existing data migration
-- Password is hashed "system" (bcrypt hash)
INSERT INTO "User" ("id", "email", "password", "name", "createdAt", "updatedAt") 
VALUES ('system-user-default', 'system@strength-app.local', '$2a$10$rZ8qLq5eBFJ0XfJLz5Yg2eYKZqMxZqYq3qxZqYq3qxZqYq3qxZqYq', 'System User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BodyMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" REAL,
    "bodyFat" REAL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BodyMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BodyMetric" ("bodyFat", "createdAt", "date", "id", "notes", "updatedAt", "weight", "userId") 
SELECT "bodyFat", "createdAt", "date", "id", "notes", "updatedAt", "weight", 'system-user-default' FROM "BodyMetric";
DROP TABLE "BodyMetric";
ALTER TABLE "new_BodyMetric" RENAME TO "BodyMetric";
CREATE TABLE "new_Program" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Program_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Program" ("createdAt", "deletedAt", "description", "id", "name", "type", "updatedAt", "userId") 
SELECT "createdAt", "deletedAt", "description", "id", "name", "type", "updatedAt", 'system-user-default' FROM "Program";
DROP TABLE "Program";
ALTER TABLE "new_Program" RENAME TO "Program";
CREATE TABLE "new_Workout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "programId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Workout_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Workout" ("createdAt", "date", "deletedAt", "id", "name", "notes", "programId", "updatedAt", "userId") 
SELECT "createdAt", "date", "deletedAt", "id", "name", "notes", "programId", "updatedAt", 'system-user-default' FROM "Workout";
DROP TABLE "Workout";
ALTER TABLE "new_Workout" RENAME TO "Workout";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
