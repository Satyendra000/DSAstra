export default function DifficultyBadge({ difficulty }) {
  const level = difficulty?.toLowerCase();

  let dotColor = "bg-zinc-600";
  let textColor = "text-zinc-500";
  let dotCount = 1;

  switch (level) {
    case "easy":
      dotColor = "bg-emerald-500";
      textColor = "text-emerald-500";
      dotCount = 1;
      break;
    case "medium":
      dotColor = "bg-amber-500";
      textColor = "text-amber-500";
      dotCount = 2;
      break;
    case "hard":
      dotColor = "bg-rose-500";
      textColor = "text-rose-500";
      dotCount = 3;
      break;
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: dotCount }).map((_, i) => (
          <div key={i} className={`w-[6px] h-[6px] rounded-full ${dotColor}`} />
        ))}
      </div>
      <span className={`text-[11px] font-semibold uppercase tracking-wider ${textColor}`}>
        {difficulty || "Unknown"}
      </span>
    </div>
  );
}
