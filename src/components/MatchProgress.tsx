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
    <div className="w-full max-w-sm px-1">
      <div className="flex gap-1">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => i + 1).map((n) => {
          const rec = rounds[n];
          const done = rec?.outcome != null;
          const active = !isFinished && n === currentRound && !done;

          const myTile = rec ? (myRole === 'host' ? rec.hostTile : rec.guestTile) : null;
          const oppTile = rec ? (myRole === 'host' ? rec.guestTile : rec.hostTile) : null;
          const won = rec?.outcome === myRole;
          const draw = rec?.outcome === 'draw';
          const resultColor = won ? '#00e5ff' : draw ? '#ffd700' : '#ff2d55';
          const oppIsOdd = done && oppTile != null ? isOdd(oppTile) : null;
          const oppColor = oppIsOdd === true ? '#ff2d55' : oppIsOdd === false ? '#00e5ff' : null;
          const myColor = myTile != null ? (isOdd(myTile) ? '#ff6b8a' : '#5ef0ff') : undefined;

          return (
            <div
              key={n}
              className="flex-1 flex flex-col items-center py-1.5 rounded"
              style={{
                gap: 3,
                background: active ? '#141428' : '#0a0a14',
                border: `1px solid ${done ? resultColor + '55' : active ? '#ffd70066' : '#181828'}`,
                boxShadow: active ? '0 0 10px rgba(255,215,0,0.14)' : 'none',
                opacity: !done && !active ? 0.32 : 1,
                transition: 'opacity 0.3s, border-color 0.3s',
              }}
            >
              {/* Round number */}
              <span style={{
                fontSize: 9,
                lineHeight: 1,
                color: active ? '#ffd700' : done ? '#555' : '#2a2a3a',
              }}>
                {n}
              </span>

              {/* Opponent color dot */}
              <div style={{ height: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {oppColor != null ? (
                  <span style={{
                    display: 'inline-block',
                    width: 8, height: 8,
                    borderRadius: 2,
                    background: oppColor,
                    boxShadow: `0 0 5px ${oppColor}`,
                  }} />
                ) : (
                  <span style={{ display: 'inline-block', width: 8, height: 8 }} />
                )}
              </div>

              {/* My tile */}
              <span style={{
                fontSize: 14,
                fontWeight: 'bold',
                lineHeight: 1,
                color: myColor ?? (active ? '#333' : '#1e1e2e'),
              }}>
                {myTile != null ? myTile : active ? '?' : '·'}
              </span>

              {/* Result */}
              <span style={{
                fontSize: 9,
                lineHeight: 1,
                fontWeight: 'bold',
                color: done ? resultColor : 'transparent',
                textShadow: done ? `0 0 6px ${resultColor}` : 'none',
              }}>
                {done ? (won ? '勝' : draw ? '引' : '負') : '·'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
