"""FastAPI application — REST + WebSocket endpoints for NEXUS."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from nexus.config import settings
from nexus.models import ErrorResponse, HealthResponse, SessionInfo, SessionResponse, StatusMessage
from nexus.session import SessionManager
from nexus.ws_handler import handle_websocket

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

session_manager = SessionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("NEXUS agent service starting...")
    session_manager.start_cleanup()
    yield
    logger.info("NEXUS agent service shutting down...")
    session_manager.stop_cleanup()
    await session_manager.destroy_all()


app = FastAPI(
    title="NEXUS Agent Service",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── REST Endpoints ──────────────────────────────────────────────


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(active_sessions=session_manager.active_count)


@app.post("/sessions", response_model=SessionResponse)
async def create_session():
    """Create a new NEXUS session with an E2B sandbox."""
    try:
        session = await session_manager.create_session()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    ticket = session_manager.create_ticket(session.id)
    return SessionResponse(
        session_id=session.id,
        stream_url=session.stream_url,
        ws_ticket=ticket,
        created_at=session.created_at,
    )


@app.get("/sessions/{session_id}", response_model=SessionInfo)
async def get_session(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionInfo(
        session_id=session.id,
        status=session.status,
        stream_url=session.stream_url,
        created_at=session.created_at,
    )


@app.delete("/sessions/{session_id}", response_model=StatusMessage)
async def delete_session(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await session_manager.destroy_session(session_id)
    return StatusMessage(status="destroyed")


@app.post("/sessions/{session_id}/ticket")
async def refresh_ticket(session_id: str):
    """Generate a new WS authentication ticket for an existing session."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    ticket = session_manager.create_ticket(session_id)
    return {"ws_ticket": ticket}


# ── WebSocket Endpoint ──────────────────────────────────────────


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(
    ws: WebSocket,
    session_id: str,
    ticket: str = Query(default=""),
):
    """WebSocket endpoint for voice + agent event streaming."""
    # Validate ticket
    valid_sid = session_manager.validate_ticket(ticket)
    if valid_sid != session_id:
        await ws.close(code=4001, reason="Invalid or expired ticket")
        return

    session = session_manager.get_session(session_id)
    if not session or session.status != "ready":
        await ws.close(code=4004, reason="Session not found or not ready")
        return

    await handle_websocket(ws=ws, session=session, session_manager=session_manager)
