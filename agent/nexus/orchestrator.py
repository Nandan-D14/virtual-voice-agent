"""Orchestrator — wires voice → agent → sandbox → vision → response."""

from __future__ import annotations

import asyncio
import base64
import json
import logging
from typing import TYPE_CHECKING, Any

from starlette.websockets import WebSocket

from nexus.agent import create_agent, create_runner, run_agent_turn
from nexus.tools._context import set_sandbox
from nexus.config import settings
from nexus.prompts.system import SYSTEM_PROMPT

if TYPE_CHECKING:
    from nexus.session import Session

logger = logging.getLogger(__name__)


class NexusOrchestrator:
    """Coordinates the full voice → think → act → see loop for one session."""

    def __init__(self, session: "Session", ws: WebSocket) -> None:
        self.session = session
        self.ws = ws
        self.voice = None
        self._voice_connected = False

        # Only create voice manager when Google API key is available
        if settings.google_api_key:
            from nexus.voice import GeminiLiveManager
            self.voice = GeminiLiveManager()

        # ADK agent + runner
        self._agent = create_agent()
        self._runner, self._session_service = create_runner(self._agent)
        self._adk_session_id: str | None = None
        self._user_id = f"user-{session.id}"

    async def initialize(self) -> None:
        """Set up voice connection and ADK session."""
        # Bind sandbox to tool context
        set_sandbox(self.session.sandbox)

        # Connect to Gemini Live (non-blocking: text input works even if this fails)
        if self.voice:
            try:
                await self.voice.connect(system_instruction=SYSTEM_PROMPT)
                self._voice_connected = True
                logger.info("Gemini Live voice connected")
            except Exception:
                logger.warning("Gemini Live connection failed — voice disabled, text input still works")
        else:
            logger.info("No Google API key — voice disabled, text input works")
            self._voice_connected = False

        # Create ADK session
        adk_session = await self._session_service.create_session(
            app_name="nexus", user_id=self._user_id
        )
        self._adk_session_id = adk_session.id

        # Notify frontend
        await self._send_json({
            "type": "sandbox_status",
            "status": "ready",
        })
        await self._send_json({
            "type": "vnc_url",
            "url": self.session.stream_url,
        })

    async def handle_user_audio(self, pcm_data: bytes) -> None:
        """Forward mic audio to Gemini Live."""
        if not self._voice_connected:
            return
        await self.voice.send_audio(pcm_data)
        self.session.touch()

    async def handle_text_input(self, text: str) -> None:
        """Handle direct text input (bypass voice)."""
        await self._send_json({"type": "transcript", "role": "user", "text": text})
        await self._run_agent(text)

    async def handle_user_utterance(self, text: str) -> None:
        """Called when Gemini Live produces a final user transcript."""
        await self._send_json({"type": "transcript", "role": "user", "text": text})
        await self._run_agent(text)

    async def handle_analyze_screen(self) -> None:
        """Take screenshot and send analysis to frontend."""
        sandbox = self.session.sandbox
        img_b64 = sandbox.screenshot_base64()
        await self._send_json({
            "type": "agent_screenshot",
            "image_b64": img_b64,
            "analysis": "Screenshot captured. Sending to agent...",
        })
        # Feed screenshot context to agent
        await self._run_agent("Look at the current screen and describe what you see.")

    async def run_voice_receive_loop(self) -> None:
        """Background task: read from Gemini Live, forward to frontend."""
        if not self._voice_connected:
            return
        try:
            async for event_type, data in self.voice.receive_events():
                if event_type == "audio":
                    await self.ws.send_bytes(data)
                elif event_type == "user_transcript":
                    # User speech transcribed — trigger agent
                    await self.handle_user_utterance(data)
                elif event_type == "agent_transcript":
                    await self._send_json({
                        "type": "transcript",
                        "role": "agent",
                        "text": data,
                    })
        except Exception:
            logger.exception("Voice receive loop error")

    async def close(self) -> None:
        """Shut down orchestrator resources."""
        if self._voice_connected and self.voice:
            await self.voice.close()

    # ── Private ────────────────────────────────────────────────

    async def _run_agent(self, message: str) -> None:
        """Run an ADK agent turn and stream events to frontend."""
        self.session.touch()

        try:
            response = await run_agent_turn(
                runner=self._runner,
                session_service=self._session_service,
                session_id=self._adk_session_id,
                user_id=self._user_id,
                message=message,
                event_callback=self._on_agent_event,
            )

            if response:
                # Send agent text response
                await self._send_json({
                    "type": "transcript",
                    "role": "agent",
                    "text": response,
                })
                # Feed to Gemini Live for TTS
                if self._voice_connected:
                    try:
                        await self.voice.send_text(response)
                    except Exception:
                        logger.warning("Failed to send TTS for response")

                await self._send_json({
                    "type": "agent_complete",
                    "summary": response[:200],
                })

        except Exception:
            logger.exception("Agent turn failed")
            await self._send_json({
                "type": "error",
                "code": "AGENT_ERROR",
                "message": "Agent encountered an error processing your request.",
            })

    async def _on_agent_event(self, event: Any) -> None:
        """Callback for each ADK agent event — stream to frontend."""
        try:
            # Tool calls (ADK uses get_function_calls() or content.parts with function_call)
            function_calls = []
            if hasattr(event, 'get_function_calls'):
                function_calls = event.get_function_calls() or []
            elif hasattr(event, 'actions') and event.actions:
                if hasattr(event.actions, 'tool_calls') and event.actions.tool_calls:
                    function_calls = event.actions.tool_calls

            for fc in function_calls:
                tool_name = getattr(fc, 'name', None) or getattr(fc, 'tool_name', str(fc))
                tool_args = getattr(fc, 'args', None) or getattr(fc, 'tool_input', {})
                await self._send_json({
                    "type": "agent_tool_call",
                    "tool": tool_name,
                    "args": dict(tool_args) if tool_args else {},
                })

            # Agent thinking / intermediate content
            if (
                hasattr(event, 'content') and event.content
                and hasattr(event.content, 'parts') and event.content.parts
                and not event.is_final_response()
            ):
                for part in event.content.parts:
                    text = getattr(part, 'text', None)
                    if text:
                        await self._send_json({
                            "type": "agent_thinking",
                            "content": text,
                        })

            # Tool results (function responses in content parts)
            if hasattr(event, 'content') and event.content and hasattr(event.content, 'parts') and event.content.parts:
                for part in event.content.parts:
                    fn_resp = getattr(part, 'function_response', None)
                    if fn_resp:
                        tool_name = getattr(fn_resp, 'name', 'unknown')
                        output = getattr(fn_resp, 'response', {})
                        output_str = str(output)[:2000]

                        await self._send_json({
                            "type": "agent_tool_result",
                            "tool": tool_name,
                            "output": output_str,
                        })

                        # If this was a screenshot tool call, forward the stored image to frontend
                        if tool_name == "take_screenshot":
                            from nexus.tools.screen import get_last_screenshot_b64
                            img_b64 = get_last_screenshot_b64()
                            if img_b64:
                                await self._send_json({
                                    "type": "agent_screenshot",
                                    "image_b64": img_b64,
                                    "analysis": output.get("description", "") if isinstance(output, dict) else "",
                                })

        except Exception:
            logger.exception("Error streaming agent event")

    async def _send_json(self, data: dict) -> None:
        """Send JSON message to the frontend WebSocket."""
        try:
            await self.ws.send_json(data)
        except Exception:
            logger.warning("Failed to send WS message: %s", data.get("type"))
