# NEXUS / Virtual Voice Agent — Current-State Plan

## Status

This repository is already a two-service voice-agent system. It is not a basic Next.js template anymore.

- `frontend/` is a Next.js 16 + React 19 + Tailwind 4 UI with an App Router entrypoint, a session workspace route, custom components, client-side WebSocket/audio hooks, and a proxy for REST calls to the backend.
- `agent/` is a Python FastAPI service that manages E2B desktop sandboxes, short-lived JWT WebSocket tickets, Gemini Live voice streaming, and Google ADK agent orchestration.
- `deploy/` contains local Docker Compose wiring and GCP Cloud Run deployment scripts.

`nexus_plan.md` should be treated as a historical planning document, not the current source of truth. It still describes the repo as pre-implementation in several places, while the codebase already contains working frontend, backend, and deploy layers.

## Current Repo Snapshot

### Top-Level Structure

- `frontend/`
- `agent/`
- `deploy/`
- `.env.example`
- `nexus_plan.md`
- local tool folders such as `.claude/`, `.zencoder/`, and `.zenflow/`

### Frontend

Observed current frontend characteristics:

- Stack: Next.js `16.1.6`, React `19.2.3`, TypeScript `5`, Tailwind CSS `4`, ESLint `9`.
- Build mode: standalone Next.js output for container deployment.
- Routing: App Router with a root page and a session page at `src/app/session/[id]/page.tsx`.
- API shape:
  - browser REST calls go to `/api/*`
  - `frontend/proxy.ts` rewrites `/api/*` to the Python backend using `AGENT_URL`
  - browser WebSocket traffic connects directly to the backend using `NEXT_PUBLIC_AGENT_WS_URL`
- UI structure already exists for:
  - desktop panel
  - conversation panel
  - activity feed
  - mic button
  - status bar
  - demo picker
- Audio handling already exists:
  - mic capture via `use-microphone.ts`
  - playback via `audio-playback.ts`
  - public asset `public/pcm-worklet.js` is present but does not appear to be the active capture path today

### Backend

Observed current backend characteristics:

- Runtime: Python `>=3.11`, containerized with Python `3.12-slim`
- HTTP framework: FastAPI
- Realtime transport: WebSocket endpoint served by the backend directly
- Core responsibilities:
  - create and destroy E2B desktop sandboxes
  - manage session lifecycle and idle cleanup
  - issue short-lived JWT tickets for WebSocket authentication
  - stream Gemini Live audio/transcripts
  - run ADK agent turns and forward agent/tool events back to the frontend
- Declared dependencies include:
  - `google-adk`
  - `google-genai`
  - `fastapi`
  - `uvicorn[standard]`
  - `websockets`
  - `e2b-desktop`
  - `python-dotenv`
  - `httpx`
  - `pydantic-settings`
  - `PyJWT`
  - `Pillow`

### Deploy

- Local multi-service bootstrapping exists in `deploy/docker-compose.yml`
- GCP deploy automation exists in:
  - `deploy/gcp/setup-secrets.sh`
  - `deploy/gcp/deploy.sh`
- Current deployment model is two services:
  - `nexus-agent`
  - `nexus-frontend`

## Currently Observed Interfaces

### REST Endpoints

Observed in `agent/nexus/server.py`:

- `GET /health`
  - returns active session count
- `POST /sessions`
  - creates a new sandbox-backed session
  - returns `session_id`, `stream_url`, `ws_ticket`, and `created_at`
- `GET /sessions/{session_id}`
  - returns session info
- `DELETE /sessions/{session_id}`
  - destroys a session
- `POST /sessions/{session_id}/ticket`
  - refreshes the WS ticket for an existing session

### WebSocket Endpoint

- `GET /ws/{session_id}?ticket=...`
- ticket validation is JWT-based and currently expires after 120 seconds
- binary frames are used for microphone PCM audio
- text frames are JSON commands/events

### Current WebSocket Message Types

Observed client-to-server text commands:

- `text_input`
- `analyze_screen`
- `stop_agent`
- `ping`

Observed server-to-client text events:

- `sandbox_status`
- `vnc_url`
- `transcript`
- `agent_thinking`
- `agent_tool_call`
- `agent_tool_result`
- `agent_screenshot`
- `agent_complete`
- `error`
- `pong`

### Session Data Shape

Observed frontend session response shape:

```ts
type SessionData = {
  session_id: string;
  stream_url: string;
  ws_ticket: string;
  created_at: string;
};
```

## Canonical Commands

These commands are traceable to the current manifests, Dockerfiles, or scripts.

### Frontend

Run from `frontend/`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

### Agent

Install and run shape implied by `agent/Dockerfile`:

```bash
pip install .
uvicorn nexus.server:app --host 0.0.0.0 --port 8000 --workers 1
```

### Agent Smoke Tests

Run from `agent/`:

```bash
python scripts/test_sandbox.py
python scripts/test_agent.py
```

### Local Multi-Service Run

Run from `deploy/`:

```bash
docker compose -f docker-compose.yml up --build
```

### GCP Deployment

Run from `deploy/gcp/` after exporting required GCP env vars:

```bash
bash setup-secrets.sh
bash deploy.sh
```

## Configuration Map

### Required Secrets / Core Env Vars

Documented in root `.env.example`, `agent/.env.example`, backend settings, and deploy scripts:

- `E2B_API_KEY`
- `GOOGLE_API_KEY`
- `GOOGLE_PROJECT_ID`
- `GOOGLE_CLOUD_REGION`
- `JWT_SECRET`

### Service Wiring

- `FRONTEND_URL`
  - backend CORS and deployment wiring
- `AGENT_URL`
  - used by `frontend/proxy.ts` to route `/api/*` to the backend
- `NEXT_PUBLIC_AGENT_WS_URL`
  - used by the frontend session page for direct browser-to-backend WebSocket connections
- `SESSION_TIMEOUT_MINUTES`
  - idle cleanup timeout for sessions

### Defaults Currently Present in Code

- `GOOGLE_CLOUD_REGION=us-central1`
- `FRONTEND_URL=http://localhost:3000`
- `host=0.0.0.0`
- `port=8000`
- `SESSION_TIMEOUT_MINUTES=15`
- `gemini_live_model=gemini-2.5-flash-native-audio-preview-12-2025`
- `gemini_vision_model=gemini-2.5-flash`
- sandbox resolution defaults: `1024x768`
- sandbox timeout default: `600` seconds

### Documentation Gap

Frontend-required env vars are only partially explicit today. The backend env examples document backend/service secrets, but the frontend runtime assumptions around `AGENT_URL` and `NEXT_PUBLIC_AGENT_WS_URL` are mainly visible in compose, deploy, and frontend code rather than in a dedicated frontend env example.

## Implemented vs Missing / Incomplete

### Implemented

- Session create, read, delete, and ticket refresh flow exists.
- Short-lived JWT WebSocket ticket auth exists.
- Browser-to-backend direct WebSocket streaming exists.
- Binary mic audio transport exists.
- Agent transcripts, tool calls/results, and screenshots are streamed back to the frontend.
- E2B sandbox creation and stream URL delivery exist.
- Local Docker Compose wiring exists.
- GCP Cloud Run deployment scripts exist.

### Missing or Inconsistent

- The repo documentation is stale:
  - `frontend/README.md` is still default `create-next-app` boilerplate.
  - `nexus_plan.md` still frames the system as pre-build in multiple places.
- Audio capture path is inconsistent with the old plan:
  - the old plan chooses AudioWorklet
  - the current live frontend mic path uses `ScriptProcessorNode`
  - `frontend/public/pcm-worklet.js` exists but does not appear to be the active capture path
- Session bootstrap appears fragile across reload/navigation:
  - the session page composes the WS URL from `session?.ws_ticket`
  - `useSession()` stores session state only in component memory
  - there is no durable restoration or automatic ticket refresh in the current hook
- Vision integration is only partial:
  - `VisionAnalyzer` exists
  - `handle_analyze_screen()` currently captures a screenshot and asks the agent to describe the screen, but it does not call `VisionAnalyzer`
- The old plan’s protocol is ahead of the code:
  - old plan references more WS control flow than is currently implemented
  - current command surface is limited to `text_input`, `analyze_screen`, `stop_agent`, and `ping`

## Known Gaps / Risks

- `nexus_plan.md` is stale enough that it should not be used for implementation decisions without cross-checking code.
- `frontend/README.md` is not an accurate operational guide.
- Generated and local-only artifacts already exist in this workspace:
  - `frontend/.next/`
  - `frontend/node_modules/`
  - Python bytecode / cache files
  - local tool config folders
- `.gitignore` already excludes most generated artifacts plus `nexus_plan.md`, but that does not make old planning content trustworthy.
- This project folder sits inside a larger Git worktree above the workspace root. Future git cleanup, status checks, or artifact assumptions must be scoped carefully to avoid unrelated files outside this project.

## Next Work Priorities

### Priority 1 — Refresh docs and runbook

- add an accurate root-level runbook or README
- document local startup order and env expectations
- make `codex-plan.md` the current planning reference

### Priority 2 — Reconcile audio capture strategy

- decide whether to keep `ScriptProcessorNode` temporarily or migrate to AudioWorklet now
- remove drift between plan, code, and public asset usage
- document the final supported mic pipeline

### Priority 3 — Harden session persistence and reconnect

- support session reload or route recovery without losing the WS ticket state
- define whether ticket refresh should be automatic
- ensure reconnect behavior is explicit in frontend and backend docs

### Priority 4 — Clarify screen analysis architecture

- decide whether `VisionAnalyzer` should become the real analysis path
- if not, remove or clearly demote the vision-specific planning assumptions
- align “analyze screen” behavior with actual implementation intent

### Priority 5 — Formalize the WS protocol

- align frontend types, backend handler behavior, and documentation
- document current events/commands in one place
- define how future commands such as cancellation or end-of-audio should work before adding them

## Open Decisions

- Should the frontend migrate fully to AudioWorklet now, or only after the end-to-end path is stable?
- Should session state remain lightweight and in-memory, or should the app support durable restoration and ticket refresh across reload/navigation?
- Should deployment and setup guidance live only in `codex-plan.md`, or should a proper root README/runbook be added next?

## Verification Checklist

- `codex-plan.md` reflects the current repo structure and does not repeat the stale “fresh scaffold” claim.
- All commands and env vars listed in this document are traceable to current manifests, scripts, Dockerfiles, or settings.
- The document clearly distinguishes:
  - implemented behavior
  - stale assumptions in `nexus_plan.md`
  - future priorities / open decisions
- No application code, env files, or deploy scripts were modified while creating this document.

## Assumptions

- This file is a documentation artifact only.
- `codex-plan.md` coexists with `nexus_plan.md`.
- Existing source code is the source of truth where documents conflict.
- The desired framing is current state first, then next steps.
