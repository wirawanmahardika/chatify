---
trigger: always_on
---

# Security Guidelines

## Authentication & Session Cookies

- Always validate the session on protected HTTP routes and WebSocket connections before accessing or mutating user data.
- Set session cookies with `httpOnly: true`, `sameSite: 'strict'`, and `secure: config.NODE_ENV === 'production'`.
- Hash passwords using a strong algorithm (e.g., `Bun.password.hash` / Argon2id) and never store or log plaintext passwords.

## Authorization & Access Control (Anti-IDOR)

- Verify resource ownership and membership on every request—not just authentication.
- For rooms, messages, and WebSocket subscriptions/events, confirm that the authenticated user is a valid member of the target `roomId`.
- For friend requests or user actions, verify the acting user is authorized to perform that state transition.

## XSS & Input/Output Safety

- Never render untrusted user input (chat messages, usernames, room names) as unescaped/raw HTML in `@kitajs/html` JSX.
- Validate and sanitize all incoming HTTP inputs (`body`, `query`, `params`) and WebSocket payloads with **Zod** schemas before processing.
- Use Drizzle ORM parameterized queries; never concatenate user input into raw SQL strings.

## Data Exposure & Secrets

- Never expose `passwordHash`, session IDs, or internal stack traces in JSX views, HTTP responses, or client logs.
- Never write sensitive data (plaintext passwords, `passwordHash`, session IDs, cookies, tokens, or `config` secrets) to server logs via `src/shared/logger.ts`.
- Never hardcode secrets, API keys, or fallback production credentials in source code; read configuration exclusively from `config` (`src/config.ts`) and keep `.env` out of version control.
- Return generic, safe **Indonesian** error messages to users when unexpected server errors occur.
