export default function TagBadge({ tags }) {
  if (!tags || tags.length === 0) return <span className="text-[11px] text-text-muted">—</span>;

  /* Cycle through varied accent colors for visual richness */
  const tagColors = [
    "border-blue/15 text-blue/80 hover:border-blue/25 hover:text-blue",
    "border-violet/15 text-violet/80 hover:border-violet/25 hover:text-violet",
    "border-cyan/15 text-cyan/80 hover:border-cyan/25 hover:text-cyan",
    "border-emerald/15 text-emerald/80 hover:border-emerald/25 hover:text-emerald",
    "border-amber/15 text-amber/80 hover:border-amber/25 hover:text-amber",
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag, index) => (
        <span
          key={index}
          className={`text-[10px] font-medium px-2 py-[2px] rounded-md border uppercase tracking-wider transition-all duration-200 cursor-default hover:scale-[1.03] ${tagColors[index % tagColors.length]}`}
          title={tag}
        >
          {tag}
        </span>
      ))}
      {tags.length > 3 && (
        <span className="text-[10px] font-medium px-1.5 py-[2px] rounded-md border border-border text-text-tertiary uppercase tracking-wider">
          +{tags.length - 3}
        </span>
      )}
    </div>
  );
}
