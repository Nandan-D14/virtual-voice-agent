"use client";

type Phase = "idle" | "listening" | "thinking" | "acting" | "done";

type Props = {
  phase: Phase;
  isConnected: boolean;
};

const STEPS: { key: Phase; label: string }[] = [
  { key: "listening", label: "LISTENING" },
  { key: "thinking", label: "THINKING" },
  { key: "acting", label: "ACTING" },
  { key: "done", label: "DONE" },
];

const STEP_ORDER: Phase[] = ["listening", "thinking", "acting", "done"];

function getStepState(
  step: Phase,
  currentPhase: Phase,
): "active" | "past" | "future" {
  if (currentPhase === "idle") return "future";
  const currentIdx = STEP_ORDER.indexOf(currentPhase);
  const stepIdx = STEP_ORDER.indexOf(step);
  if (stepIdx === currentIdx) return "active";
  if (stepIdx < currentIdx) return "past";
  return "future";
}

export function StatusBar({ phase, isConnected }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181b] border-t border-[#27272a] text-xs">
      {/* Phase steps */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const state = getStepState(step.key, phase);

          return (
            <div key={step.key} className="flex items-center">
              {/* Connector line (between steps) */}
              {i > 0 && (
                <div
                  className={`w-6 h-px mx-1 transition-colors duration-300 ${
                    state === "future" ? "bg-zinc-700" : "bg-zinc-500"
                  }`}
                />
              )}

              {/* Step dot + label */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`relative flex h-2 w-2 transition-colors duration-300 ${
                    state === "active" ? "" : ""
                  }`}
                >
                  {state === "active" && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22d3ee] opacity-60" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full transition-colors duration-300 ${
                      state === "active"
                        ? "bg-[#22d3ee]"
                        : state === "past"
                          ? "bg-emerald-500"
                          : "bg-zinc-600"
                    }`}
                  />
                </span>
                <span
                  className={`font-semibold tracking-wide transition-colors duration-300 ${
                    state === "active"
                      ? "text-[#22d3ee]"
                      : state === "past"
                        ? "text-emerald-500"
                        : "text-zinc-600"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={`relative flex h-2 w-2`}
        >
          {isConnected && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              isConnected ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
        </span>
        <span
          className={`font-medium ${
            isConnected ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>
  );
}
