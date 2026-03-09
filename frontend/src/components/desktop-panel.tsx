"use client";

type Props = {
  streamUrl: string | null;
};

export function DesktopPanel({ streamUrl }: Props) {
  if (!streamUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full rounded-lg border border-[#27272a] bg-[#18181b]">
        {/* Skeleton loading placeholder */}
        <div className="w-full h-full p-4 flex flex-col gap-3 animate-pulse">
          <div className="h-4 w-48 rounded bg-[#27272a]" />
          <div className="flex-1 rounded-lg bg-[#27272a]/60" />
          <div className="flex gap-2">
            <div className="h-3 w-24 rounded bg-[#27272a]" />
            <div className="h-3 w-16 rounded bg-[#27272a]" />
          </div>
        </div>
        <p className="absolute text-sm text-zinc-500">
          Waiting for desktop stream...
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-lg border border-[#27272a] overflow-hidden bg-black">
      {/* LIVE indicator */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-emerald-400 text-xs font-semibold tracking-wide">
          LIVE
        </span>
      </div>

      <iframe
        src={streamUrl}
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write"
        title="NEXUS Desktop"
      />
    </div>
  );
}
