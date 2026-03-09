"""ADK agent definition — the NEXUS brain."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from nexus.config import settings
from nexus.prompts.system import SYSTEM_PROMPT
from nexus.tools import ALL_TOOLS

if TYPE_CHECKING:
    from nexus.sandbox import SandboxManager

logger = logging.getLogger(__name__)


def create_agent() -> Agent:
    """Create the NEXUS ADK agent with all desktop control tools."""
    agent = Agent(
        name="nexus",
        model=settings.gemini_vision_model,
        instruction=SYSTEM_PROMPT,
        tools=ALL_TOOLS,
    )
    return agent


def create_runner(agent: Agent) -> tuple[Runner, InMemorySessionService]:
    """Create a Runner for executing agent turns."""
    session_service = InMemorySessionService()
    runner = Runner(
        agent=agent,
        app_name="nexus",
        session_service=session_service,
    )
    return runner, session_service


async def run_agent_turn(
    runner: Runner,
    session_service: InMemorySessionService,
    session_id: str,
    user_id: str,
    message: str,
    event_callback=None,
) -> str | None:
    """Execute a single agent turn with a user message.

    Calls event_callback(event) for each intermediate event so the caller
    can stream tool calls, thoughts, etc. to the frontend.

    Returns the agent's final text response, or None.
    """
    # Ensure ADK session exists
    adk_session = await session_service.get_session(
        app_name="nexus", user_id=user_id, session_id=session_id
    )
    if adk_session is None:
        adk_session = await session_service.create_session(
            app_name="nexus", user_id=user_id, session_id=session_id
        )

    content = types.Content(
        role="user",
        parts=[types.Part.from_text(message)],
    )

    final_response = None

    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=content,
    ):
        if event_callback:
            await event_callback(event)

        if event.is_final_response() and event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    final_response = part.text
                    break

    return final_response
