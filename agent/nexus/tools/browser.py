"""Browser tool for opening URLs."""

from __future__ import annotations


def open_browser(url: str) -> dict:
    """Open a URL in the web browser.

    This launches Firefox and navigates to the given URL.
    After calling this, use take_screenshot() to see the loaded page.

    Args:
        url: The full URL to navigate to (include https://).

    Returns:
        dict with status message.
    """
    from nexus.tools._context import get_sandbox
    sandbox = get_sandbox()
    sandbox.open_url(url)
    return {"status": "success", "message": f"Opened {url} in browser"}
