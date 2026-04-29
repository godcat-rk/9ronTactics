import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { subscribeToRoom, submitTile, requestRematch } from '../lib/roomService';
import { ensureAuth } from '../lib/firebase';
import { joinRoom } from '../lib/roomService';
import { getGameWinner, isOdd, TOTAL_ROUNDS, countScores } from '../lib/gameLogic';
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
  const [copiedId, setCopiedId] = useState(false);
  const [arenaPhase, setArenaPhase] = useState<ArenaPhase>('active');
  const [revealSnapshot, setRevealSnapshot] = useState<RevealSnapshot | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
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

  // 再戦でゲームがリセットされたらローカル状態をクリア
  useEffect(() => {
    if (room?.status === 'playing' && !room?.rematch) {
      setRematchRequested(false);
      setSubmitted(false);
      selectTile(null);
      lastCompletedKeyRef.current = '';
    }
  }, [room?.status, room?.rematch]);

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
    }, 1700);

    const resultTimer = window.setTimeout(() => {
      setArenaPhase('result');
      const { outcome } = latestCompleted.round;
      if (outcome === myRole) playWin();
      else if (outcome === 'draw') playDraw();
      else playLose();
    }, 2800);

    const clearTimer = window.setTimeout(() => {
      setRevealSnapshot(null);
      setArenaPhase('active');
      setSubmitted(false);
      selectTile(null);
    }, 4600);

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

  const copyRoomId = useCallback(() => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }, [roomId]);

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

  // アニメーション中は対象ラウンドの結果をマスク（MatchProgress・トークン表示のフライングを防ぐ）
  const displayRounds = (arenaPhase !== 'active' && revealSnapshot)
    ? {
        ...rounds,
        [revealSnapshot.roundNumber]: { ...rounds[revealSnapshot.roundNumber], outcome: null as null },
      }
    : rounds;
  const displayScores = (arenaPhase !== 'active' && revealSnapshot)
    ? countScores(displayRounds)
    : room.scores;

  const usedTiles = Object.values(displayRounds)
    .filter((r) => r.outcome != null)
    .map((r) => (myRole === 'host' ? r.hostTile : r.guestTile))
    .filter((t): t is Tile => t != null);
  const opponentSubmittedTiles = Object.values(displayRounds)
    .filter((r) => r.outcome != null)
    .map((r) => (myRole === 'host' ? r.guestTile : r.hostTile))
    .filter((t): t is Tile => t != null);
  const opponentOddUsed = opponentSubmittedTiles.filter(isOdd).length;
  const opponentEvenUsed = opponentSubmittedTiles.length - opponentOddUsed;
  const opponentOddRemaining = Math.max(0, 5 - opponentOddUsed);
  const opponentEvenRemaining = Math.max(0, 4 - opponentEvenUsed);

  const currentRoundData = rounds[room.currentRound] ?? null;
  const arenaRound = revealSnapshot?.round ?? currentRoundData;
  const arenaRoundNumber = revealSnapshot?.roundNumber ?? room.currentRound;
  // getGameWinner が null を返す場合（引き分けラウンドで played < totalRounds になるケース）はスコア直比較で補完
  const winner = (() => {
    if (room.status !== 'finished') return null;
    const w = getGameWinner(room.scores, TOTAL_ROUNDS);
    if (w !== null) return w;
    if (room.scores.host > room.scores.guest) return 'host' as const;
    if (room.scores.guest > room.scores.host) return 'guest' as const;
    return 'draw' as const;
  })();
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
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg font-bold neon-text-cyan tracking-widest">{roomId}</p>
            <button
              onClick={copyRoomId}
              className="px-3 py-1 rounded text-xs tracking-widest transition-all hover:scale-105"
              style={{
                background: 'transparent',
                border: '1px solid #00e5ff55',
                color: copiedId ? '#00e5ff' : '#555',
              }}
            >
              {copiedId ? 'コピー済み' : 'IDコピー'}
            </button>
          </div>
          <p className="text-[10px]" style={{ color: '#333' }}>またはホーム画面でID入力</p>
        </div>
      </div>
    );
  }

  // Game finished
  if (room.status === 'finished' && !revealSnapshot) {
    const oppRole = myRole === 'host' ? 'guest' : 'host';
    const iRequestedRematch = room.rematch?.[myRole!] ?? false;
    const oppRequestedRematch = room.rematch?.[oppRole] ?? false;

    async function handleRematch() {
      if (!roomId || !myRole) return;
      setRematchRequested(true);
      await requestRematch(roomId, myRole);
    }

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

        <div className="flex flex-col items-center gap-2 mt-2">
          {!iRequestedRematch ? (
            <button
              onClick={handleRematch}
              disabled={rematchRequested}
              className="px-8 py-3 rounded font-bold tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'transparent',
                border: '1px solid #ffd700',
                color: '#ffd700',
                boxShadow: '0 0 12px rgba(255,215,0,0.3)',
              }}
            >
              再戦する
            </button>
          ) : (
            <p className="text-sm tracking-widest animate-pulse" style={{ color: '#ffd700' }}>
              {oppRequestedRematch ? '再戦開始…' : '相手の返答待ち…'}
            </p>
          )}
          {!iRequestedRematch && oppRequestedRematch && (
            <p className="text-xs tracking-widest" style={{ color: '#00e5ff' }}>
              相手が再戦を希望しています
            </p>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 rounded text-sm tracking-widest"
          style={{ border: '1px solid #333', color: '#555' }}
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

      <MatchProgress rounds={displayRounds} currentRound={room.currentRound} myRole={myRole!} />

      <ScoreBoard scores={displayScores} myRole={myRole!} />

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
