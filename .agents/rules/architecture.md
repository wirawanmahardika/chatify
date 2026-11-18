---
trigger: always_on
---

# Feature-Based Architecture

This project follows a **feature-based modular architecture** centered around `src/modules/<feature>/` and `src/shared/`.

## Dependency Direction

- `src/index.ts` → `src/modules/*` → `src/shared/*`
- `src/shared/` must **never** import from `src/modules/*`.
- `src/config.ts` may be imported by `src/index.ts`, `src/shared/*`, and `src/modules/*`.

## Feature Modules (`src/modules/<feature>/`)

- Group code by business capability/domain (e.g., `auth`, `chat`) rather than by technical layer at the top level.
- Each feature module is self-contained and organized into:
  - `index.ts` — Elysia module (`new Elysia(...)`) defining HTTP routes, WebSocket handlers, and route-level hooks/middleware.
  - `model.ts` — Zod validation schemas (`z`) and inferred domain/request types (`z.infer<typeof ...>`).
  - `service.ts` — Feature business logic and Drizzle ORM queries.
  - `views.tsx` — Feature-specific JSX pages and HTMX partial components.
- Register every feature module in `src/index.ts` via `.use(<feature>Module)`. Do not define feature routes or business logic directly in `src/index.ts`.

## Cross-Feature Communication & Boundaries

- Keep feature internals encapsulated. When another feature needs data or behavior (e.g., `chat` validating a user session via `auth`), import only from the target feature's `service.ts` or `model.ts` (for shared types)—never reach into another feature's `views.tsx` or `index.ts`.
- Avoid circular dependencies between modules in `src/modules/`. If two or more features share logic, utilities, or UI components, promote them to `src/shared/`.

## Shared Layer (`src/shared/`)

- Reserve `src/shared/` strictly for cross-cutting concerns used across multiple features:
  - `db.ts` — Drizzle client and database table definitions.
  - `views/layout.tsx` — App-wide `Layout`.
  - `components/*.tsx` — Reusable cross-feature UI components.
  - Generic utilities (e.g., `idGenerator.ts`, `logger.ts`).
- Do not place feature-specific business logic, feature-specific views, or feature-specific components inside `src/shared/`.
