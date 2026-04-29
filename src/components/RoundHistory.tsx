import type { RoundRecord, PlayerRole } from '../types/game';

interface Props {
  rounds: Record<number, RoundRecord>;
  myRole: PlayerRole;
}

export function RoundHistory({ rounds, myRole }: Props) {
  const entries = Object.entries(rounds ?? {})
    .map(([k, v]) => ({ round: Number(k), ...v }))
    .filter((r) => r.outcome != null)
    .sort((a, b) => a.round - b.round);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs tracking-widest uppercase text-center" style={{ color: '#666' }}>HISTORY</p>
      <div className="flex gap-1 justify-center flex-wrap">
        {entries.map(({ round, hostTile, guestTile, outcome }) => {
          const myTile = myRole === 'host' ? hostTile : guestTile;
          const oppTile = myRole === 'host' ? guestTile : hostTile;
          const won = outcome === myRole;
          const draw = outcome === 'draw';
          return (
            <div
              key={round}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded text-xs"
              style={{
                background: '#0f0f1a',
                border: `1px solid ${won ? '#00e5ff33' : draw ? '#ffd70033' : '#ff2d5533'}`,
              }}
            >
              <span style={{ color: '#444' }}>R{round}</span>
              <span style={{ color: won ? '#00e5ff' : draw ? '#ffd700' : '#ff2d55' }}>
                {won ? '勝' : draw ? '引' : '負'}
              </span>
              <span style={{ color: '#666' }}>
                {myTile}<span style={{ color: '#333' }}>vs</span>{oppTile}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
