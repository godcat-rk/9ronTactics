import { ref, set, update, get, onValue, off } from 'firebase/database';
import { db } from './firebase';
import type { GameRoom, PlayerRole, Tile } from '../types/game';
import { judgeRound, TOTAL_ROUNDS } from './gameLogic';

function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createRoom(hostId: string): Promise<string> {
  let roomId = generateRoomId();
  const room: GameRoom = {
    hostId,
    guestId: null,
    status: 'waiting',
    currentRound: 1,
    firstPlayer: 'host',
    rounds: {},
    scores: { host: 0, guest: 0 },
  };
  await set(ref(db, `rooms/${roomId}`), room);
  return roomId;
}

export async function joinRoom(roomId: string, guestId: string): Promise<boolean> {
  const snap = await get(ref(db, `rooms/${roomId}`));
  if (!snap.exists()) return false;
  const room = snap.val() as GameRoom;
  if (room.status !== 'waiting' || room.guestId) return false;
  await update(ref(db, `rooms/${roomId}`), { guestId, status: 'playing' });
  return true;
}

export async function submitTile(
  roomId: string,
  role: PlayerRole,
  tile: Tile,
  currentRound: number
): Promise<void> {
  const field = role === 'host' ? 'hostTile' : 'guestTile';
  await update(ref(db, `rooms/${roomId}/rounds/${currentRound}`), { [field]: tile });

  // Check if both tiles submitted; if so, compute outcome
  const snap = await get(ref(db, `rooms/${roomId}/rounds/${currentRound}`));
  const roundData = snap.val();
  if (roundData?.hostTile != null && roundData?.guestTile != null && roundData?.outcome == null) {
    const outcome = judgeRound(roundData.hostTile, roundData.guestTile);

    const scoresSnap = await get(ref(db, `rooms/${roomId}/scores`));
    const scores = scoresSnap.val() as { host: number; guest: number };
    const newScores = { ...scores };
    if (outcome === 'host') newScores.host++;
    else if (outcome === 'guest') newScores.guest++;

    const nextRound = currentRound + 1;
    const nextFirst = outcome === 'draw'
      ? (await get(ref(db, `rooms/${roomId}/firstPlayer`))).val()
      : outcome;

    const isFinished = nextRound > TOTAL_ROUNDS ||
      newScores.host > TOTAL_ROUNDS / 2 ||
      newScores.guest > TOTAL_ROUNDS / 2;

    await update(ref(db, `rooms/${roomId}`), {
      [`rounds/${currentRound}/outcome`]: outcome,
      scores: newScores,
      currentRound: isFinished ? currentRound : nextRound,
      firstPlayer: nextFirst,
      status: isFinished ? 'finished' : 'playing',
    });
  }
}

export async function requestRematch(roomId: string, role: PlayerRole): Promise<void> {
  await update(ref(db, `rooms/${roomId}/rematch`), { [role]: true });

  const snap = await get(ref(db, `rooms/${roomId}/rematch`));
  const rematch = snap.val() ?? {};
  if (rematch.host && rematch.guest) {
    await update(ref(db, `rooms/${roomId}`), {
      status: 'playing',
      currentRound: 1,
      rounds: null,
      scores: { host: 0, guest: 0 },
      firstPlayer: 'host',
      rematch: null,
    });
  }
}

export function subscribeToRoom(
  roomId: string,
  callback: (room: GameRoom | null) => void
): () => void {
  const roomRef = ref(db, `rooms/${roomId}`);
  const handler = (snap: any) => {
    callback(snap.exists() ? (snap.val() as GameRoom) : null);
  };
  onValue(roomRef, handler);
  return () => off(roomRef, 'value', handler);
}
