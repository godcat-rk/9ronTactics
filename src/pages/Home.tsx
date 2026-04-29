import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ensureAuth } from '../lib/firebase';
import { createRoom, joinRoom } from '../lib/roomService';
import { useGameStore } from '../store/gameStore';

export function Home() {
  const navigate = useNavigate();
  const { setRoomId, setMyRole, setMyUid } = useGameStore();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    setLoading(true);
    setError('');
    try {
      const uid = await ensureAuth();
      const roomId = await createRoom(uid);
      setMyUid(uid);
      setRoomId(roomId);
      setMyRole('host');
      navigate(`/room/${roomId}`);
    } catch {
      setError('ルーム作成に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const uid = await ensureAuth();
      const code = joinCode.trim().toUpperCase();
      const ok = await joinRoom(code, uid);
      if (!ok) {
        setError('ルームが見つからないか、すでに満員です');
        return;
      }
      setMyUid(uid);
      setRoomId(code);
      setMyRole('guest');
      navigate(`/room/${code}`);
    } catch {
      setError('参加に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-4">

      {/* Title */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-8xl animate-dragon-glow">龍</div>
        <h1 className="text-5xl font-bold tracking-widest neon-text-red" style={{ fontFamily: 'serif' }}>
          九龍戦術
        </h1>
        <p className="text-base tracking-widest" style={{ color: '#666' }}>
          KOWLOON TACTICAL
        </p>
      </div>

      {/* Create room */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm">
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-3 rounded font-bold tracking-widest text-sm uppercase transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'transparent',
            border: '1px solid #ff2d55',
            color: '#ff2d55',
            boxShadow: '0 0 12px rgba(255,45,85,0.3)',
          }}
        >
          {loading ? '…' : '対戦ルームを作成'}
        </button>

        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-px" style={{ background: '#2a2a3a' }} />
          <span className="text-xs" style={{ color: '#444' }}>OR</span>
          <div className="flex-1 h-px" style={{ background: '#2a2a3a' }} />
        </div>

        {/* Join room */}
        <div className="flex gap-2 w-full">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            maxLength={6}
            className="flex-1 px-3 py-2 rounded text-sm text-center tracking-widest font-bold uppercase"
            style={{
              background: '#0f0f1a',
              border: '1px solid #2a2a3a',
              color: '#00e5ff',
              outline: 'none',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <button
            onClick={handleJoin}
            disabled={loading || !joinCode.trim()}
            className="px-4 py-2 rounded font-bold text-sm tracking-widest transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'transparent',
              border: '1px solid #00e5ff',
              color: '#00e5ff',
              boxShadow: '0 0 8px rgba(0,229,255,0.2)',
            }}
          >
            参加
          </button>
        </div>

        {error && (
          <p className="text-xs neon-text-red">{error}</p>
        )}
      </div>

      {/* Rule summary */}
      <div className="w-full max-w-sm" style={{ border: '1px solid #1e1e2e', padding: '1rem 1.25rem' }}>
        <p className="text-xs tracking-widest text-center mb-3" style={{ color: '#555' }}>HOW TO PLAY</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            '相手より大きい数字を出したら勝ちだよ！',
            '相手の出した数字は不明で、勝敗だけわかるよ！',
            '１は９に勝てるよ！９を出してくるタイミングを読んで大逆転できるよ！',
            '全部で９ラウンドあるよ！勝ちラウンドが多かったプレイヤーが勝利するよ！',
            'バグを見つけたらねこまで連絡してね！',
          ].map((text, i) => (
            <li key={i} style={{ fontSize: '11px', color: i === 4 ? '#444' : '#666', lineHeight: 1.7 }}>
              · {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
