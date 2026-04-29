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
    <div className="w-full px-2" style={{ maxWidth: 480 }}>
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => i + 1).map((n) => {
          const rec = rounds[n];
          const done = rec?.outcome != null;
          const active = !isFinished && n === currentRound && !done;

          const myTile = rec ? (myRole === 'host' ? rec.hostTile : rec.guestTile) : null;
          const oppTile = rec ? (myRole === 'host' ? rec.guestTile : rec.hostTile) : null;
          const won = rec?.outcome === myRole;
          const draw = rec?.outcome === 'draw';
          const resultColor = won ? '#ffd700' : draw ? '#888888' : '#bf44ff';
          const oppIsOdd = done && oppTile != null ? isOdd(oppTile) : null;
          const oppColor = oppIsOdd === true ? '#ff2d55' : oppIsOdd === false ? '#00e5ff' : null;
          const myColor = myTile != null ? (isOdd(myTile) ? '#ff6b8a' : '#5ef0ff') : undefined;

          return (
            <div
              key={n}
              className="flex-1 flex flex-col items-center rounded gap-[3px] py-1 px-0.5 sm:gap-[5px] sm:py-2"
              style={{
                background: active ? '#141428' : '#0a0a14',
                border: `1px solid ${done ? resultColor + '55' : active ? '#ffd70066' : '#181828'}`,
                boxShadow: active ? '0 0 10px rgba(255,215,0,0.14)' : 'none',
                opacity: !done && !active ? 0.35 : 1,
                transition: 'opacity 0.3s, border-color 0.3s',
              }}
            >
              <span className="mp-n" style={{ color: active ? '#ffd700' : done ? '#555' : '#2a2a3a' }}>
                {n}
              </span>

              <div className="mp-oh">
                {isFinished && oppTile != null ? (
                  <span className="mp-ol" style={{ color: oppColor ?? '#555', textShadow: oppColor ? `0 0 6px ${oppColor}` : 'none' }}>
                    {oppTile}
                  </span>
                ) : oppColor != null ? (
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: oppColor, boxShadow: `0 0 5px ${oppColor}` }} />
                ) : (
                  <span style={{ display: 'inline-block', width: 8, height: 8 }} />
                )}
              </div>

              <span className="mp-ml" style={{ color: myColor ?? (active ? '#333' : '#1e1e2e') }}>
                {myTile != null ? myTile : active ? '?' : '·'}
              </span>

              <span className="mp-rl" style={{ color: done ? resultColor : 'transparent', textShadow: done ? `0 0 6px ${resultColor}` : 'none' }}>
                {done ? (won ? '勝' : draw ? '引' : '負') : '·'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
