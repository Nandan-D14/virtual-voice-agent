"""Terminal command execution tool."""

from __future__ import annotations


def run_command(command: str) -> dict:
    """Run a shell command in the Linux terminal and return the output.

    Use this to execute any bash command: file operations, package installs,
    running scripts, git commands, system commands, etc.

    Args:
        command: The bash command to execute.

    Returns:
        dict with stdout, stderr, and exit_code.
    """
    from nexus.tools._context import get_sandbox
    sandbox = get_sandbox()
    result = sandbox.run_command(command, timeout=30)
    return result
