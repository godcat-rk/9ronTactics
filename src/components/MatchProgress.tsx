import type { RoundRecord, PlayerRole } from '../types/game';
import { isOdd } from '../lib/gameLogic';

interface Props {
  rounds: Record<number, RoundRecord>;
  currentRound: number;
  myRole: PlayerRole;
  isFinished?: boolean;
}

const TOTAL_ROUNDS = 9;

export function MatchProgress({ rounds, currentRound, myRole, isFinished = false }: Props) {
  return (
    <div style={{ width: '100%', maxWidth: 520, padding: '0 4px' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => i + 1).map((n) => {
          const rec    = rounds[n];
          const done   = rec?.outcome != null;
          const active = !isFinished && n === currentRound && !done;

          const myTile  = rec ? (myRole === 'host' ? rec.hostTile : rec.guestTile) : null;
          const oppTile = rec ? (myRole === 'host' ? rec.guestTile : rec.hostTile) : null;
          const won  = rec?.outcome === myRole;
          const draw = rec?.outcome === 'draw';

          const resultColor = won ? '#C89614' : draw ? '#6A6050' : '#7B44CC';
          const oppIsOdd    = done && oppTile != null ? isOdd(oppTile) : null;
          const oppColor    = oppIsOdd === true ? '#C84040' : oppIsOdd === false ? '#3EA878' : null;
          const myColor     = myTile != null ? (isOdd(myTile) ? '#A03030' : '#2E7055') : undefined;

          return (
            <div
              key={n}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '6px 2px',
                gap: 4,
                background: active ? '#160F1E' : '#0C0910',
                border: `1px solid ${done ? resultColor + '55' : active ? '#7A581066' : '#1E1428'}`,
                boxShadow: active ? '0 0 10px rgba(200,150,20,0.12)' : 'none',
                opacity: !done && !active ? 0.3 : 1,
                transition: 'opacity 0.3s, border-color 0.3s',
              }}
            >
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 9, lineHeight: 1,
                  color: active ? '#C89614' : done ? '#4A3820' : '#2A1E0A',
                }}
              >
                {n}
              </span>

              <div style={{ height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isFinished && oppTile != null ? (
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, lineHeight: 1, color: oppColor ?? '#4A3820', textShadow: oppColor ? `0 0 6px ${oppColor}` : 'none' }}>
                    {oppTile}
                  </span>
                ) : oppColor != null ? (
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: oppColor, boxShadow: `0 0 5px ${oppColor}` }} />
                ) : (
                  <span style={{ display: 'inline-block', width: 8, height: 8 }} />
                )}
              </div>

              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 14, fontWeight: 700, lineHeight: 1,
                  color: myColor ?? (active ? '#2A1E0A' : '#1A1018'),
                }}
              >
                {myTile != null ? myTile : active ? '?' : '·'}
              </span>

              <span
                style={{
                  fontFamily: "'Noto Serif JP', serif",
                  fontSize: 9, lineHeight: 1, fontWeight: 700,
                  color: done ? resultColor : 'transparent',
                  textShadow: done ? `0 0 6px ${resultColor}` : 'none',
                }}
              >
                {done ? (won ? '勝' : draw ? '引' : '負') : '·'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
