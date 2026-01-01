// 5/3/1 Program Calculator
// Based on Jim Wendler's 5/3/1 methodology

export interface Week531 {
  week: number;
  sets: {
    reps: string; // e.g., "5", "3", "1", "5+"
    percentage: number;
    weight: number;
  }[];
}

export interface Exercise531 {
  name: string;
  oneRepMax: number;
  trainingMax: number;
  weeks: Week531[];
}

/**
 * Calculate training max (90% of 1RM)
 */
export function calculateTrainingMax(oneRepMax: number): number {
  return Math.round(oneRepMax * 0.9);
}

/**
 * Round weight to nearest 2.5 (or 5 for heavier weights)
 */
export function roundWeight(weight: number): number {
  if (weight >= 100) {
    return Math.round(weight / 5) * 5;
  }
  return Math.round(weight / 2.5) * 2.5;
}

/**
 * Calculate weight for a given percentage of training max
 */
export function calculateWeight(trainingMax: number, percentage: number): number {
  return roundWeight(trainingMax * (percentage / 100));
}

/**
 * Generate 5/3/1 program for 4 weeks (3 working weeks + 1 deload)
 */
export function generate531Program(oneRepMax: number): Week531[] {
  const trainingMax = calculateTrainingMax(oneRepMax);

  return [
    {
      week: 1,
      sets: [
        { reps: '5', percentage: 65, weight: calculateWeight(trainingMax, 65) },
        { reps: '5', percentage: 75, weight: calculateWeight(trainingMax, 75) },
        { reps: '5+', percentage: 85, weight: calculateWeight(trainingMax, 85) },
      ],
    },
    {
      week: 2,
      sets: [
        { reps: '3', percentage: 70, weight: calculateWeight(trainingMax, 70) },
        { reps: '3', percentage: 80, weight: calculateWeight(trainingMax, 80) },
        { reps: '3+', percentage: 90, weight: calculateWeight(trainingMax, 90) },
      ],
    },
    {
      week: 3,
      sets: [
        { reps: '5', percentage: 75, weight: calculateWeight(trainingMax, 75) },
        { reps: '3', percentage: 85, weight: calculateWeight(trainingMax, 85) },
        { reps: '1+', percentage: 95, weight: calculateWeight(trainingMax, 95) },
      ],
    },
    {
      week: 4, // Deload week
      sets: [
        { reps: '5', percentage: 40, weight: calculateWeight(trainingMax, 40) },
        { reps: '5', percentage: 50, weight: calculateWeight(trainingMax, 50) },
        { reps: '5', percentage: 60, weight: calculateWeight(trainingMax, 60) },
      ],
    },
  ];
}

/**
 * Generate full 5/3/1 program for multiple exercises
 */
export function generateFullProgram(
  exercises: { name: string; oneRepMax: number }[]
): Exercise531[] {
  return exercises.map((exercise) => {
    const trainingMax = calculateTrainingMax(exercise.oneRepMax);
    return {
      name: exercise.name,
      oneRepMax: exercise.oneRepMax,
      trainingMax,
      weeks: generate531Program(exercise.oneRepMax),
    };
  });
}
