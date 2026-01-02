# AGENTS.md - Next.js Project Contributor Guide

Welcome to this Next.js/TypeScript project repository. This guide explains not only how the code is structured, but also **what the product is**, how the **training domain works**, and the **rules behind the workout generator**.

---

## Product intent (north star)

This project is a **workout tracking and auto-workout generation app**.

Primary goals:

* Track workouts, exercises, and long-term progress (including PRs).
* Generate suggested training sessions automatically based on user preferences.
* Support periodized training (hypertrophy, strength, power, deload) while remaining simple to execute in practice.

**Core design principle:**

> Compound lifts anchor sessions. Accessories exist to support compounds.

---

## Domain vocabulary

The following terms have specific meaning in this app and should be used consistently.

* **Compound**: Multi-joint lift that anchors a session (e.g. Squat, Bench Press, Deadlift, Overhead Press, Rows, Pull-ups).
* **Accessory**: Support or isolation exercise used for volume, balance, aesthetics, and injury prevention.
* **Exercise role**:

  * `main_compound`: Primary anchor lift of the session (first heavy lift).
  * `secondary_compound`: Supporting compound lift with less CNS stress.
  * `accessory`: Isolation, health, or volume work.
* **Movement patterns**: `squat | hinge | push | pull | carry | core`.
* **Training phases**: `hypertrophy | strength | power | deload`.

---

## Repository overview

* **App directory**: `app/` houses App Router routes, layouts, and API handlers (`route.ts`).
* **Library**: `lib/` contains shared utilities and domain logic.
* **Domain logic**: `lib/domain/` contains workout generator rules, mappings, and constraints.
* **Database schema**: `prisma/` contains the Prisma schema, migrations, and seeds (SQLite).
* **Public assets**: `public/` contains static assets.
* **Server**: `server/index.js` holds any legacy or standalone server logic.
* **Configuration**: `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `next-env.d.ts`, `.env.local`.

---

## Local workflow

1. Install dependencies:

   ```bash
   npm install
   ```
2. Ensure `.env.local` exists with:

   ```env
   DATABASE_URL=file:./dev.db
   ```
3. Initialize or seed the database:

   ```bash
   node init-db.js
   ```
4. Start development server:

   ```bash
   npm run dev
   ```
5. Lint:

   ```bash
   npm run lint
   ```
6. Production build:

   ```bash
   npm run build
   npm run start
   ```

---

## Workout generator rules

These rules define how sessions are generated and must be respected by all contributors.

### Session structure (default)

* 1 × `main_compound`
* 1–2 × `secondary_compound` (optional, phase/time dependent)
* 2–4 × `accessory`

### Accessory selection

* Accessories are selected via an explicit `accessoryMap` tied to the main compound.
* Accessories are grouped as `primary`, `secondary`, and `optional`.
* At least one health/balance movement should be included when relevant (e.g. Face Pulls for upper body days).

### Phase behavior

* **Hypertrophy**: Higher volume, more accessories, moderate loads.
* **Strength**: Fewer accessories, heavier compounds, longer rest.
* **Power**: Lower volume, speed/quality focus, accessories mostly core/stability.
* **Deload**: Reduced volume and intensity while preserving movement patterns.

### Constraints

* Maximum **one heavy hinge** per session (Deadlift, RDL, heavy Good Mornings).
* Shoulder health: pressing volume should be balanced with rear delts / face pulls weekly.
* Core exposure: minimum two core-focused movements per week.

---

## Data model expectations (high level)

Contributors should align with these conceptual models:

* **Exercise**: `id`, `name`, `category`, `movementPattern`, `equipment`, `primaryMuscles`.
* **WorkoutSession**: `id`, `date`, `exercises`.
* **SessionExercise**: `exerciseId`, `role`, `sets`.
* **SetEntry**: `reps`, `weight`, `rpe`, `notes`.
* **PR**: `exerciseId`, `type (1RM | 3RM | 5RM | time)`, `value`, `date`.

The canonical exercise list is the source of truth for exercise names and IDs.

---

## Testing guidelines

* No automated test suite is configured yet; rely on manual testing and linting.
* When tests are introduced, keep them close to the feature they validate.
* Prefer MSW or Prisma fixtures for API mocking.

---

## Style notes

* Use Server Components by default; add `'use client'` only when necessary.
* Keep TypeScript strict; avoid `any`.
* Prefer data-driven configuration over hardcoded conditionals.
* Keep domain logic out of UI components and API route handlers.

---

## Commit message format

Use conventional commits:

```
type(scope): description
```

Examples:

```
feat(generator): add accessory selection rules
fix(api): validate workout payload
refactor(domain): simplify exercise mapping
```

---

## Pull request expectations

PRs should include:

* Summary of functional and UX impact
* Performance considerations
* Screenshots for UI changes
* Notes on API or domain logic changes

Before submitting:

* [ ] `npm run lint` passes
* [ ] `npm run build` succeeds
* [ ] Domain rules respected
* [ ] Canonical exercise list unchanged or documented

---

## Contribution do / don’t

**Do**:

* Keep workout generation deterministic with clear constraints.
* Extend generator behavior via configuration and mappings.
* Respect training domain rules.

**Don’t**:

* Invent new exercise names without adding them to the canonical list.
* Generate sessions with overlapping heavy compounds.
* Mix UI concerns with domain logic.

---

## Helpful prompts for AI contributors

* "Generate a workout session following generator rules for a Pull day."
* "Add a new compound exercise and update accessoryMap accordingly."
* "Refactor generator logic to support a new training phase."
* "Create a typed API route for logging workout sessions."
