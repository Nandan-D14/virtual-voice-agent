"""Screenshot tool for screen observation."""

from __future__ import annotations

import base64


def take_screenshot() -> dict:
    """Take a screenshot of the current screen to see what is displayed.

    ALWAYS call this tool:
    - Before starting any task (to see the current state)
    - After every GUI action (click, type, open) to verify results
    - When you need to read text on screen
    - When you need to find where to click

    Returns:
        dict with base64-encoded PNG image and mime_type.
    """
    from nexus.tools._context import get_sandbox
    sandbox = get_sandbox()
    img_bytes = sandbox.screenshot()
    img_b64 = base64.b64encode(img_bytes).decode()
    return {
        "image": img_b64,
        "mime_type": "image/png",
    }
