import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { subscribeToRoom, submitTile } from '../lib/roomService';
import { ensureAuth } from '../lib/firebase';
import { joinRoom } from '../lib/roomService';
import { getGameWinner, isOdd, TOTAL_ROUNDS } from '../lib/gameLogic';
import { playSuspenseTicks, playReveal, playWin, playLose, playDraw } from '../lib/sounds';
import { TileHand } from '../components/TileHand';
import { Arena } from '../components/Arena';
import { MatchProgress } from '../components/MatchProgress';
import { ScoreBoard } from '../components/ScoreBoard';
import { OpponentColorStock } from '../components/OpponentColorStock';
import type { RoundRecord, Tile } from '../types/game';

type ArenaPhase = 'active' | 'suspense' | 'colors' | 'result';

interface RevealSnapshot {
  roundNumber: number;
  round: RoundRecord;
}

export function Game() {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    roomId, myRole, room, selectedTile, submitted,
    setRoom, setRoomId, setMyRole, setMyUid, selectTile, setSubmitted,
  } = useGameStore();

  const [copied, setCopied] = useState(false);
  const [arenaPhase, setArenaPhase] = useState<ArenaPhase>('active');
  const [revealSnapshot, setRevealSnapshot] = useState<RevealSnapshot | null>(null);
  const lastCompletedKeyRef = useRef<string | null>(null);

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

  // Keep the completed round on screen long enough to show color first, then result.
  useEffect(() => {
    if (!room) return;
    const latestCompleted = Object.entries(room.rounds ?? {})
      .map(([k, v]) => ({ roundNumber: Number(k), round: v }))
      .filter(({ round }) => round.outcome != null)
      .sort((a, b) => b.roundNumber - a.roundNumber)[0];

    if (!latestCompleted) {
      if (lastCompletedKeyRef.current === null) {
        lastCompletedKeyRef.current = '';
      }
      return;
    }

    const { roundNumber, round } = latestCompleted;
    const completedKey = `${roundNumber}:${round.hostTile}:${round.guestTile}:${round.outcome}`;
    if (lastCompletedKeyRef.current === null) {
      lastCompletedKeyRef.current = completedKey;
      return;
    }
    if (lastCompletedKeyRef.current === completedKey) return;

    lastCompletedKeyRef.current = completedKey;
    setRevealSnapshot(latestCompleted);
    setArenaPhase('suspense');
    setSubmitted(false);
    selectTile(null);
    playSuspenseTicks();

    const colorsTimer = window.setTimeout(() => {
      setArenaPhase('colors');
      playReveal();
    }, 1400);

    const resultTimer = window.setTimeout(() => {
      setArenaPhase('result');
      const { outcome } = latestCompleted.round;
      if (outcome === myRole) playWin();
      else if (outcome === 'draw') playDraw();
      else playLose();
    }, 2400);

    const clearTimer = window.setTimeout(() => {
      setRevealSnapshot(null);
      setArenaPhase('active');
      setSubmitted(false);
      selectTile(null);
    }, 4200);

    return () => {
      window.clearTimeout(colorsTimer);
      window.clearTimeout(resultTimer);
      window.clearTimeout(clearTimer);
    };
  }, [room, selectTile, setSubmitted]);

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
  const opponentSubmittedTiles = Object.values(rounds)
    .map((r) => (myRole === 'host' ? r.guestTile : r.hostTile))
    .filter((t): t is Tile => t != null);
  const opponentOddUsed = opponentSubmittedTiles.filter(isOdd).length;
  const opponentEvenUsed = opponentSubmittedTiles.length - opponentOddUsed;
  const opponentOddRemaining = Math.max(0, 5 - opponentOddUsed);
  const opponentEvenRemaining = Math.max(0, 4 - opponentEvenUsed);

  const currentRoundData = rounds[room.currentRound] ?? null;
  const arenaRound = revealSnapshot?.round ?? currentRoundData;
  const arenaRoundNumber = revealSnapshot?.roundNumber ?? room.currentRound;
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
  if (room.status === 'finished' && !revealSnapshot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <div className="text-6xl animate-dragon-glow">龍</div>
        <h2 className="text-3xl font-bold tracking-widest"
          style={{ color: iWon ? '#ffd700' : isDraw ? '#888888' : '#bf44ff',
            textShadow: `0 0 20px ${iWon ? '#ffd700' : isDraw ? '#888888' : '#bf44ff'}` }}>
          {iWon ? '勝利！' : isDraw ? '引き分け' : '敗北'}
        </h2>
        <ScoreBoard scores={room.scores} myRole={myRole!} />
        <MatchProgress rounds={room.rounds ?? {}} currentRound={room.currentRound} myRole={myRole!} isFinished />
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
    <div className="min-h-screen flex flex-col items-center gap-6 p-4 pt-8">

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

      <MatchProgress rounds={rounds} currentRound={room.currentRound} myRole={myRole!} />

      <ScoreBoard scores={room.scores} myRole={myRole!} />

      <OpponentColorStock
        oddRemaining={opponentOddRemaining}
        evenRemaining={opponentEvenRemaining}
      />

      <Arena
        round={arenaRound}
        currentRound={arenaRoundNumber}
        myRole={myRole!}
        phase={arenaPhase}
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

    </div>
  );
}
