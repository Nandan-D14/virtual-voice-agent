"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/use-session";
import { DemoPicker } from "@/components/demo-picker";
import { useState, useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const { createSession, isLoading, error } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div className="min-h-screen bg-[#030303] text-white selection:bg-cyan-500/30">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 ${scrolled ? "bg-black/60 backdrop-blur-md border-b border-white/5" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-black font-black text-xl italic">N</span>
            </div>
            <span className="text-xl font-black tracking-tighter italic uppercase">Nexus</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Capabilities</a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">Operation</a>
            <a href="#missions" className="hover:text-cyan-400 transition-colors">Missions</a>
          </div>
          <button 
            onClick={() => handleStart()}
            disabled={isLoading}
            className="px-5 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Booting..." : "Launch Console"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] mask-radial" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">v2.5 Hybrid Intelligence Live</span>
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.9] italic animate-fade-in">
            <span className="block text-gradient">COMMAND THE</span>
            <span className="block text-accent-gradient drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">AUTONOMOUS.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl font-light leading-relaxed animate-fade-in [animation-delay:200ms]">
            Nexus is a multimodal AI agent that orchestrates a full Linux environment. 
            Speak, and it executes — from complex devops to dynamic web research.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in [animation-delay:400ms]">
            <button
              onClick={() => handleStart()}
              disabled={isLoading}
              className="group relative px-10 py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center gap-3">
                {isLoading ? "Initializing Environment..." : "Start Neural Session"}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </button>
            <a href="#missions" className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
              View Templates
            </a>
          </div>
        </div>
        
        {/* Floating Mockup Preview */}
        <div className="relative mt-20 max-w-5xl mx-auto animate-fade-in [animation-delay:600ms]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent z-10" />
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-2 backdrop-blur-2xl shadow-2xl overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
              </div>
              <div className="mx-auto text-[10px] font-bold text-zinc-500 uppercase tracking-widest">nexus_agent_v2.5_console</div>
            </div>
            <div className="aspect-video bg-black relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.2),transparent_70%)]" />
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full border border-cyan-500/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-700">
                  <div className="w-4 h-4 rounded-full bg-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-pulse" />
                </div>
                <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.4em] animate-pulse">System Online</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="max-w-xl space-y-4">
            <h2 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em]">Capabilities</h2>
            <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
              The Architecture of <br /> <span className="text-gradient">Autonomy.</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              title="Multimodal Synthesis"
              description="Nexus combines Gemini Live voice processing with Gemini 2.5 Flash vision to perceive and respond to its environment in real-time."
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>}
            />
            <FeatureCard 
              title="Secure Sandbox"
              description="Every session runs within a dedicated E2B Desktop sandbox. A complete, isolated Linux VM with full GUI and internet access."
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
            />
            <FeatureCard 
              title="Hybrid Intelligence"
              description="Optimized orchestration using Minimax-m2.5 for reasoning and Gemini for multimodal inputs, delivering cost-effective high performance."
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>}
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Operation</h2>
              <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                Seamless <br /> <span className="text-gradient">Interaction.</span>
              </h3>
            </div>
            
            <div className="space-y-8">
              <Step number="01" title="Voice Initiation" description="Initiate connection via high-fidelity voice or textual command. Nexus parses intent using advanced multimodal LLMs." />
              <Step number="02" title="Autonomous Execution" description="The agent orchestrates the Linux kernel, utilizing specialized tools to browse, code, and operate applications." />
              <Step number="03" title="Visual Verification" description="Nexus continuously monitors the desktop output, providing real-time VNC streaming and screenshot analysis." />
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="relative glass-panel rounded-3xl p-8 border border-white/10">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Agent_Telemetry</div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active</div>
                  </div>
                </div>
                <div className="space-y-3 font-mono text-[11px]">
                  <p className="text-cyan-500/80">&gt; INITIALIZING MISSION_COMMAND...</p>
                  <p className="text-zinc-400">&gt; TARGET: RESEARCH AND DEPLOY FLASK_MICROSERVICE</p>
                  <p className="text-zinc-500">&gt; BOOTING E2B_SANDBOX_ID: 882-99-X</p>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-2/3 animate-[progress_2s_ease-in-out_infinite]" />
                  </div>
                  <p className="text-emerald-500/80">&gt; KERNEL_LINK_ESTABLISHED</p>
                  <p className="text-zinc-400">&gt; RUNNING_CMD: pip install flask</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Missions (Demos) */}
      <section id="missions" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em]">Missions</h2>
            <h3 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase">Template <span className="text-gradient">Library.</span></h3>
          </div>

          <div className="max-w-5xl mx-auto">
            <DemoPicker
              onSelect={(cmd) => handleStart(cmd)}
              disabled={isLoading}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
                <span className="text-black font-black text-xs italic">N</span>
              </div>
              <span className="text-lg font-black tracking-tighter italic uppercase">Nexus</span>
            </div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest max-w-xs">
              Autonomous Multimodal Agent for the Next Era of Computing.
            </p>
          </div>
          
          <div className="flex gap-12 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            <div className="space-y-4">
              <p className="text-zinc-300">Stack</p>
              <ul className="space-y-2">
                <li><span className="hover:text-white transition-colors cursor-default">Gemini 2.5</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Google ADK</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">E2B Desktop</span></li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-zinc-300">Resources</p>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Github</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Keys</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">
          <p>© 2026 NEXUS SYSTEMS ARCHITECTURE</p>
          <p>Built for the Gemini Live Agent Challenge</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="glass-card rounded-3xl p-8 space-y-6 group hover:shadow-[0_0_40px_rgba(34,211,238,0.05)]">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-all duration-500">
        {icon}
      </div>
      <div className="space-y-3">
        <h4 className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">{title}</h4>
        <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6 group">
      <div className="text-2xl font-black italic text-zinc-800 group-hover:text-cyan-500/40 transition-colors duration-500">{number}</div>
      <div className="space-y-1">
        <h4 className="text-sm font-black uppercase tracking-widest text-zinc-200 group-hover:text-white transition-colors">{title}</h4>
        <p className="text-xs text-zinc-500 leading-relaxed font-medium">{description}</p>
      </div>
    </div>
  );
}
