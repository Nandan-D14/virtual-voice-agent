"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WorkflowStep, WorkflowStepData } from "./workflow-step";
import { CheckCircle2, CircleDashed, Clock, Loader2, Sparkles, Terminal, XCircle } from "lucide-react";

export type WorkflowRun = {
  run_id: string;
  title: string;
  status: "running" | "completed" | "failed" | "pending";
  steps: WorkflowStepData[];
  started_at?: string;
  completed_at?: string;
};

type Props = {
  run: WorkflowRun | null;
  emptyState?: string;
};

const statusConfig = {
  running: {
    icon: Loader2,
    label: "In Progress",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    glow: "shadow-[0_0_20px_-5px_rgba(34,211,238,0.2)]",
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    glow: "shadow-[0_0_20px_-5px_rgba(52,211,153,0.1)]",
    animate: false,
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    glow: "shadow-[0_0_20px_-5px_rgba(251,113,133,0.1)]",
    animate: false,
  },
  pending: {
    icon: Clock,
    label: "Pending",
    color: "text-zinc-400",
    bg: "bg-zinc-400/10",
    border: "border-zinc-400/20",
    glow: "",
    animate: false,
  },
};

function ProgressBar({ steps }: { steps: WorkflowStepData[] }) {
  const total = steps.length;
  if (total === 0) return null;

  const completed = steps.filter((s) => s.status === "completed").length;
  const failed = steps.filter((s) => s.status === "failed").length;
  const progress = Math.round(((completed + failed) / total) * 100);

  return (
    <div className="w-full mt-4 flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] font-medium text-zinc-500 tabular-nums w-8 text-right">
        {progress}%
      </span>
    </div>
  );
}

export function AgentWorkflowPanel({
  run,
  emptyState = "Waiting for instructions...",
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [run?.steps.length, run?.status]);

  if (!run || run.steps.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-zinc-800/20 rounded-full blur-xl" />
          <div className="w-16 h-16 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center relative shadow-xl">
            <Sparkles className="w-6 h-6 text-zinc-600" />
          </div>
        </div>
        <h3 className="text-sm font-medium text-zinc-300 mb-2">Workflow Empty</h3>
        <p className="text-xs text-zinc-500 max-w-[200px] leading-relaxed">
          {emptyState}
        </p>
      </div>
    );
  }

  const status = statusConfig[run.status];
  const StatusIcon = status.icon;

  return (
    <div className="h-full flex flex-col bg-[#111114]">
      {/* Header section */}
      <div className="shrink-0 p-5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${status.bg} ${status.border} ${status.glow} transition-all duration-500`}
            >
              <StatusIcon
                className={`w-5 h-5 ${status.color} ${
                  status.animate ? "animate-spin" : ""
                }`}
              />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                {run.title}
              </h2>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span className={`text-[10px] uppercase tracking-wider font-bold ${status.color}`}>
                  {status.label}
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="text-[11px] text-zinc-500 font-medium">
                  {run.steps.length} {run.steps.length === 1 ? "Step" : "Steps"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <ProgressBar steps={run.steps} />
      </div>

      {/* Steps feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 relative scroll-smooth custom-scrollbar"
      >
        {/* Connecting line behind steps */}
        <div className="absolute left-[33px] top-8 bottom-8 w-px bg-gradient-to-b from-zinc-800 via-zinc-800 to-transparent" />

        <AnimatePresence initial={false} mode="popLayout">
          {run.steps.map((step, index) => (
            <motion.div
              key={step.step_id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.3,
                ease: [0.23, 1, 0.32, 1],
              }}
              className="relative z-10"
            >
              <WorkflowStep
                step={step}
                isLast={index === run.steps.length - 1}
                stepNumber={index + 1}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Active running state indicator */}
        <AnimatePresence>
          {run.status === "running" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 flex items-start gap-4 ml-2"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 z-10 shadow-sm mt-1">
                <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
              </div>
              <div className="pt-1.5 flex items-center gap-2 text-zinc-500">
                <span className="text-xs font-medium uppercase tracking-wider">Agent is thinking</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
