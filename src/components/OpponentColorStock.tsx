interface Props {
  oddRemaining: number;
  evenRemaining: number;
}

export function OpponentColorStock({ oddRemaining, evenRemaining }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs tracking-widest uppercase" style={{ color: '#888' }}>
        OPPONENT COLORS
      </p>
      <div className="flex gap-3">
        <ColorCount label="赤" caption="奇数" count={oddRemaining} color="#ff2d55" bg="#1a0a0f" />
        <ColorCount label="青" caption="偶数" count={evenRemaining} color="#00e5ff" bg="#0a0f1a" />
      </div>
    </div>
  );
}

function ColorCount({
  label,
  caption,
  count,
  color,
  bg,
}: {
  label: string;
  caption: string;
  count: number;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded px-3 py-2"
      style={{
        background: bg,
        border: `1px solid ${color}66`,
        boxShadow: `0 0 8px ${color}22`,
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-sm"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <div className="flex flex-col leading-none">
        <span className="text-sm font-bold" style={{ color }}>{label}</span>
        <span className="text-[10px]" style={{ color: '#666' }}>{caption}</span>
      </div>
      <span className="text-xl font-bold" style={{ color }}>{count}</span>
    </div>
  );
}
