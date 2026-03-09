"use client";

import { useEffect, useCallback } from "react";

type Props = {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
};

export function MicButton({ isRecording, onStart, onStop, disabled }: Props) {
  const toggle = useCallback(() => {
    if (disabled) return;
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  }, [disabled, isRecording, onStart, onStop]);

  /* Spacebar toggle (only when not focused on an input/textarea) */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      toggle();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
      className={`
        relative flex items-center justify-center
        w-16 h-16 rounded-full
        transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]/50
        ${
          disabled
            ? "bg-[#18181b] border border-[#27272a] text-zinc-600 cursor-not-allowed opacity-50"
            : isRecording
              ? "bg-red-600 text-white shadow-[0_0_24px_rgba(239,68,68,0.45)] hover:bg-red-500"
              : "bg-transparent border-2 border-zinc-500 text-zinc-400 hover:border-[#22d3ee] hover:text-[#22d3ee] hover:shadow-[0_0_16px_rgba(34,211,238,0.15)]"
        }
      `}
    >
      {/* Pulsing glow ring when recording */}
      {isRecording && !disabled && (
        <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-30" />
      )}

      {isRecording ? (
        /* Stop icon (square) */
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        /* Microphone icon */
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      )}
    </button>
  );
}
