interface Props {
  oddRemaining: number;
  evenRemaining: number;
}

const ODD_TOTAL  = 5;
const EVEN_TOTAL = 4;

export function OpponentColorStock({ oddRemaining, evenRemaining }: Props) {
  const oddUsed  = ODD_TOTAL  - oddRemaining;
  const evenUsed = EVEN_TOTAL - evenRemaining;

  return (
    <div className="flex flex-col items-center gap-2">
      <p style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.25em', color: '#3A2808', textTransform: 'uppercase' }}>
        Opponent
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {Array.from({ length: ODD_TOTAL }, (_, i) => (
          <Token key={`odd-${i}`} color="#C84040" used={i < oddUsed} />
        ))}
        <span style={{ width: 10 }} />
        {Array.from({ length: EVEN_TOTAL }, (_, i) => (
          <Token key={`even-${i}`} color="#3EA878" used={i < evenUsed} />
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
        width: 16,
        height: 26,
        borderRadius: 3,
        background: used ? '#100C14' : color,
        boxShadow: used ? 'none' : `0 0 8px ${color}99`,
        border: `1px solid ${used ? '#1E1828' : color + '88'}`,
        opacity: used ? 0.2 : 1,
        transition: 'background 0.3s, box-shadow 0.3s, opacity 0.3s',
      }}
    />
  );
}
