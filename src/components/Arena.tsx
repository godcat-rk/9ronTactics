import type { RoundRecord, PlayerRole } from '../types/game';

interface Props {
  round: RoundRecord | null;
  currentRound: number;
  myRole: PlayerRole;
  revealed: boolean;
}

export function Arena({ round, currentRound, myRole, revealed }: Props) {
  const myTile = myRole === 'host' ? round?.hostTile : round?.guestTile;
  const opponentTile = myRole === 'host' ? round?.guestTile : round?.hostTile;
  const myOutcome = round?.outcome === myRole;
  const draw = round?.outcome === 'draw';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs tracking-widest uppercase" style={{ color: '#666' }}>ROUND</span>
        <span className="text-2xl font-bold neon-text-gold">{currentRound}</span>
        <span className="text-xs" style={{ color: '#666' }}>/ 9</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Opponent side */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs tracking-widest" style={{ color: '#888' }}>OPPONENT</span>
          <div
            className={`w-16 h-24 rounded flex items-center justify-center text-3xl font-bold
              ${revealed ? 'animate-reveal' : ''}`}
            style={{
              background: '#0f0f1a',
              border: revealed && round?.outcome
                ? `2px solid ${myOutcome ? '#666' : draw ? '#ffd700' : '#ff2d55'}`
                : '1px solid #2a2a3a',
              boxShadow: revealed && !myOutcome && !draw
                ? '0 0 16px #ff2d55'
                : revealed && draw
                ? '0 0 16px #ffd700'
                : 'none',
              color: '#e0e0e0',
            }}
          >
            {revealed && opponentTile != null ? opponentTile : '?'}
          </div>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold animate-dragon-glow">龍</span>
          {revealed && round?.outcome && (
            <span className="text-xs mt-1 font-bold" style={{
              color: myOutcome ? '#00e5ff' : draw ? '#ffd700' : '#ff2d55'
            }}>
              {myOutcome ? 'WIN' : draw ? 'DRAW' : 'LOSE'}
            </span>
          )}
        </div>

        {/* My side */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs tracking-widest" style={{ color: '#888' }}>YOU</span>
          <div
            className={`w-16 h-24 rounded flex items-center justify-center text-3xl font-bold
              ${revealed ? 'animate-reveal' : ''}`}
            style={{
              background: myTile != null ? '#0f1a0f' : '#0f0f1a',
              border: revealed && round?.outcome
                ? `2px solid ${myOutcome ? '#00e5ff' : draw ? '#ffd700' : '#666'}`
                : myTile != null
                ? '2px solid #00e5ff'
                : '1px dashed #2a2a3a',
              boxShadow: myOutcome && revealed ? '0 0 16px #00e5ff' : 'none',
              color: '#00e5ff',
            }}
          >
            {myTile != null ? myTile : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
