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


def _get_model():
    """Return either a LiteLlm wrapper (Kilo) or a Gemini model string."""
    if settings.use_kilo:
        from google.adk.models.lite_llm import LiteLlm
        logger.info("Using Kilo gateway model: %s", settings.kilo_model_id)
        return LiteLlm(
            model=f"openai/{settings.kilo_model_id}",
            api_key=settings.kilo_api_key,
            api_base=settings.kilo_gateway_url,
        )
    return settings.gemini_vision_model


def create_agent() -> Agent:
    """Create the NEXUS ADK agent with all desktop control tools."""
    agent = Agent(
        name="nexus",
        model=_get_model(),
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
        parts=[types.Part(text=message)],
    )

    final_response = None
    turn_count = 0
    max_turns = 15  # Prevent runaway tool loops

    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=content,
    ):
        if event_callback:
            await event_callback(event)

        # Count tool call rounds
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.function_call:
                    turn_count += 1
                    break

        if event.is_final_response() and event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    final_response = part.text
                    break

        if turn_count >= max_turns:
            logger.warning("Max turns (%d) reached, stopping agent loop", max_turns)
            if not final_response:
                final_response = "I've taken many steps on this task. Here's what I've done so far — let me know if you'd like me to continue."
            break

    return final_response
