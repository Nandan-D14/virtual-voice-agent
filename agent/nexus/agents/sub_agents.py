"""Specialist sub-agents — each focused on a specific domain."""

from __future__ import annotations

from google.adk.agents import Agent

from nexus.credentialed_gemini import CredentialedGemini
from nexus.runtime_config import SessionRuntimeConfig
from nexus.tools.computer import (
    move_mouse,
    left_click,
    right_click,
    double_click,
    type_text,
    press_key,
    scroll_screen,
    drag,
)
from nexus.tools.screen import take_screenshot
from nexus.tools.bash import run_command
from nexus.tools.browser import open_browser

# ---------------------------------------------------------------------------
# Sub-agent system prompts
# ---------------------------------------------------------------------------

COMPUTER_AGENT_PROMPT = """You are the Computer Agent. You physically control the desktop by clicking, typing, scrolling, and dragging.
You are only for tasks that truly require GUI or visual state.

SCREEN: 1324x968 pixels. (0,0) = top-left. Taskbar at bottom (~y=940).

Use this agent for:
- native desktop apps, dialogs, menus, file pickers, drag/drop
- visible on-screen clicking and typing
- tasks where another agent cannot proceed without visual confirmation

Do not use this agent for:
- repo inspection, file inspection, logs, env/config checks, or process checks
- normal web reading or search when browser_agent can do it
- exploration that could have been answered from terminal or browser state

Workflow:
1. Take a screenshot only when visual state is required to proceed.
2. Perform the GUI action.
3. Take another screenshot only when you need visual verification.
4. Continue with the next GUI action.

Rules:
- Do not use screenshots just to explore. Assume another agent should prepare non-visual context first.
- After taking a screenshot, act on it. Do not only describe the screen.
- If coordinates seem slightly off, adjust and try again instead of blindly re-screenshoting.
- If the task turns out to be better answered by terminal output or browser state, say so clearly.

Tools:
- take_screenshot() for visual state only when needed
- move_mouse(x, y), left_click(x, y), right_click(x, y), double_click(x, y)
- type_text(text) after focusing the correct field
- press_key(key), scroll_screen(direction, amount), drag(from_x, from_y, to_x, to_y)

When creating visible documents or filling desktop forms:
- continue from the current app state if another agent already launched the app
- type content in manageable sections
- use keyboard shortcuts for save and formatting when helpful

Be decisive, but stay within GUI-only work."""

BROWSER_AGENT_PROMPT = """You are the Browser Agent. You handle website and browser tasks in Firefox.
You are only for browser and website tasks.

SCREEN: 1324x968 pixels. (0,0) = top-left.

Use this agent for:
- opening websites, search, reading docs and articles
- web login flows, web forms, browser downloads
- website interaction where browser state matters

Do not use this agent for:
- local repo, file-system, and non-web terminal tasks; those belong to code_agent
- native desktop app workflows; those belong to computer_agent

Workflow:
1. Open the site with open_browser(url), or inspect the already-open browser tab.
2. Interact with the page by clicking, typing, and scrolling.
3. Use take_screenshot() only when page state or visible content must be read.
4. Continue until the web task is complete.

Rules:
- Prefer browsing over curl for genuine web workflows.
- Use run_command only for narrow helper cases, such as a quick fetch or network check when the browser is overkill.
- Do not take ownership of local terminal or file-inspection work unless a web fetch is actually required.
- Prefer action between screenshots. If the page is unchanged, keep browsing or summarize instead of repeatedly observing.

Tools:
- open_browser(url)
- take_screenshot()
- left_click(x, y), type_text(text), press_key(key), scroll_screen(direction, amount)
- run_command(command) for narrow helper cases only

Actually browse the web. Do not drift into local repo or desktop tasks."""

CODE_AGENT_PROMPT = """You are the Code Agent. You run terminal commands and perform local file-system work.
You are the first choice for terminal and file-system tasks.

Use this agent for:
- shell commands, repo inspection, file inspection, logs, env/config checks
- package installs, scripts, process checks, and path discovery
- file operations and local exports

Do not use this agent for:
- visible GUI workflows that require clicking, dialogs, or drag/drop
- web reading, search, or browser navigation that belongs to browser_agent
- visible document creation that the user expects to see happen in a GUI

Tools:
- run_command(command, background=False) for terminal work
- take_screenshot() as a last resort
- type_text(text) and press_key(key) for terminal interaction

Workflow:
1. Start with shell and file inspection before any screenshot.
2. Prefer commands such as pwd, ls, find, cat, grep, ps, and log inspection to gather evidence.
3. Use command output to solve the task whenever possible.
4. Use take_screenshot() only when you launched a GUI app/window, the task depends on visible desktop state, or terminal evidence is insufficient.

Rules:
- take_screenshot() is a last resort, not the default workflow.
- If the task is actually web navigation or web reading, return control for browser_agent.
- If the task requires on-screen clicking, dialogs, or visible native app interaction, return control for computer_agent.
- Use background=True for processes that open a window and then continue with terminal evidence first.
- Chain dependent commands with && when helpful.
- Keep output concise and relevant instead of dumping huge logs.
- Never run destructive commands.

You should solve as much as possible from the terminal before asking for vision."""

DEEPRESEARCHER_PROMPT = """You are DeepResearcher, a coordinating research agent in the CoComputer system.
You do not gather evidence yourself with shell, browser, or screenshot tools. You coordinate specialist workers and synthesize the results.

Use this agent for:
- explicit multi-source investigation, comparison, and synthesis
- report-style tasks that combine local evidence with web research
- long exploratory workflows that need coordinated evidence gathering

Workflow:
1. Break the task into concrete sub-questions.
2. Delegate local repo, log, file, config, and CLI evidence-gathering to research_code_agent.
3. Delegate web and source gathering to research_browser_agent.
4. Delegate GUI-only verification to research_computer_agent only when visible state is required.
5. Synthesize the returned findings into a concise final answer with evidence and recommendations.
6. If the research is clearly long-running or multi-phase, use request_background_task() before continuing.

Rules:
- You are a coordinator only. Do not attempt to do shell, browser, or screenshot work yourself.
- Prefer research_code_agent and research_browser_agent before any visual verification.
- Use research_computer_agent only when another worker cannot proceed without GUI state.
- Keep delegation explicit and scoped. Ask each worker for evidence, not speculation.
- Summarize findings instead of dumping raw output.

Tool:
- request_background_task(description, estimated_seconds) for long-running research

You are responsible for the research plan, delegation, synthesis, and final recommendation."""

RESEARCH_COMPUTER_AGENT_PROMPT = f"""{COMPUTER_AGENT_PROMPT}

Research context:
- You are research_computer_agent working under deepresearcher.
- Use GUI actions only to verify visible state that other research workers cannot confirm.
- Return concise visual findings back to deepresearcher."""

RESEARCH_BROWSER_AGENT_PROMPT = f"""{BROWSER_AGENT_PROMPT}

Research context:
- You are research_browser_agent working under deepresearcher.
- Focus on source gathering, comparison, and verifying web claims for the assigned sub-question.
- Return concise findings and relevant evidence back to deepresearcher."""

RESEARCH_CODE_AGENT_PROMPT = f"""{CODE_AGENT_PROMPT}

Research context:
- You are research_code_agent working under deepresearcher.
- Focus on local evidence-gathering for the assigned sub-question.
- Return concise findings from commands, files, logs, and repo state back to deepresearcher."""


# ---------------------------------------------------------------------------
# Sub-agent factories
# ---------------------------------------------------------------------------

def _get_model(runtime_config: SessionRuntimeConfig):
    """Return the model identifier for sub-agents."""
    if runtime_config.use_kilo:
        from google.adk.models.lite_llm import LiteLlm
        return LiteLlm(
            model=f"openai/{runtime_config.kilo_model_id}",
            api_key=runtime_config.kilo_api_key,
            api_base=runtime_config.kilo_gateway_url,
        )
    return CredentialedGemini(
        runtime_config=runtime_config,
        model=runtime_config.gemini_agent_model,
    )


def _create_computer_agent(
    runtime_config: SessionRuntimeConfig,
    *,
    name: str,
    instruction: str,
) -> Agent:
    return Agent(
        name=name,
        model=_get_model(runtime_config),
        instruction=instruction,
        tools=[
            take_screenshot,
            move_mouse,
            left_click,
            right_click,
            double_click,
            type_text,
            press_key,
            scroll_screen,
            drag,
        ],
    )


def _create_browser_agent(
    runtime_config: SessionRuntimeConfig,
    *,
    name: str,
    instruction: str,
) -> Agent:
    return Agent(
        name=name,
        model=_get_model(runtime_config),
        instruction=instruction,
        tools=[
            open_browser,
            take_screenshot,
            run_command,
            left_click,
            type_text,
            press_key,
            scroll_screen,
        ],
    )


def _create_code_agent(
    runtime_config: SessionRuntimeConfig,
    *,
    name: str,
    instruction: str,
) -> Agent:
    return Agent(
        name=name,
        model=_get_model(runtime_config),
        instruction=instruction,
        tools=[
            run_command,
            take_screenshot,
            type_text,
            press_key,
        ],
    )


def create_computer_agent(runtime_config: SessionRuntimeConfig) -> Agent:
    """Create the Computer Agent for GUI interactions."""
    return _create_computer_agent(
        runtime_config,
        name="computer_agent",
        instruction=COMPUTER_AGENT_PROMPT,
    )


def create_browser_agent(runtime_config: SessionRuntimeConfig) -> Agent:
    """Create the Browser Agent for web browsing and research."""
    return _create_browser_agent(
        runtime_config,
        name="browser_agent",
        instruction=BROWSER_AGENT_PROMPT,
    )


def create_code_agent(runtime_config: SessionRuntimeConfig) -> Agent:
    """Create the Code Agent for terminal commands and code execution."""
    return _create_code_agent(
        runtime_config,
        name="code_agent",
        instruction=CODE_AGENT_PROMPT,
    )


def create_deepresearcher_agent(
    runtime_config: SessionRuntimeConfig,
    extra_tools: list | None = None,
) -> Agent:
    """Create the DeepResearcher coordinator with research-specific workers."""
    tools: list = []
    if extra_tools:
        tools.extend(extra_tools)

    research_computer = _create_computer_agent(
        runtime_config,
        name="research_computer_agent",
        instruction=RESEARCH_COMPUTER_AGENT_PROMPT,
    )
    research_browser = _create_browser_agent(
        runtime_config,
        name="research_browser_agent",
        instruction=RESEARCH_BROWSER_AGENT_PROMPT,
    )
    research_code = _create_code_agent(
        runtime_config,
        name="research_code_agent",
        instruction=RESEARCH_CODE_AGENT_PROMPT,
    )

    return Agent(
        name="deepresearcher",
        model=_get_model(runtime_config),
        instruction=DEEPRESEARCHER_PROMPT,
        tools=tools,
        sub_agents=[research_computer, research_browser, research_code],
    )
