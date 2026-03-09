"use client";

type Props = {
  onSelect: (text: string) => void;
  disabled: boolean;
};

type DemoScenario = {
  title: string;
  description: string;
  task: string;
  icon: React.ReactNode;
};

const DEMOS: DemoScenario[] = [
  {
    title: "Research AI startups",
    description: "Find and summarize the top 5 AI startups of 2026",
    task: "Find and summarize the top 5 AI startups of 2026",
    icon: (
      /* Research / magnifying glass icon */
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <path d="M11 8a3 3 0 0 0-3 3" />
      </svg>
    ),
  },
  {
    title: "Write Python code",
    description: "Create a Python fibonacci script and run it",
    task: "Create a Python fibonacci script and run it",
    icon: (
      /* Code icon */
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </svg>
    ),
  },
  {
    title: "System info",
    description: "Show system information and list all files on the desktop",
    task: "Show system information and list all files on the desktop",
    icon: (
      /* Terminal icon */
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polyline points="6 10 10 14 6 18" />
        <line x1="14" y1="18" x2="18" y2="18" />
      </svg>
    ),
  },
];

export function DemoPicker({ onSelect, disabled }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {DEMOS.map((demo) => (
        <button
          key={demo.title}
          type="button"
          onClick={() => onSelect(demo.task)}
          disabled={disabled}
          className={`
            group text-left p-5 rounded-xl
            border transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]/40
            ${
              disabled
                ? "bg-[#18181b]/50 border-[#27272a]/50 opacity-50 cursor-not-allowed"
                : "bg-[#18181b] border-[#27272a] hover:border-[#22d3ee]/40 hover:bg-[#18181b]/80 hover:shadow-[0_0_20px_rgba(34,211,238,0.06)] cursor-pointer"
            }
          `}
        >
          {/* Icon */}
          <div
            className={`mb-3 transition-colors duration-200 ${
              disabled
                ? "text-zinc-600"
                : "text-zinc-500 group-hover:text-[#22d3ee]"
            }`}
          >
            {demo.icon}
          </div>

          {/* Title */}
          <h3
            className={`font-semibold text-sm mb-1.5 transition-colors duration-200 ${
              disabled
                ? "text-zinc-500"
                : "text-zinc-200 group-hover:text-white"
            }`}
          >
            {demo.title}
          </h3>

          {/* Description */}
          <p
            className={`text-xs leading-relaxed ${
              disabled ? "text-zinc-600" : "text-zinc-500"
            }`}
          >
            {demo.description}
          </p>
        </button>
      ))}
    </div>
  );
}
