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
    title: "Build & run a web app",
    description: "Create a Flask app with a hello-world page, run it, and verify it works",
    task: "Create a simple Flask web app with a styled hello-world page. Install flask if needed, save the app to app.py, run it on port 5000 in the background, then use curl to verify it responds correctly.",
    icon: (
      /* Globe / web icon */
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <circle cx="12" cy="12" r="10" />
        <ellipse cx="12" cy="12" rx="4" ry="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    title: "Write Python code",
    description: "Generate Fibonacci numbers and display as a formatted table",
    task: "Write a Python script that generates the first 20 Fibonacci numbers and prints them as a neatly formatted table with the index and value columns. Save it to fibonacci.py, run it, and show the output.",
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
    title: "Generate a chart",
    description: "Create a matplotlib bar chart and save it as an image",
    task: "Using Python and matplotlib, create a colorful bar chart showing the popularity of programming languages (Python, JavaScript, TypeScript, Rust, Go, Java). Save the chart as chart.png and then take a screenshot so I can see it.",
    icon: (
      /* Chart icon */
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <rect x="3" y="12" width="4" height="8" rx="1" />
        <rect x="10" y="6" width="4" height="14" rx="1" />
        <rect x="17" y="3" width="4" height="17" rx="1" />
      </svg>
    ),
  },
  {
    title: "System explorer",
    description: "Discover OS info, hardware specs, running processes, and installed apps",
    task: "Show me a complete system report: OS version, kernel, CPU model, total RAM, disk usage, list of running GUI applications, and the top 5 processes by memory usage. Format the output nicely.",
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
