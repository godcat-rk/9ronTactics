import type { RoundRecord, PlayerRole, Tile } from '../types/game';
import { isOdd } from '../lib/gameLogic';

type ArenaPhase = 'active' | 'suspense' | 'colors' | 'result';

interface Props {
  round: RoundRecord | null;
  currentRound: number;
  myRole: PlayerRole;
  phase: ArenaPhase;
}

export function Arena({ round, currentRound, myRole, phase }: Props) {
  const myTile = myRole === 'host' ? round?.hostTile : round?.guestTile;
  const opponentTile = myRole === 'host' ? round?.guestTile : round?.hostTile;
  const opponentHasTile = opponentTile != null;
  const bothSubmitted = myTile != null && opponentHasTile;
  const isSuspense = bothSubmitted && phase === 'suspense';
  const showOpponentColor = bothSubmitted && (phase === 'colors' || phase === 'result');
  const showResult = bothSubmitted && phase === 'result' && round?.outcome != null;
  const myOutcome = round?.outcome === myRole;
  const draw = round?.outcome === 'draw';
  const resultColor = myOutcome ? '#ffd700' : draw ? '#888888' : '#bf44ff';

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs tracking-widest uppercase" style={{ color: '#666' }}>ROUND</span>
        <span className="text-xl sm:text-3xl font-bold neon-text-gold">{currentRound}</span>
        <span className="text-xs" style={{ color: '#666' }}>/ 9</span>
      </div>

      {/* モバイル: 横並び / デスクトップ: 縦並び */}
      <div className="flex w-full flex-row sm:flex-col items-center justify-center gap-3">
        {/* Opponent */}
        <div className="flex flex-col items-center gap-1 sm:gap-2 opacity-90">
          <span className="hidden sm:block text-xs tracking-widest" style={{ color: '#888' }}>OPPONENT</span>
          <div className={isSuspense ? 'animate-tile-shake' : ''}>
            <OpponentTile tile={opponentTile ?? null} showColor={showOpponentColor} />
          </div>
        </div>

        {/* Center: WIN/DRAW/LOSE or 龍 */}
        <div className="flex h-8 sm:h-12 flex-col items-center justify-center">
          {showResult ? (
            <span
              className="text-2xl sm:text-4xl font-bold tracking-widest animate-result-pop"
              style={{ color: resultColor, textShadow: `0 0 24px ${resultColor}` }}
            >
              {myOutcome ? 'WIN' : draw ? 'DRAW' : 'LOSE'}
            </span>
          ) : bothSubmitted && phase === 'colors' ? (
            <span className="text-xs sm:text-base font-bold tracking-widest neon-text-gold">REVEAL</span>
          ) : (
            <span className={`text-xl sm:text-3xl font-bold ${isSuspense ? 'animate-tile-shake' : 'animate-dragon-glow'}`}>龍</span>
          )}
        </div>

        {/* Me */}
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <div className={isSuspense ? 'animate-tile-shake' : ''}>
            <MyTile tile={myTile ?? null} highlight={showResult ? resultColor : null} />
          </div>
          <span className="hidden sm:block text-xs tracking-widest" style={{ color: '#888' }}>YOU</span>
        </div>
      </div>
    </div>
  );
}

function OpponentTile({ tile, showColor }: { tile: Tile | null; showColor: boolean }) {
  if (tile == null) {
    return (
      <div
        className="flex h-16 w-12 sm:h-24 sm:w-16 items-center justify-center rounded text-xl sm:text-2xl font-bold"
        style={{ background: '#0f0f1a', border: '1px dashed #2a2a3a', color: '#666' }}
      >
        ?
      </div>
    );
  }

  if (!showColor) {
    return (
      <div
        className="flex h-16 w-12 sm:h-20 sm:w-14 items-center justify-center rounded text-xs sm:text-sm font-bold tracking-widest"
        style={{ background: '#0f0f1a', border: '1px solid #666', color: '#888' }}
      >
        SET
      </div>
    );
  }

  const odd = isOdd(tile);
  const color = odd ? '#ff2d55' : '#00e5ff';
  const bg = odd ? '#1a0a0f' : '#0a0f1a';

  return (
    <div
      className="flex h-16 w-12 sm:h-24 sm:w-16 animate-reveal flex-col items-center justify-center rounded font-bold"
      style={{
        background: bg,
        border: `2px solid ${color}`,
        boxShadow: `0 0 14px ${color}66`,
        color,
      }}
    >
      <span className="text-sm sm:text-lg font-bold">{odd ? '奇' : '偶'}</span>
    </div>
  );
}

function MyTile({ tile, highlight }: { tile: Tile | null; highlight: string | null }) {
  if (tile == null) {
    return (
      <div
        className="flex h-20 w-14 sm:h-24 sm:w-16 items-center justify-center rounded text-2xl sm:text-3xl font-bold"
        style={{ background: '#0f0f1a', border: '1px dashed #2a2a3a', color: '#666' }}
      >
        -
      </div>
    );
  }

  const odd = isOdd(tile);
  const color = odd ? '#ff2d55' : '#00e5ff';
  const bg = odd ? '#1a0a0f' : '#0a0f1a';
  const borderColor = highlight ?? color;

  return (
    <div
      className="flex h-20 w-14 sm:h-28 sm:w-20 items-center justify-center rounded text-3xl sm:text-4xl font-bold"
      style={{
        background: bg,
        border: `2px solid ${borderColor}`,
        boxShadow: `0 0 16px ${borderColor}66`,
        color,
      }}
    >
      {tile}
    </div>
  );
}
