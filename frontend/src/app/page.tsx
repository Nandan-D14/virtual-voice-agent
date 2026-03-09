"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/use-session";
import { DemoPicker } from "@/components/demo-picker";

export default function HomePage() {
  const router = useRouter();
  const { createSession, isLoading, error } = useSession();

  const handleStart = async (demoCommand?: string) => {
    const session = await createSession();
    if (session) {
      const params = demoCommand
        ? `?demo=${encodeURIComponent(demoCommand)}`
        : "";
      router.push(`/session/${session.session_id}${params}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              NEXUS
            </span>
          </h1>
          <p className="text-zinc-400 text-lg">
            AI agent with full Linux desktop control
          </p>
          <p className="text-zinc-600 text-sm max-w-md mx-auto">
            Speak any task — research, coding, deployment, automation.
            NEXUS executes it autonomously on a live Linux computer.
          </p>
        </div>

        {/* Start button */}
        <div className="flex justify-center">
          <button
            onClick={() => handleStart()}
            disabled={isLoading}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600
              text-white font-medium text-sm
              hover:from-cyan-500 hover:to-emerald-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all shadow-lg shadow-cyan-600/20"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Booting Desktop...
              </span>
            ) : (
              "Start Session"
            )}
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        {/* Demo scenarios */}
        <div className="space-y-3">
          <p className="text-zinc-500 text-xs text-center uppercase tracking-wider">
            Or try a demo scenario
          </p>
          <DemoPicker
            onSelect={(cmd) => handleStart(cmd)}
            disabled={isLoading}
          />
        </div>

        {/* Tech badges */}
        <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-600 uppercase tracking-wider">
          <span>Gemini Live API</span>
          <span className="text-zinc-800">|</span>
          <span>Google ADK</span>
          <span className="text-zinc-800">|</span>
          <span>E2B Desktop</span>
          <span className="text-zinc-800">|</span>
          <span>Cloud Run</span>
        </div>
      </div>
    </div>
  );
}
