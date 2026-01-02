# AGENTS.md - Next.js Project Contributor Guide

Welcome to this Next.js/TypeScript project repository. This guide highlights the structure, workflows, and expectations that match how the code currently lives on disk.

## Repository overview
- **App directory**: `app/` houses the App Router routes, layouts, and the `api/` handlers for the JSON endpoints you see (all TypeScript `route.ts` files).
- **Library**: `lib/` contains shared utilities such as Prisma helpers and the database connection helper.
- **Database schema**: `prisma/` keeps the Prisma schema, migrations, and seeds used to drive the SQLite database.
- **Public assets**: `public/` is where static files (icons, images) live; the app references the favicon and other assets from here.
- **Server**: `server/index.js` still exists for any legacy standalone server logic or API mocks alongside the Next frontend.
- **Configuration**: The project relies on `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `next-env.d.ts`, and `.env.local` for environment variables.

## Local workflow
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create an `.env.local` file if it’s missing and set `DATABASE_URL`. Right now the repo ships a working `.env.local`, but if you need to re-create it, set it to `DATABASE_URL=file:./dev.db`.
3. Initialize or seed the database once:
   ```bash
   node init-db.js
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Lint (only lint is wired up today):
   ```bash
   npm run lint
   ```
6. For production checks, build and start:
   ```bash
   npm run build
   npm run start
   ```

## Testing guidelines
- There is no automated Jest/Playwright/Vitest suite configured today; rely on manual verification and the lint step.
- When new tests are introduced, keep them co-located with the feature (e.g., add server tests next to API route, add UI tests near the relevant `app/` slice).
- Consider using MSW or Prisma fixtures when mocking API routes for future tests.
- Keep accessibility and responsiveness in mind when validating UI manually.

## Style notes
- Use Server Components by default and add `'use client'` only when you need interactivity or client-only hooks.
- Keep TypeScript strict; define props and response shapes as soon as you touch a module.
- Prefer the Next.js `Image` component for remote or locally-hosted images so you get automatic optimization.
- Follow the file-based routing conventions in the `app/` tree—each folder/route should use `page.tsx`, `layout.tsx`, and `route.ts` as needed.
- Use `async/await` for server-side data fetching unless you have a compelling reason not to.

## Commit message format
Use conventional commit format:
```
type(scope): description
```
Examples:
```
feat(api): add workout log route
fix(stats): correct chart domain
refactor(db): centralize Prisma helpers
style(ui): refresh program cards
```

## Pull request expectations
PRs should include:
- **Summary**: How the change affects functionality and UX
- **Performance impact**: Any Core Web Vitals or bundle size considerations
- **SEO considerations**: Metadata, structured data, accessibility flow
- **Screenshots**: Visual verification for any UI changes
- **API changes**: Notes on new/altered `route.ts` handlers

Before submitting:
- [ ] All linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables are documented (update `.env.local` if values change)
- [ ] API routes stay strongly typed and documented

## What reviewers look for
- **Next.js patterns**: Solid App Router usage, clear transitions between Server and Client Components
- **Performance**: Efficient data fetching, caching, and minimal bundle shifts
- **SEO**: Metadata, headings, and accessible semantics
- **Security**: Input validation, guards on API routes, and safe Prisma queries
- **UX polish**: Responsive design, error states, and smooth loading states
- **Type safety**: Avoid `any`, prefer typed Prisma models and API response shapes

## Next.js App Router best practices
- Use Server Components by default for better performance.
- Apply `'use client'` only when you need hooks or state on the client.
- Provide `loading.tsx`/`error.tsx` when the feature needs them for a better UX.
- Generate metadata per route if it adds SEO value.
- Use Suspense boundaries and `fetch` caching for smoother data loading.
- Explore parallel/intercepting routes only when they clarify the user flow.

## Data fetching strategies
- Use Server Components for initial data loading.
- Cache fetch calls with the new Next fetch options where appropriate.
- Use React Query/SWR client-side when you need mutation/optimistic UI.
- Handle fetch errors gracefully on both server and client.
- Apply optimistic updates only when the UX clearly benefits.
- Cache expensive operations (e.g., heavy Prisma joins) where it makes sense.

## Performance optimization
- Optimize Core Web Vitals (LCP, FID, CLS).
- Use Next.js `Image` when media benefits from resizing/modern formats.
- Split code with dynamic imports for heavy interactive parts.
- Use `next/font` to load only the fonts you need.
- Add caching headers for static assets and API responses.
- Monitor bundle size, especially if you add new chart or icon libraries.

## SEO and accessibility
- Provide metadata (Open Graph/Twitter) for public-facing routes.
- Keep heading hierarchy logical (`h1`, `h2`, etc.).
- Add structured data when it helps discoverability.
- Ensure keyboard navigation and screen reader compatibility.
- Use semantic HTML and ARIA where needed.

## API routes best practices
- Keep HTTP methods and status codes idiomatic.
- Validate input thoroughly before touching the database.
- Centralize shared logic in `lib/` helpers.
- Add logging/error handling for unexpected failures.
- If you need auth, wrap the API route logic so it stays consistent.
- Document expected request/response shapes in TypeScript.

## Authentication and security
- Lean on middleware or helpers when you need auth/role control.
- Validate inputs on both server and client sides.
- Keep session or token handling secure.
- Protect Prisma queries from injection/over-fetching.
