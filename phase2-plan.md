# NEXUS — Phase 2 Plan (Post Phase-1 Commit)

**Hackathon:** Gemini Live Agent Challenge (UI Navigator track, $80k)  
**Deadline:** March 16, 2026  
**Current date:** March 11, 2026 — 5 days left

---

## Phase 1 Recap (What's Done ✅)

All 6 runtime bugs fixed and committed:

1. Session data lost on navigation → `sessionStorage` persistence
2. `GeminiLiveManager` crash with empty Google key → conditional creation
3. `Part.from_text()` API error → `Part(text=)`
4. GUI apps blocking `commands.run()` → `background=True` nohup approach
5. `CommandExitException` crashing agent → try/except returning error dict
6. Base64 image choking LLM → thread-local storage, description-only return

**Working after Phase 1:**
- End-to-end: text command → LLM (minimax via Kilo) → tool calls → E2B sandbox → response
- VNC live desktop stream in the browser
- Activity feed with real-time tool call display
- Screenshot taken and forwarded to frontend as thumbnail
- Session persistence across page navigations
- `max_turns=15` guard prevents runaway loops
- Fibonacci demo validated: 3 real tool calls, output `[0,1,1,2,3,5,8,13,21,34,57,89,144,233,377]`

**Not working yet:**
- Voice/mic input (needs Gemini API key)
- Vision / screen analysis (minimax-m2.5 has no vision support)
- GCP Cloud Run deployment (intentionally deferred)

---

## Phase 2 Plan (This Session — No Gemini/No Cloud Run)

### 🔴 Priority 1 — Replace broken demo scenarios

The "Research AI startups" demo is broken — agent opens Firefox but can't read the page (no vision).

Replace `DEMOS` in `frontend/src/components/demo-picker.tsx` with tasks that work reliably without vision:

| Demo | Task |
|------|------|
| Build & run a web app | Create a simple Flask web app, run it, curl it |
| Write Python code | Fibonacci script |
| Generate a chart | matplotlib bar chart, save as chart.png |
| System explorer | OS version, RAM, disk, GUI apps list |

### 🔴 Priority 2 — Disable input while agent runs

Currently user can spam commands mid-task. Add `disabled` to text input and a `Send` button:

- Input: `disabled={phase === "thinking" || phase === "acting"}`
- Send button: disabled when same phases or empty input
- File: `frontend/src/app/session/[id]/page.tsx`

### 🔴 Priority 3 — Test GUI tools end-to-end

The E2B SDK manages `DISPLAY` internally, but these tools have never been tested:

```
"Open Firefox and navigate to github.com"
"Open the terminal, type echo hello world and press Enter"
"Left-click the desktop"
```

If `open_browser` works → add it as a live demo scenario (visually stunning for judges).

### 🟠 Priority 4 — Thinking indicator in ConversationPanel

When agent is processing, the conversation panel is static/empty. Add animated bouncing dots:

- Add `isThinking: boolean` prop to `ConversationPanel`
- Show 3 bouncing dots when `phase === "thinking" || phase === "acting"`
- Pass from session page as `isThinking={phase === "thinking" || phase === "acting"}`

### 🟡 Priority 5 — Web research fallback in system prompt

Add to `agent/nexus/prompts/system.py` so agent can do web research without a browser:

```
WEB RESEARCH (when vision is unavailable):
- curl -L -s "URL" | python3 -c "import sys; [print(l.strip()) for l in sys.stdin if l.strip()]"
- Wikipedia: curl -s "https://en.wikipedia.org/wiki/Topic" | grep -o '<p>[^<]*</p>' | head -20
```

### 🟡 Priority 6 — Verify agent transcript is sent after completion

Check that `_run_agent` in `orchestrator.py` always sends a `transcript` event with the agent's
final reply (not just `agent_complete`). ConversationPanel shows nothing if only `agent_complete` fires.

---

## Phase 3 Plan (Tomorrow — After Adding Gemini Key)

### LLM Strategy: Hybrid minimax + Gemini

**Decision:** Use both models — each does what it's best at.

| Task | Model | Reason |
|------|-------|--------|
| Agent reasoning + tool calls | minimax-m2.5 (Kilo, free) | Free quota, handles all bash/tool work |
| Voice input/output | Gemini Live | Only option — no alternative |
| Screenshot analysis / vision | Gemini 2.5 Flash | Only Gemini supports images |

**Flow:**
```
User speaks → Gemini Live transcribes
      ↓
minimax-m2.5 decides tool calls, runs commands
      ↓
take_screenshot → image → Gemini 2.5 Flash analyzes → text back to minimax
      ↓
minimax final response → Gemini Live speaks it aloud
```

**Code changes needed (~1 hour):**

1. `config.py` — remove mutual exclusion, allow both keys simultaneously:
   ```python
   @property
   def use_kilo(self) -> bool:
       return bool(self.kilo_api_key)  # always use minimax when available

   @property
   def use_vision(self) -> bool:
       return bool(self.google_api_key)  # vision requires Google key
   ```

2. `agent.py` — always pick minimax when `kilo_api_key` is set (regardless of Google key)

3. `tools/screen.py` — when `google_api_key` exists, call Gemini 2.5 Flash directly for vision
   (even though agent is minimax)

4. `.env` — add both keys:
   ```env
   KILO_API_KEY=your_kilo_key
   KILO_MODEL_ID=minimax/minimax-m2.5:free
   GOOGLE_API_KEY=your_google_key
   ```

**Benefit:** Google credits only consumed for voice + vision, not every tool call. minimax handles
all the free "thinking" work.

### Phase 3 Steps

1. Set `GOOGLE_API_KEY` in `.env` (keep `KILO_API_KEY` too)
2. Implement hybrid model logic above
3. Test Gemini Live voice input (mic → speech → agent)
4. Test vision (`take_screenshot` → Gemini 2.5 Flash analyzes image)
5. Enable "Research AI startups" demo → agent opens Firefox, reads page visually
6. Fix any voice pipeline issues (`voice.py`, `run_voice_receive_loop`)
7. Record hackathon demo video

---

## Feature Discussed: Background Agent (Deferred Post-Hackathon)

**User asked:** Can the agent keep running after browser is closed or PC is off?

**Answer:**
- **Browser closed, backend on a server** → needs code changes (decouple agent task from WebSocket, buffer events, replay on reconnect) — ~3-4 hours of work
- **PC off** → impossible without deploying backend to GCP/Cloud Run
- The E2B sandbox itself survives browser disconnects (10-min timeout), but the agent process dies with the WebSocket

**Decision:** Skip for hackathon. Deploy to GCP + background persistence = good post-hackathon features.

---

## Feature Discussed: User Data Persistence (Deferred Post-Hackathon)

**User asked:** How and where to store user data? Wants Google Cloud.

**Decision: Firestore** (best fit for this stack)

- Free tier: 1 GB storage, 50k reads/day, 20k writes/day
- Same GCP project as Cloud Run deployment
- No extra server needed — serverless API
- JSON-native — conversation messages, events map perfectly

**Firestore data model:**
```
/sessions/{session_id}
    created_at, status, stream_url

/sessions/{session_id}/messages/{msg_id}
    role: "user" | "agent", text, timestamp

/sessions/{session_id}/events/{event_id}
    type, timestamp, ...fields
```

**Implementation effort:** ~1.5 hours (storage.py + wire into orchestrator + frontend restore endpoint)

**Why deferred:** Judges don't test persistence. Hackathon time better spent on voice + vision demo quality.

**Post-hackathon steps:**
1. Enable Firestore in GCP Console (1 click)
2. `pip install google-cloud-firestore`
3. Create `agent/nexus/storage.py`
4. Call `save_message()` in `orchestrator.py` on each transcript event
5. Add `GET /sessions/{id}/history` endpoint to restore on reconnect
6. `gcloud auth application-default login` for local dev auth

---

## Tech Stack Reference

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16.1.6, React 19.2.3, Tailwind 4, App Router |
| Backend | Python FastAPI + uvicorn, port 8000 |
| LLM — Agent | minimax/minimax-m2.5:free via Kilo gateway (tool calls, reasoning) |
| LLM — Voice | Gemini Live (speech in/out) |
| LLM — Vision | Gemini 2.5 Flash (screenshot analysis) |
| Sandbox | E2B Desktop SDK — real Linux VM, VNC stream |
| Agent framework | Google ADK 1.20.0 + LiteLlm |
| Tools | 10 tools: take_screenshot, run_command, left/right/double_click, type_text, press_key, scroll_screen, drag, open_browser |
| Storage (future) | Google Firestore |
| Deploy (pending) | GCP Cloud Run + deploy/gcp/ scripts |

---

## Remaining Todo List (from active session)

- [ ] Fix `take_screenshot` with vision (blocked until Gemini key)
- [ ] Fix `press_key` method call
- [ ] Make voice init non-blocking
- [ ] Robustify `_on_agent_event`
- [ ] Create frontend `.env.example`
- [ ] Verify compilation / no errors
- [ ] Replace broken demo scenarios
- [ ] Disable input while agent runs + add Send button
- [ ] Add thinking indicator in ConversationPanel
- [ ] Add web research fallback to system prompt
- [ ] Test GUI tools (open_browser, left_click, type_text) end-to-end
