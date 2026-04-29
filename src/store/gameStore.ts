import { create } from 'zustand';
import type { GameRoom, PlayerRole, Tile } from '../types/game';

interface GameState {
  roomId: string | null;
  myRole: PlayerRole | null;
  myUid: string | null;
  room: GameRoom | null;
  selectedTile: Tile | null;
  submitted: boolean;
  setRoom: (room: GameRoom | null) => void;
  setRoomId: (id: string) => void;
  setMyRole: (role: PlayerRole) => void;
  setMyUid: (uid: string) => void;
  selectTile: (tile: Tile) => void;
  setSubmitted: (v: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  roomId: null,
  myRole: null,
  myUid: null,
  room: null,
  selectedTile: null,
  submitted: false,
  setRoom: (room) => set({ room }),
  setRoomId: (roomId) => set({ roomId }),
  setMyRole: (myRole) => set({ myRole }),
  setMyUid: (myUid) => set({ myUid }),
  selectTile: (selectedTile) => set({ selectedTile }),
  setSubmitted: (submitted) => set({ submitted }),
  reset: () => set({ roomId: null, myRole: null, room: null, selectedTile: null, submitted: false }),
}));
