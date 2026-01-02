-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Set" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weight" REAL,
    "rpe" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Set_workoutExerciseId_fkey" FOREIGN KEY ("workoutExerciseId") REFERENCES "WorkoutExercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Set" ("createdAt", "id", "reps", "rpe", "setNumber", "weight", "workoutExerciseId")
SELECT "createdAt", "id", "reps", "rpe", "setNumber", "weight", "workoutExerciseId" FROM "Set";
DROP TABLE "Set";
ALTER TABLE "new_Set" RENAME TO "Set";

CREATE TABLE "new_ProgramExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "oneRepMax" REAL,
    "trainingMax" REAL,
    "sets" INTEGER,
    "reps" INTEGER,
    "weight" REAL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "ProgramExercise_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProgramExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProgramExercise" ("exerciseId", "id", "oneRepMax", "order", "programId", "trainingMax")
SELECT "exerciseId", "id", "oneRepMax", "order", "programId", "trainingMax" FROM "ProgramExercise";
DROP TABLE "ProgramExercise";
ALTER TABLE "new_ProgramExercise" RENAME TO "ProgramExercise";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
