"""E2B Desktop Sandbox wrapper — provides all computer control primitives."""

from __future__ import annotations

import base64
import io
import logging
from typing import Optional

from PIL import Image

from nexus.config import settings

logger = logging.getLogger(__name__)


class SandboxManager:
    """Manages a single E2B Desktop sandbox instance."""

    def __init__(self) -> None:
        self._sandbox = None
        self._stream_url: Optional[str] = None

    @property
    def is_alive(self) -> bool:
        return self._sandbox is not None

    @property
    def stream_url(self) -> Optional[str]:
        return self._stream_url

    # -- Lifecycle -----------------------------------------------------------

    def create(self) -> dict:
        """Boot a new E2B desktop sandbox. Returns {sandbox_id, stream_url}."""
        from e2b_desktop import Sandbox

        logger.info("Creating E2B desktop sandbox...")
        self._sandbox = Sandbox.create(
            api_key=settings.e2b_api_key or None,
            resolution=(settings.sandbox_resolution_w, settings.sandbox_resolution_h),
            timeout=settings.sandbox_timeout_seconds,
        )
        self._sandbox.stream.start(require_auth=False)
        self._stream_url = self._sandbox.stream.get_url()
        logger.info("Sandbox ready -- stream URL: %s", self._stream_url)
        return {
            "sandbox_id": self._sandbox.sandbox_id,
            "stream_url": self._stream_url,
        }

    def keep_alive(self, timeout: int = 300) -> None:
        """Extend sandbox timeout."""
        if self._sandbox:
            self._sandbox.set_timeout(timeout)

    def destroy(self) -> None:
        """Kill the sandbox."""
        if self._sandbox:
            try:
                self._sandbox.kill()
                logger.info("Sandbox destroyed")
            except Exception as exc:
                logger.warning("Error destroying sandbox: %s", exc)
            finally:
                self._sandbox = None
                self._stream_url = None

    # -- Screen --------------------------------------------------------------

    def screenshot(self) -> bytes:
        """Capture the screen as PNG bytes."""
        assert self._sandbox, "Sandbox not running"
        return bytes(self._sandbox.screenshot())

    def screenshot_base64(self) -> str:
        """Capture the screen as a base64-encoded PNG string."""
        return base64.b64encode(self.screenshot()).decode()

    def screenshot_jpeg(self, quality: int = 85, max_dim: int = 1024) -> bytes:
        """Capture the screen as resized JPEG bytes (smaller for Gemini)."""
        png_bytes = self.screenshot()
        img = Image.open(io.BytesIO(png_bytes))
        img.thumbnail((max_dim, max_dim))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality)
        return buf.getvalue()

    def screenshot_jpeg_base64(self, quality: int = 85) -> str:
        """Capture as base64-encoded JPEG."""
        return base64.b64encode(self.screenshot_jpeg(quality)).decode()

    def get_screen_size(self) -> tuple[int, int]:
        """Return (width, height) of the sandbox screen."""
        assert self._sandbox, "Sandbox not running"
        return self._sandbox.get_screen_size()

    def get_cursor_position(self) -> tuple[int, int]:
        """Return (x, y) cursor position."""
        assert self._sandbox, "Sandbox not running"
        return self._sandbox.get_cursor_position()

    # -- Mouse ---------------------------------------------------------------

    def left_click(self, x: int, y: int) -> None:
        """Left-click at screen coordinates."""
        assert self._sandbox, "Sandbox not running"
        self._sandbox.left_click(x, y)

    def right_click(self, x: int, y: int) -> None:
        """Right-click at screen coordinates."""
        assert self._sandbox, "Sandbox not running"
        self._sandbox.right_click(x, y)

    def double_click(self, x: int, y: int) -> None:
        """Double-click at screen coordinates."""
        assert self._sandbox, "Sandbox not running"
        self._sandbox.double_click(x, y)

    def move_mouse(self, x: int, y: int) -> None:
        """Move mouse to coordinates without clicking."""
        assert self._sandbox, "Sandbox not running"
        self._sandbox.move_mouse(x, y)

    def drag(self, from_x: int, from_y: int, to_x: int, to_y: int) -> None:
        """Drag from one point to another."""
        assert self._sandbox, "Sandbox not running"
        self._sandbox.drag(fr=(from_x, from_y), to=(to_x, to_y))

    def scroll(self, direction: str = "down", amount: int = 3) -> None:
        """Scroll the screen. direction: 'up' or 'down'."""
        assert self._sandbox, "Sandbox not running"
        self._sandbox.scroll(direction, amount)

    # -- Keyboard ------------------------------------------------------------

    def type_text(self, text: str) -> None:
        """Type text at the current cursor position."""
        assert self._sandbox, "Sandbox not running"
        self._sandbox.write(text, chunk_size=25, delay_in_ms=75)

    def press_key(self, key: str) -> None:
        """Press a key or key combination. Examples: 'enter', 'ctrl+c', 'alt+tab'."""
        assert self._sandbox, "Sandbox not running"
        if "+" in key:
            combo = [k.strip() for k in key.split("+")]
            self._sandbox.press(combo)
        else:
            self._sandbox.press(key)

    # -- Terminal ------------------------------------------------------------

    def run_command(self, command: str, timeout: int = 30, background: bool = False) -> dict:
        """Run a shell command. Returns {stdout, stderr, exit_code}."""
        assert self._sandbox, "Sandbox not running"
        if background:
            # Launch in background using nohup so it doesn't block
            bg_cmd = f"nohup {command} > /dev/null 2>&1 & echo $!"
            result = self._sandbox.commands.run(bg_cmd, timeout=10)
            pid = (result.stdout or "").strip()
            return {
                "stdout": f"Started in background (PID: {pid})" if pid else "Started in background",
                "stderr": result.stderr or "",
                "exit_code": 0,
            }
        try:
            result = self._sandbox.commands.run(command, timeout=timeout)
            return {
                "stdout": result.stdout or "",
                "stderr": result.stderr or "",
                "exit_code": result.exit_code,
            }
        except Exception as e:
            err_msg = str(e)
            # Try to extract structured info from CommandExitException
            stdout = getattr(e, 'stdout', '') or ''
            stderr = getattr(e, 'stderr', '') or err_msg
            exit_code = getattr(e, 'exit_code', -1)
            if "deadline exceeded" in err_msg or "timeout" in err_msg.lower():
                stderr = f"Command timed out after {timeout}s. If launching a GUI app, use background=True."
                exit_code = -1
            return {
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": exit_code if exit_code is not None else -1,
            }

    # -- Applications --------------------------------------------------------

    def open_url(self, url: str) -> None:
        """Open a URL in the default browser."""
        assert self._sandbox, "Sandbox not running"
        self._sandbox.open(url)
