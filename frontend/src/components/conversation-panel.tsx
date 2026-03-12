"use client";

import { useRef, useEffect } from "react";

type Message = {
  role: "user" | "agent";
  text: string;
};

type Props = {
  messages: Message[];
  isThinking?: boolean;
};

export function ConversationPanel({ messages, isThinking = false }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isThinking]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-8 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="relative w-12 h-12 text-zinc-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 1v22M8 5v14M4 9v6M16 5v14M20 9v6"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Awaiting Input
            </p>
            <p className="text-zinc-600 text-[10px] max-w-[180px] mx-auto leading-relaxed uppercase tracking-wider">
              Initialize communication via voice or text command.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-6 p-6 overflow-y-auto h-full custom-scrollbar"
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} animate-fade-in`}
        >
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${msg.role === "user" ? "text-cyan-500" : "text-emerald-500"}`}>
              {msg.role === "user" ? "Protocol: User" : "Source: NEXUS"}
            </span>
            <div className={`w-1 h-1 rounded-full ${msg.role === "user" ? "bg-cyan-500/40" : "bg-emerald-500/40"}`} />
          </div>
          
          <div
            className={`max-w-full px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-300 ${
              msg.role === "user"
                ? "bg-cyan-500/5 text-cyan-50 border border-cyan-500/20 rounded-tr-none shadow-lg shadow-cyan-500/5"
                : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none"
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="flex flex-col items-start animate-fade-in">
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">
              Source: NEXUS
            </span>
            <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
          </div>
          
          <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-zinc-900 border border-zinc-800 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Neural Processing...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
