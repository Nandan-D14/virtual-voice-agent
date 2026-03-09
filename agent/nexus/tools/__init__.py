"""NEXUS agent tools — computer control primitives for ADK."""

from nexus.tools.computer import (
    left_click,
    right_click,
    double_click,
    type_text,
    press_key,
    scroll_screen,
    drag,
)
from nexus.tools.bash import run_command
from nexus.tools.screen import take_screenshot
from nexus.tools.browser import open_browser

ALL_TOOLS = [
    take_screenshot,
    run_command,
    left_click,
    right_click,
    double_click,
    type_text,
    press_key,
    scroll_screen,
    drag,
    open_browser,
]
