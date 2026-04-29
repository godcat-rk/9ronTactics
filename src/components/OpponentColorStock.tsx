interface Props {
  oddRemaining: number;
  evenRemaining: number;
}

const ODD_TOTAL = 5;
const EVEN_TOTAL = 4;

export function OpponentColorStock({ oddRemaining, evenRemaining }: Props) {
  const oddUsed = ODD_TOTAL - oddRemaining;
  const evenUsed = EVEN_TOTAL - evenRemaining;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[10px] tracking-widest uppercase" style={{ color: '#444' }}>
        Opponent
      </p>
      <div className="flex items-center" style={{ gap: 3 }}>
        {Array.from({ length: ODD_TOTAL }, (_, i) => (
          <Token key={`odd-${i}`} color="#ff2d55" used={i < oddUsed} />
        ))}
        <span style={{ width: 8 }} />
        {Array.from({ length: EVEN_TOTAL }, (_, i) => (
          <Token key={`even-${i}`} color="#00e5ff" used={i < evenUsed} />
        ))}
      </div>
    </div>
  );
}

function Token({ color, used }: { color: string; used: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 13,
        height: 20,
        borderRadius: 3,
        background: used ? '#111' : color,
        boxShadow: used ? 'none' : `0 0 7px ${color}99`,
        border: `1px solid ${used ? '#222' : color + '88'}`,
        opacity: used ? 0.25 : 1,
        transition: 'background 0.3s, box-shadow 0.3s, opacity 0.3s',
      }}
    />
  );
}
