interface Props {
  scores: { host: number; guest: number };
  myRole: 'host' | 'guest';
}

export function ScoreBoard({ scores, myRole }: Props) {
  const myScore  = myRole === 'host' ? scores.host  : scores.guest;
  const oppScore = myRole === 'host' ? scores.guest : scores.host;

  return (
    <div className="flex items-center gap-6 justify-center">
      <div className="flex flex-col items-center gap-1">
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1,
            color: '#C89614',
            textShadow: '0 0 14px rgba(200,150,20,0.65), 0 0 30px rgba(200,150,20,0.25)',
          }}
        >
          {myScore}
        </span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.25em', color: '#5C4008' }}>
          YOU
        </span>
      </div>

      <div
        style={{
          width: 1,
          height: 40,
          background: 'linear-gradient(to bottom, transparent, #3A2808, transparent)',
        }}
      />

      <div className="flex flex-col items-center gap-1">
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1,
            color: '#4A3820',
          }}
        >
          {oppScore}
        </span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.25em', color: '#3A2808' }}>
          OPP
        </span>
      </div>
    </div>
  );
}
