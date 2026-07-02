export default function DifficultyBadge({ difficulty }) {
  const level = difficulty?.toLowerCase();

  let dotColor = "bg-zinc-600";
  let glowColor = "shadow-none";
  let textColor = "text-zinc-500";
  let dotCount = 1;

  switch (level) {
    case "easy":
      dotColor = "bg-emerald";
      glowColor = "shadow-[0_0_6px_rgba(52,211,153,0.4)]";
      textColor = "text-emerald";
      dotCount = 1;
      break;
    case "medium":
      dotColor = "bg-amber";
      glowColor = "shadow-[0_0_6px_rgba(251,191,36,0.4)]";
      textColor = "text-amber";
      dotCount = 2;
      break;
    case "hard":
      dotColor = "bg-rose";
      glowColor = "shadow-[0_0_6px_rgba(251,113,133,0.4)]";
      textColor = "text-rose";
      dotCount = 3;
      break;
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: dotCount }).map((_, i) => (
          <div key={i} className={`w-[6px] h-[6px] rounded-full ${dotColor} ${glowColor} transition-all duration-300`} />
        ))}
      </div>
      <span className={`text-[11px] font-semibold uppercase tracking-wider ${textColor}`}>
        {difficulty || "Unknown"}
      </span>
    </div>
  );
}
