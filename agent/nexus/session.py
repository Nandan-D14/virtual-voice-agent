"""Session management — maps session IDs to sandbox + agent state."""

from __future__ import annotations

import asyncio
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import jwt

from nexus.config import settings
from nexus.sandbox import SandboxManager

logger = logging.getLogger(__name__)


@dataclass
class Session:
    """A single NEXUS session with its own sandbox and agent state."""

    id: str
    sandbox: SandboxManager
    stream_url: str
    status: str = "creating"  # creating | ready | error | destroyed
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_active: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def touch(self) -> None:
        """Update last_active timestamp."""
        self.last_active = datetime.now(timezone.utc)


class SessionManager:
    """Creates, tracks, and cleans up NEXUS sessions."""

    def __init__(self) -> None:
        self._sessions: dict[str, Session] = {}
        self._cleanup_task: Optional[asyncio.Task] = None

    @property
    def active_count(self) -> int:
        return len(self._sessions)

    # ── CRUD ───────────────────────────────────────────────────

    async def create_session(self) -> Session:
        """Boot a new E2B sandbox and create a session."""
        session_id = uuid.uuid4().hex[:12]
        sandbox = SandboxManager()

        try:
            # E2B SDK is synchronous — run in executor
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(None, sandbox.create)
            session = Session(
                id=session_id,
                sandbox=sandbox,
                stream_url=info["stream_url"],
                status="ready",
            )
        except Exception as exc:
            logger.exception("Failed to create sandbox for session %s", session_id)
            sandbox.destroy()
            session = Session(
                id=session_id,
                sandbox=sandbox,
                stream_url="",
                status="error",
            )
            raise RuntimeError(f"Sandbox creation failed: {exc}") from exc

        self._sessions[session_id] = session
        logger.info("Session %s created (stream_url=%s)", session_id, session.stream_url)
        return session

    def get_session(self, session_id: str) -> Optional[Session]:
        return self._sessions.get(session_id)

    async def destroy_session(self, session_id: str) -> None:
        session = self._sessions.pop(session_id, None)
        if session and session.sandbox.is_alive:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, session.sandbox.destroy)
            session.status = "destroyed"
            logger.info("Session %s destroyed", session_id)

    # ── Auth ───────────────────────────────────────────────────

    def create_ticket(self, session_id: str) -> str:
        """Create a short-lived JWT for WebSocket authentication."""
        payload = {
            "sid": session_id,
            "exp": datetime.now(timezone.utc).timestamp() + 120,  # 2 min
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

    def validate_ticket(self, token: str) -> Optional[str]:
        """Validate a WS ticket. Returns session_id or None."""
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
            return payload.get("sid")
        except jwt.InvalidTokenError:
            return None

    # ── Cleanup ────────────────────────────────────────────────

    def start_cleanup(self) -> None:
        """Start the background cleanup task."""
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    def stop_cleanup(self) -> None:
        if self._cleanup_task:
            self._cleanup_task.cancel()

    async def _cleanup_loop(self) -> None:
        """Destroy sessions that have been idle too long."""
        timeout = settings.session_timeout_minutes * 60
        while True:
            await asyncio.sleep(60)
            now = datetime.now(timezone.utc)
            stale = [
                sid
                for sid, s in self._sessions.items()
                if (now - s.last_active).total_seconds() > timeout
            ]
            for sid in stale:
                logger.info("Cleaning up idle session %s", sid)
                await self.destroy_session(sid)

    async def destroy_all(self) -> None:
        """Destroy every active session (used on shutdown)."""
        for sid in list(self._sessions.keys()):
            await self.destroy_session(sid)
