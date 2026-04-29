import type { Tile, RoundOutcome, RoundRecord } from '../types/game';

export function judgeRound(hostTile: Tile, guestTile: Tile): RoundOutcome {
  if (hostTile === 1 && guestTile === 9) return 'host';
  if (guestTile === 1 && hostTile === 9) return 'guest';
  if (hostTile === guestTile) return 'draw';
  return hostTile > guestTile ? 'host' : 'guest';
}

export function countScores(rounds: Record<number, RoundRecord>): { host: number; guest: number } {
  let host = 0;
  let guest = 0;
  for (const r of Object.values(rounds)) {
    if (r.outcome === 'host') host++;
    else if (r.outcome === 'guest') guest++;
  }
  return { host, guest };
}

export function getGameWinner(
  scores: { host: number; guest: number },
  totalRounds: number
): 'host' | 'guest' | 'draw' | null {
  if (scores.host > totalRounds / 2) return 'host';
  if (scores.guest > totalRounds / 2) return 'guest';
  const played = scores.host + scores.guest;
  if (played === totalRounds) {
    if (scores.host > scores.guest) return 'host';
    if (scores.guest > scores.host) return 'guest';
    return 'draw';
  }
  return null;
}

export function isOdd(tile: Tile): boolean {
  return tile % 2 !== 0;
}

export const ALL_TILES: Tile[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const TOTAL_ROUNDS = 9;
