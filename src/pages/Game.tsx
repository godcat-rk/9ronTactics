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

  const [copied, setCopied]                     = useState(false);
  const [copiedId, setCopiedId]                 = useState(false);
  const [arenaPhase, setArenaPhase]             = useState<ArenaPhase>('active');
  const [revealSnapshot, setRevealSnapshot]     = useState<RevealSnapshot | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const lastCompletedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!urlRoomId) return;
    if (roomId) return;
    (async () => {
      const uid = await ensureAuth();
      setMyUid(uid);
      setRoomId(urlRoomId);
      const ok = await joinRoom(urlRoomId, uid);
      setMyRole(ok ? 'guest' : 'host');
    })();
  }, [urlRoomId]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToRoom(roomId, setRoom);
    return unsub;
  }, [roomId]);

  useEffect(() => {
    if (room?.status === 'playing' && !room?.rematch) {
      setRematchRequested(false);
      setSubmitted(false);
      selectTile(null);
      lastCompletedKeyRef.current = '';
    }
  }, [room?.status, room?.rematch]);

  useEffect(() => {
    if (!room) return;
    const latestCompleted = Object.entries(room.rounds ?? {})
      .map(([k, v]) => ({ roundNumber: Number(k), round: v }))
      .filter(({ round }) => round.outcome != null)
      .sort((a, b) => b.roundNumber - a.roundNumber)[0];

    if (!latestCompleted) {
      if (lastCompletedKeyRef.current === null) lastCompletedKeyRef.current = '';
      return;
    }

    const { roundNumber, round } = latestCompleted;
    const completedKey = `${roundNumber}:${round.hostTile}:${round.guestTile}:${round.outcome}`;
    if (lastCompletedKeyRef.current === null) { lastCompletedKeyRef.current = completedKey; return; }
    if (lastCompletedKeyRef.current === completedKey) return;

    lastCompletedKeyRef.current = completedKey;
    setRevealSnapshot(latestCompleted);
    setArenaPhase('suspense');
    setSubmitted(false);
    selectTile(null);
    playSuspenseTicks();

    const colorsTimer = window.setTimeout(() => { setArenaPhase('colors'); playReveal(); }, 1700);
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
        <p className="animate-pulse-neon" style={{ color: '#C89614', fontFamily: "'Noto Serif JP', serif", fontSize: 16, letterSpacing: '0.15em' }}>
          接続中…
        </p>
      </div>
    );
  }

  const rounds = room.rounds ?? {};
  const displayRounds = (arenaPhase !== 'active' && revealSnapshot)
    ? { ...rounds, [revealSnapshot.roundNumber]: { ...rounds[revealSnapshot.roundNumber], outcome: null as null } }
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
  const opponentOddUsed       = opponentSubmittedTiles.filter(isOdd).length;
  const opponentEvenUsed      = opponentSubmittedTiles.length - opponentOddUsed;
  const opponentOddRemaining  = Math.max(0, 5 - opponentOddUsed);
  const opponentEvenRemaining = Math.max(0, 4 - opponentEvenUsed);

  const currentRoundData = rounds[room.currentRound] ?? null;
  const arenaRound       = revealSnapshot?.round ?? currentRoundData;
  const arenaRoundNumber = revealSnapshot?.roundNumber ?? room.currentRound;
  const winner = (() => {
    if (room.status !== 'finished') return null;
    const w = getGameWinner(room.scores, TOTAL_ROUNDS);
    if (w !== null) return w;
    if (room.scores.host > room.scores.guest) return 'host' as const;
    if (room.scores.guest > room.scores.host) return 'guest' as const;
    return 'draw' as const;
  })();
  const iWon   = winner === myRole;
  const isDraw = winner === 'draw';

  // ── Waiting screen ───────────────────────────────────────────────
  if (room.status === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
        <div className="animate-dragon-glow" style={{ fontSize: 72, fontFamily: 'serif' }}>龍</div>
        <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, color: '#C89614', textShadow: '0 0 16px rgba(200,150,20,0.5)', letterSpacing: '0.15em' }}>
          対戦相手を待っています
        </h2>

        <div className="panel-ornate flex flex-col items-center gap-4" style={{ padding: '2rem 2.5rem' }}>
          <p style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 13, color: '#5C4008', letterSpacing: '0.05em' }}>
            このURLを相手に送ってください
          </p>
          <button
            onClick={copyLink}
            className="transition-all hover:scale-105"
            style={{
              padding: '12px 28px',
              background: 'transparent',
              border: '2px solid #C89614',
              color: '#C89614',
              boxShadow: '0 0 12px rgba(200,150,20,0.25)',
              fontFamily: "'Noto Serif JP', serif",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.15em',
              cursor: 'pointer',
            }}
          >
            {copied ? 'コピーしました！' : 'URLをコピー'}
          </button>

          <div className="flex items-center gap-3 mt-1">
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: '#3EA878', textShadow: '0 0 10px rgba(62,168,120,0.5)', letterSpacing: '0.2em' }}>
              {roomId}
            </p>
            <button
              onClick={copyRoomId}
              className="transition-all hover:scale-105"
              style={{
                padding: '6px 14px',
                background: 'transparent',
                border: `1px solid ${copiedId ? '#3EA878' : '#2A1E0A'}`,
                color: copiedId ? '#3EA878' : '#3A2808',
                fontFamily: "'Cinzel', serif",
                fontSize: 11,
                letterSpacing: '0.1em',
                cursor: 'pointer',
              }}
            >
              {copiedId ? 'コピー済' : 'IDコピー'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#2A1E0A', fontFamily: "'Noto Serif JP', serif" }}>
            またはホーム画面でID入力
          </p>
        </div>
      </div>
    );
  }

  // ── Result screen ────────────────────────────────────────────────
  if (room.status === 'finished' && !revealSnapshot) {
    const oppRole             = myRole === 'host' ? 'guest' : 'host';
    const iRequestedRematch   = room.rematch?.[myRole!] ?? false;
    const oppRequestedRematch = room.rematch?.[oppRole] ?? false;

    async function handleRematch() {
      if (!roomId || !myRole) return;
      setRematchRequested(true);
      await requestRematch(roomId, myRole);
    }

    const resultColor = iWon ? '#C89614' : isDraw ? '#6A6050' : '#7B44CC';
    const resultText  = iWon ? '勝利' : isDraw ? '引き分け' : '敗北';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-7 p-6">
        <div className="animate-dragon-glow" style={{ fontSize: 64, fontFamily: 'serif' }}>龍</div>

        <h2
          style={{
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 40,
            fontWeight: 900,
            color: resultColor,
            textShadow: `0 0 24px ${resultColor}, 0 0 60px ${resultColor}55`,
            letterSpacing: '0.15em',
          }}
        >
          {resultText}
        </h2>

        <div className="panel-ornate flex flex-col items-center gap-6" style={{ padding: '2rem 2.5rem', width: '100%', maxWidth: 500 }}>
          <ScoreBoard scores={room.scores} myRole={myRole!} />
          <MatchProgress rounds={room.rounds ?? {}} currentRound={room.currentRound} myRole={myRole!} isFinished />
        </div>

        <div className="flex flex-col items-center gap-3 mt-1">
          {!iRequestedRematch ? (
            <button
              onClick={handleRematch}
              disabled={rematchRequested}
              className="transition-all hover:scale-105 active:scale-95"
              style={{
                padding: '14px 36px',
                background: 'transparent',
                border: '2px solid #C89614',
                color: '#C89614',
                boxShadow: '0 0 16px rgba(200,150,20,0.3)',
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.2em',
                cursor: 'pointer',
              }}
            >
              再戦する
            </button>
          ) : (
            <p className="animate-pulse-neon" style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 14, color: '#C89614', letterSpacing: '0.1em' }}>
              {oppRequestedRematch ? '再戦開始…' : '相手の返答待ち…'}
            </p>
          )}
          {!iRequestedRematch && oppRequestedRematch && (
            <p style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 12, color: '#3EA878', letterSpacing: '0.08em' }}>
              相手が再戦を希望しています
            </p>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="transition-all hover:opacity-70"
          style={{
            padding: '10px 24px',
            background: 'transparent',
            border: '1px solid #2A1E0A',
            color: '#3A2808',
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 13,
            letterSpacing: '0.1em',
            cursor: 'pointer',
          }}
        >
          ホームへ戻る
        </button>
      </div>
    );
  }

  // ── Game screen ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center gap-6 p-4 pt-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="animate-dragon-glow" style={{ fontSize: 26, fontFamily: 'serif' }}>龍</span>
        <span style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 700, color: '#C41830', textShadow: '0 0 12px rgba(196,24,48,0.5)', letterSpacing: '0.15em' }}>
          九龍戦術
        </span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, padding: '3px 10px', border: '1px solid #2A1E0A', color: '#3A2808', letterSpacing: '0.15em' }}>
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
          className="transition-all hover:scale-105 active:scale-95"
          style={{
            padding: '14px 36px',
            background: 'transparent',
            border: '2px solid #C41830',
            color: '#C41830',
            boxShadow: '0 0 16px rgba(196,24,48,0.4)',
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.2em',
            cursor: 'pointer',
          }}
        >
          {selectedTile} を出す
        </button>
      )}

    </div>
  );
}
