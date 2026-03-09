"""Tool context — provides access to the current sandbox instance.

The sandbox is stored per-session via a contextvars token so that
tool functions can retrieve it without explicit parameter passing.
"""

from __future__ import annotations

import contextvars
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from nexus.sandbox import SandboxManager

_current_sandbox: contextvars.ContextVar["SandboxManager"] = contextvars.ContextVar(
    "_current_sandbox"
)


def set_sandbox(sandbox: "SandboxManager") -> contextvars.Token:
    """Set the sandbox for the current execution context."""
    return _current_sandbox.set(sandbox)


def get_sandbox() -> "SandboxManager":
    """Retrieve the sandbox for the current execution context."""
    try:
        return _current_sandbox.get()
    except LookupError:
        raise RuntimeError("No sandbox in current context. Was set_sandbox() called?")
