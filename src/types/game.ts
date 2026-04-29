export type Tile = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type PlayerRole = 'host' | 'guest';

export type RoundOutcome = 'host' | 'guest' | 'draw' | null;

export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface RoundRecord {
  hostTile: Tile | null;
  guestTile: Tile | null;
  outcome: RoundOutcome;
}

export interface GameRoom {
  hostId: string;
  guestId: string | null;
  status: GameStatus;
  currentRound: number;
  firstPlayer: PlayerRole;
  rounds: Record<number, RoundRecord>;
  scores: { host: number; guest: number };
  rematch?: { host?: boolean; guest?: boolean };
}
