export default function TagBadge({ tags }) {
  if (!tags || tags.length === 0) return <span className="text-[11px] text-zinc-700">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag, index) => (
        <span
          key={index}
          className="text-[10px] font-medium px-2 py-[2px] rounded border border-blue-500/20 text-blue-400/80 uppercase tracking-wider hover:border-blue-400/30 hover:text-blue-300 transition-colors cursor-default"
          title={tag}
        >
          {tag}
        </span>
      ))}
      {tags.length > 3 && (
        <span className="text-[10px] font-medium px-1.5 py-[2px] rounded border border-border-dark/50 text-zinc-600 uppercase tracking-wider">
          +{tags.length - 3}
        </span>
      )}
    </div>
  );
}
