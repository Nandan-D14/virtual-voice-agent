"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";

import { useSession } from "@/lib/use-session";
import { useWebSocket } from "@/lib/use-websocket";
import { useMicrophone } from "@/lib/use-microphone";
import { AudioPlayer } from "@/lib/audio-playback";
import type { WsMessage, SessionPhase } from "@/lib/message-types";

import { DesktopPanel } from "@/components/desktop-panel";
import { ConversationPanel } from "@/components/conversation-panel";
import { ActivityFeed } from "@/components/activity-feed";
import { MicButton } from "@/components/mic-button";
import { StatusBar } from "@/components/status-bar";
import { DemoPicker } from "@/components/demo-picker";

type Message = { role: "user" | "agent"; text: string };
type ActivityEvent = { type: string; timestamp: number; [key: string]: any };

export default function SessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params.id as string;

  // Session data
  const { session, destroySession } = useSession();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<SessionPhase>("idle");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  // Text input
  const [textInput, setTextInput] = useState("");

  // Audio player
  const audioPlayer = useRef(new AudioPlayer());

  // WebSocket
  const wsUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${process.env.NEXT_PUBLIC_AGENT_WS_URL?.replace(/^wss?:\/\//, "") || "localhost:8000"}/ws/${sessionId}?ticket=${session?.ws_ticket || ""}`
      : null;

  const { sendBinary, sendJson, lastMessage, isConnected, onBinaryMessage } =
    useWebSocket(session?.ws_ticket ? wsUrl : null);

  // Microphone
  const { start: startMic, stop: stopMic, isRecording } = useMicrophone(sendBinary);

  // Audio playback for incoming binary frames
  useEffect(() => {
    onBinaryMessage.current = (data: ArrayBuffer) => {
      audioPlayer.current.play(data);
    };
  }, [onBinaryMessage]);

  // Process incoming WS messages
  useEffect(() => {
    if (!lastMessage) return;
    const msg = lastMessage;

    const addEvent = (m: WsMessage) => {
      setEvents((prev) => [...prev, { ...m, timestamp: Date.now() }]);
    };

    switch (msg.type) {
      case "sandbox_status":
        addEvent(msg);
        break;
      case "vnc_url":
        setStreamUrl(msg.url);
        break;
      case "transcript":
        setMessages((prev) => [...prev, { role: msg.role, text: msg.text }]);
        if (msg.role === "agent") setPhase("done");
        break;
      case "agent_thinking":
        setPhase("thinking");
        addEvent(msg);
        break;
      case "agent_tool_call":
        setPhase("acting");
        addEvent(msg);
        break;
      case "agent_tool_result":
        addEvent(msg);
        break;
      case "agent_screenshot":
        addEvent(msg);
        break;
      case "agent_complete":
        setPhase("done");
        addEvent(msg);
        break;
      case "error":
        addEvent(msg);
        break;
    }
  }, [lastMessage]);

  // Handle mic toggle
  const toggleMic = useCallback(() => {
    if (isRecording) {
      stopMic();
      setPhase("thinking");
    } else {
      startMic();
      setPhase("listening");
    }
  }, [isRecording, startMic, stopMic]);

  // Handle text submit
  const handleTextSubmit = useCallback(() => {
    const text = textInput.trim();
    if (!text) return;
    sendJson({ type: "text_input", text });
    setTextInput("");
    setPhase("thinking");
  }, [textInput, sendJson]);

  // Handle demo selection
  const handleDemo = useCallback(
    (text: string) => {
      sendJson({ type: "text_input", text });
      setPhase("thinking");
    },
    [sendJson]
  );

  // Auto-send demo command from URL params
  useEffect(() => {
    const demo = searchParams.get("demo");
    if (demo && isConnected) {
      const timer = setTimeout(() => handleDemo(demo), 1500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, searchParams, handleDemo]);

  // Handle end session
  const handleEnd = async () => {
    audioPlayer.current.stop();
    stopMic();
    await destroySession();
    router.push("/");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[#27272a] bg-[#18181b]">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-[#22d3ee]">NEXUS</span>
          </h1>
          {isConnected && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <button
          onClick={handleEnd}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
        >
          End Session
        </button>
      </header>

      {/* Main 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Activity Feed */}
        <div className="w-72 border-r border-[#27272a] flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-[#27272a] text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Activity
          </div>
          <div className="flex-1 overflow-y-auto">
            <ActivityFeed events={events} />
          </div>
        </div>

        {/* Center: Desktop + Input */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop viewer */}
          <div className="flex-1 p-2 overflow-hidden">
            <DesktopPanel streamUrl={streamUrl} />
          </div>

          {/* Demo picker (show when idle) */}
          {events.length === 0 && isConnected && (
            <div className="px-4 pb-2">
              <DemoPicker onSelect={handleDemo} disabled={!isConnected} />
            </div>
          )}

          {/* Text input bar */}
          <div className="px-4 py-2 border-t border-[#27272a] flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
              placeholder="Type a command..."
              className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#22d3ee]/50"
            />
            <MicButton
              isRecording={isRecording}
              onStart={toggleMic}
              onStop={toggleMic}
              disabled={!isConnected}
            />
          </div>
        </div>

        {/* Right: Conversation */}
        <div className="w-80 border-l border-[#27272a] flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-[#27272a] text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Conversation
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationPanel messages={messages} />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar phase={phase} isConnected={isConnected} />
    </div>
  );
}
