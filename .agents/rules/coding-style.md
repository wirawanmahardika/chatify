---
trigger: always_on
---

# Coding Style & Technical Conventions

## TypeScript

- Respect `strict: true` in `tsconfig.json`. Avoid `any` where proper types can be defined or inferred.
- Infer request/domain types from Zod schemas using `z.infer<typeof schema>` in `model.ts` instead of duplicating interfaces manually.
- Use `import type` when importing types only.

## Elysia & Validation (Zod Only)

- Use **Zod** (`zod`) exclusively for all validation—environment config (`src/config.ts`), route inputs (`body`, `query`, `params`), and domain schemas in `model.ts`. Do not use Elysia TypeBox (`t`).
- Read environment variables exclusively from `config` in `src/config.ts` rather than accessing `process.env` directly across modules.
- For HTMX-triggered redirects on form/action endpoints, set `set.headers['HX-Redirect'] = '...'`; for standard navigation redirects, use Elysia's `redirect(...)`.
- Return user-facing validation and error messages in **Indonesian**.

## Database (PostgreSQL & Drizzle ORM)

- Use **PostgreSQL** with Drizzle ORM (`drizzle-orm/pg-core` tables and PostgreSQL client in `src/shared/db.ts`); do not use SQLite.
- Always import `db` and table definitions (`*Table`) from `src/shared/db.ts`.
- Keep all Drizzle queries inside `service.ts` files, not inside route handlers (`index.ts`) or JSX views (`views.tsx`).
- Pair `drizzle-orm` with **Zod** validations (e.g., `drizzle-zod` or Zod schemas aligned with database tables) whenever possible.
- When modifying `src/shared/db.ts`, update/generate Drizzle migrations in `drizzle/` rather than altering the database manually.

## Views & Frontend (JSX, HTMX v4, Alpine.js, Tailwind, DaisyUI)

- Use **HTMX v4** and **Alpine.js** installed via the package manager, not manually vendored static files.
- **HTMX v4 First**: Prioritize and utilize all native **HTMX v4** features before using Alpine.js or other client-side libraries. Only reach for Alpine.js or custom JavaScript when HTMX v4 does not provide the required capability.
- Use `@elysiajs/html` (`Html`) JSX pragma as configured in `tsconfig.json` (`jsxFactory: "Html.createElement"`, `jsxFragmentFactory: "Html.Fragment"`).
- Wrap full pages with `Layout` from `src/shared/views/layout.tsx` and enable only the scripts needed (`alpine`, `htmx`, `htmxWebSocket`, `customScript`).
- Return partial JSX components from `views.tsx` for HTMX swaps and error fragments instead of building raw HTML strings.
- Style components using Tailwind CSS v4 and DaisyUI v5 utility classes; put custom CSS only in `public/input.css`.

## Logging

- Use a lightweight shared logger wrapper in `src/shared/logger.ts` instead of calling `console.log`, `console.warn`, or `console.error` directly across modules.
- Include structured context fields (e.g., `module`, `userId`, `roomId`, `error`) and appropriate log levels (`debug`, `info`, `warn`, `error`), gating verbose `debug` logs based on `config.NODE_ENV`.
- In production (`config.NODE_ENV === 'production'`), write log output to files inside `./logs` (creating the directory automatically if needed and keeping `./logs` out of version control).
