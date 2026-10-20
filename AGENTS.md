# AGENTS.md

## Project overview

This repo is a full-stack application for internship management, split into npm workspaces:

- backend/: Express + TypeScript + SQLite
- frontend/: React + TypeScript + Vite
- docs/: design notes and session reports

See [README.md](README.md), [docs/architecture.md](docs/architecture.md), and [backend/API.md](backend/API.md) for the authoritative project documentation.

## Working commands

Run from the repo root:

- `npm ci`
- `npm run setup`
- `npm run dev`
- `npm run check` (lint + typecheck + tests + build)

Backend-specific commands:

- `cd backend && npm run test`
- `cd backend && npm run build`
- `cd backend && npm run db:init`
- `cd backend && npm run db:reset`

Frontend-specific commands:

- `cd frontend && npm run test`
- `cd frontend && npm run build`

## Project conventions

- Node version: this project requires Node 22.14+; older Node versions are rejected early with a clear message.
- Use npm workspaces; do not create ad-hoc package managers or custom monorepo tooling.
- The backend uses `createXRepository`, `createXService`, and `createXRouter` patterns assembled in `app.ts`.
- Business rules belong in services; controllers should validate request input and translate errors to `HttpError`.
- Route security flows through `authenticate` and `authorize`, then service-level filtering.
- `Authorization` headers are sent as the raw token value, without a `Bearer ` prefix.
- The API port is configured via `API_PORT`; do not use a generic `PORT` setting.
- Database migrations are append-only; add a new numbered SQL file instead of editing existing migrations.

## Architecture cues

- Backend request flow: `main.ts` → `app.ts` → middlewares → controllers → services → repositories → SQLite.
- Frontend flow: `pages` → `hooks` → `services/utils` → `models` and components.
- Session state is handled in `frontend/src/hooks/useAuth.ts`; unauthorized API responses should trigger logout.
- Auth is intentionally minimal: the token contains only identity (`kind`, `id`); rights are reloaded from the database on each request.

## Code style and safety guidance

- Prefer changes consistent with the existing layers and naming conventions already used in the repo.
- Do not modify seeded demo data or migration history unless the task explicitly requires it.
- Reuse existing validation patterns and domain helpers instead of introducing new abstractions.
- When fixing bugs, add or update the most relevant test near the affected area before finalizing the patch.
- Keep documentation updates concise and link to existing docs rather than duplicating them.

## Relevant docs

- [README.md](README.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/seed.md](docs/seed.md)
- [backend/API.md](backend/API.md)
- [docs/cdc_gesta_developpement.md](docs/cdc_gesta_developpement.md)
