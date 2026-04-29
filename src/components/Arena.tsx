import type { RoundRecord, PlayerRole, Tile } from '../types/game';
import { isOdd } from '../lib/gameLogic';

type ArenaPhase = 'active' | 'colors' | 'result';

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
  const showOpponentColor = bothSubmitted && phase !== 'active';
  const showResult = bothSubmitted && phase === 'result' && round?.outcome != null;
  const myOutcome = round?.outcome === myRole;
  const draw = round?.outcome === 'draw';
  const resultColor = myOutcome ? '#ffd700' : draw ? '#888888' : '#bf44ff';

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs tracking-widest uppercase" style={{ color: '#666' }}>ROUND</span>
        <span className="text-2xl font-bold neon-text-gold">{currentRound}</span>
        <span className="text-xs" style={{ color: '#666' }}>/ 9</span>
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-2 opacity-90">
          <span className="text-xs tracking-widest" style={{ color: '#888' }}>OPPONENT</span>
          <OpponentTile tile={opponentTile ?? null} showColor={showOpponentColor} />
        </div>

        <div className="flex h-10 flex-col items-center justify-center">
          {showResult ? (
            <span className="text-sm font-bold tracking-widest" style={{ color: resultColor, textShadow: `0 0 14px ${resultColor}` }}>
              {myOutcome ? 'WIN' : draw ? 'DRAW' : 'LOSE'}
            </span>
          ) : bothSubmitted && phase === 'colors' ? (
            <span className="text-xs tracking-widest neon-text-gold">REVEAL</span>
          ) : (
            <span className="text-2xl font-bold animate-dragon-glow">龍</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <MyTile tile={myTile ?? null} highlight={showResult ? resultColor : null} />
          <span className="text-xs tracking-widest" style={{ color: '#888' }}>YOU</span>
        </div>
      </div>
    </div>
  );
}

function OpponentTile({ tile, showColor }: { tile: Tile | null; showColor: boolean }) {
  if (tile == null) {
    return (
      <div
        className="flex h-20 w-14 items-center justify-center rounded text-2xl font-bold"
        style={{ background: '#0f0f1a', border: '1px dashed #2a2a3a', color: '#666' }}
      >
        ?
      </div>
    );
  }

  if (!showColor) {
    return (
      <div
        className="flex h-20 w-14 items-center justify-center rounded text-sm font-bold tracking-widest"
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
      className="flex h-20 w-14 animate-reveal flex-col items-center justify-center rounded font-bold"
      style={{
        background: bg,
        border: `2px solid ${color}`,
        boxShadow: `0 0 14px ${color}66`,
        color,
      }}
    >
      <span className="text-xs tracking-widest">{odd ? '赤' : '青'}</span>
      <span className="text-lg">伏</span>
    </div>
  );
}

function MyTile({ tile, highlight }: { tile: Tile | null; highlight: string | null }) {
  if (tile == null) {
    return (
      <div
        className="flex h-24 w-16 items-center justify-center rounded text-3xl font-bold"
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
      className="flex h-24 w-16 items-center justify-center rounded text-3xl font-bold"
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
