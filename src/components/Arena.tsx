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
  const myTile          = myRole === 'host' ? round?.hostTile : round?.guestTile;
  const opponentTile    = myRole === 'host' ? round?.guestTile : round?.hostTile;
  const opponentHasTile = opponentTile != null;
  const bothSubmitted   = myTile != null && opponentHasTile;
  const isSuspense      = bothSubmitted && phase === 'suspense';
  const showOpponentColor = bothSubmitted && (phase === 'colors' || phase === 'result');
  const showResult        = bothSubmitted && phase === 'result' && round?.outcome != null;
  const myOutcome = round?.outcome === myRole;
  const draw      = round?.outcome === 'draw';

  const resultColor = myOutcome ? '#C89614' : draw ? '#7A7060' : '#7B44CC';
  const resultLabel = myOutcome ? '勝' : draw ? '引分' : '敗';

  return (
    <div
      className="panel-ornate flex flex-col items-center gap-5"
      style={{ width: '100%', maxWidth: 440, padding: '1.5rem 1rem' }}
    >
      {/* Round indicator */}
      <div className="flex items-center gap-3">
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.3em', color: '#5C4008' }}>
          ROUND
        </span>
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 32,
            fontWeight: 700,
            color: '#C89614',
            textShadow: '0 0 12px rgba(200,150,20,0.6)',
            lineHeight: 1,
          }}
        >
          {currentRound}
        </span>
        <span style={{ fontSize: 14, color: '#3A2808' }}>/ 9</span>
      </div>

      {/* Battle area */}
      <div className="flex w-full flex-col items-center gap-4">

        {/* Opponent tile */}
        <div className="flex flex-col items-center gap-2 opacity-90">
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.25em', color: '#5C4008' }}>
            OPPONENT
          </span>
          <div className={isSuspense ? 'animate-tile-shake' : ''}>
            <OpponentTile tile={opponentTile ?? null} showColor={showOpponentColor} />
          </div>
        </div>

        {/* Center: result / reveal / dragon */}
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {showResult ? (
            <span
              className="animate-result-pop"
              style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 38,
                fontWeight: 900,
                color: resultColor,
                textShadow: `0 0 28px ${resultColor}, 0 0 60px ${resultColor}66`,
                letterSpacing: '0.1em',
              }}
            >
              {resultLabel}
            </span>
          ) : bothSubmitted && phase === 'colors' ? (
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.3em',
                color: '#C89614',
                textShadow: '0 0 12px rgba(200,150,20,0.7)',
              }}
            >
              REVEAL
            </span>
          ) : (
            <span
              className={isSuspense ? 'animate-tile-shake' : 'animate-dragon-glow'}
              style={{ fontSize: 30, fontFamily: 'serif' }}
            >
              龍
            </span>
          )}
        </div>

        {/* My tile */}
        <div className="flex flex-col items-center gap-2">
          <div className={isSuspense ? 'animate-tile-shake' : ''}>
            <MyTile tile={myTile ?? null} highlight={showResult ? resultColor : null} />
          </div>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.25em', color: '#5C4008' }}>
            YOU
          </span>
        </div>
      </div>
    </div>
  );
}

function OpponentTile({ tile, showColor }: { tile: Tile | null; showColor: boolean }) {
  if (tile == null) {
    return (
      <div
        style={{
          width: 64, height: 90,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0A0810', border: '1px dashed #2A1E0A',
          color: '#3A2808', fontSize: 22, fontFamily: "'Noto Serif JP', serif",
        }}
      >
        ？
      </div>
    );
  }

  if (!showColor) {
    return (
      <div
        style={{
          width: 64, height: 90,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0A0810', border: '1px solid #2A1E0A',
          color: '#3A2808', fontSize: 12,
          fontFamily: "'Cinzel', serif", letterSpacing: '0.1em',
        }}
      >
        SET
      </div>
    );
  }

  const odd   = isOdd(tile);
  const color = odd ? '#C84040' : '#3EA878';
  const bg    = odd ? '#120808' : '#080F0C';

  return (
    <div
      className="animate-reveal flex flex-col items-center justify-center font-bold"
      style={{
        width: 64, height: 90,
        background: bg, border: `2px solid ${color}`,
        boxShadow: `0 0 18px ${color}55`,
        color, gap: 4, fontFamily: "'Noto Serif JP', serif",
      }}
    >
      <span style={{ fontSize: 11, letterSpacing: '0.05em' }}>{odd ? '赤・奇' : '青・偶'}</span>
      <span style={{ fontSize: 22 }}>伏</span>
    </div>
  );
}

function MyTile({ tile, highlight }: { tile: Tile | null; highlight: string | null }) {
  if (tile == null) {
    return (
      <div
        style={{
          width: 72, height: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0A0810', border: '1px dashed #2A1E0A',
          color: '#3A2808', fontSize: 26, fontFamily: "'Noto Serif JP', serif",
        }}
      >
        ―
      </div>
    );
  }

  const odd         = isOdd(tile);
  const color       = odd ? '#C84040' : '#3EA878';
  const bg          = odd ? '#120808' : '#080F0C';
  const borderColor = highlight ?? color;

  return (
    <div
      style={{
        width: 72, height: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: bg, border: `2px solid ${borderColor}`,
        boxShadow: `0 0 20px ${borderColor}66`,
        color, fontSize: 38, fontWeight: 700,
        fontFamily: "'Noto Serif JP', serif",
      }}
    >
      {tile}
    </div>
  );
}
