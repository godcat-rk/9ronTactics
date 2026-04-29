interface Props {
  scores: { host: number; guest: number };
  myRole: 'host' | 'guest';
}

export function ScoreBoard({ scores, myRole }: Props) {
  const myScore = myRole === 'host' ? scores.host : scores.guest;
  const oppScore = myRole === 'host' ? scores.guest : scores.host;

  return (
    <div className="flex items-center gap-4 justify-center">
      <div className="flex flex-col items-center">
        <span className="text-5xl font-bold" style={{ color: '#ffd700', textShadow: '0 0 10px #ffd70088' }}>{myScore}</span>
        <span className="text-xs tracking-widest" style={{ color: '#888' }}>YOU</span>
      </div>
      <span className="text-2xl" style={{ color: '#333' }}>—</span>
      <div className="flex flex-col items-center">
        <span className="text-5xl font-bold" style={{ color: '#aaaaaa' }}>{oppScore}</span>
        <span className="text-xs tracking-widest" style={{ color: '#888' }}>OPP</span>
      </div>
    </div>
  );
}
