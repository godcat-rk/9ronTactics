import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { subscribeToRoom, submitTile } from '../lib/roomService';
import { ensureAuth } from '../lib/firebase';
import { joinRoom } from '../lib/roomService';
import { getGameWinner, TOTAL_ROUNDS } from '../lib/gameLogic';
import { TileHand } from '../components/TileHand';
import { Arena } from '../components/Arena';
import { RoundHistory } from '../components/RoundHistory';
import { ScoreBoard } from '../components/ScoreBoard';
import type { Tile } from '../types/game';

export function Game() {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    roomId, myRole, room, selectedTile, submitted,
    setRoom, setRoomId, setMyRole, setMyUid, selectTile, setSubmitted,
  } = useGameStore();

  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [prevRound, setPrevRound] = useState(0);

  // Handle direct URL visit (guest joining via link)
  useEffect(() => {
    if (!urlRoomId) return;
    if (roomId) return; // already in store

    (async () => {
      const uid = await ensureAuth();
      setMyUid(uid);
      setRoomId(urlRoomId);
      // Try joining as guest
      const ok = await joinRoom(urlRoomId, uid);
      setMyRole(ok ? 'guest' : 'host'); // fallback: might be host reconnecting
    })();
  }, [urlRoomId]);

  // Subscribe to room updates
  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToRoom(roomId, setRoom);
    return unsub;
  }, [roomId]);

  // Reveal animation when round advances
  useEffect(() => {
    if (!room) return;
    if (room.currentRound !== prevRound && prevRound !== 0) {
      setRevealed(true);
      setSubmitted(false);
      selectTile(null as unknown as Tile);
      setTimeout(() => setRevealed(false), 2000);
    }
    setPrevRound(room.currentRound);
  }, [room?.currentRound]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  async function handleSubmit() {
    if (!selectedTile || !myRole || !roomId || !room) return;
    setSubmitted(true);
    await submitTile(roomId, myRole, selectedTile, room.currentRound);
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="animate-pulse-neon neon-text-gold">接続中…</p>
      </div>
    );
  }

  const rounds = room.rounds ?? {};
  const usedTiles = Object.values(rounds)
    .filter((r) => r.outcome != null)
    .map((r) => (myRole === 'host' ? r.hostTile : r.guestTile))
    .filter((t): t is Tile => t != null);

  const currentRoundData = rounds[room.currentRound] ?? null;
  const winner = room.status === 'finished' ? getGameWinner(room.scores, TOTAL_ROUNDS) : null;
  const iWon = winner === myRole;
  const isDraw = winner === 'draw';

  // Waiting for guest
  if (room.status === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <div className="text-5xl animate-dragon-glow">龍</div>
        <h2 className="text-xl neon-text-gold tracking-widest">対戦相手を待っています</h2>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs" style={{ color: '#666' }}>このURLを相手に送ってください</p>
          <button
            onClick={copyLink}
            className="px-6 py-2 rounded text-sm tracking-widest transition-all hover:scale-105"
            style={{
              background: 'transparent',
              border: '1px solid #ffd700',
              color: '#ffd700',
              boxShadow: '0 0 8px rgba(255,215,0,0.2)',
            }}
          >
            {copied ? 'コピーしました！' : 'URLをコピー'}
          </button>
          <p className="text-lg font-bold neon-text-cyan tracking-widest">{roomId}</p>
        </div>
      </div>
    );
  }

  // Game finished
  if (room.status === 'finished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <div className="text-6xl animate-dragon-glow">龍</div>
        <h2 className="text-3xl font-bold tracking-widest"
          style={{ color: iWon ? '#00e5ff' : isDraw ? '#ffd700' : '#ff2d55',
            textShadow: `0 0 20px ${iWon ? '#00e5ff' : isDraw ? '#ffd700' : '#ff2d55'}` }}>
          {iWon ? '勝利！' : isDraw ? '引き分け' : '敗北'}
        </h2>
        <ScoreBoard scores={room.scores} myRole={myRole!} />
        <RoundHistory rounds={room.rounds} myRole={myRole!} />
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 rounded text-sm tracking-widest"
          style={{ border: '1px solid #444', color: '#888' }}
        >
          ホームへ戻る
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 p-4 pt-8"
      style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%)' }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl animate-dragon-glow">龍</span>
        <span className="text-lg font-bold tracking-widest neon-text-red" style={{ fontFamily: 'serif' }}>
          九龍戦術
        </span>
        <span className="text-xs px-2 py-0.5 rounded" style={{ border: '1px solid #2a2a3a', color: '#444' }}>
          {roomId}
        </span>
      </div>

      <ScoreBoard scores={room.scores} myRole={myRole!} />

      <Arena
        round={currentRoundData}
        currentRound={room.currentRound}
        myRole={myRole!}
        revealed={revealed}
      />

      <TileHand
        usedTiles={usedTiles}
        selectedTile={selectedTile}
        submitted={submitted}
        onSelect={selectTile}
      />

      {!submitted && selectedTile && (
        <button
          onClick={handleSubmit}
          className="px-8 py-3 rounded font-bold tracking-widest text-sm uppercase transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'transparent',
            border: '1px solid #ff2d55',
            color: '#ff2d55',
            boxShadow: '0 0 12px rgba(255,45,85,0.4)',
          }}
        >
          {selectedTile} を出す
        </button>
      )}

      <RoundHistory rounds={room.rounds} myRole={myRole!} />
    </div>
  );
}
