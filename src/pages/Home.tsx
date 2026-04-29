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
    } catch (e) {
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
    } catch (e) {
      setError('参加に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-4"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0a1a 50%, #0a0f0f 100%)' }}>

      {/* Title */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-6xl animate-dragon-glow">龍</div>
        <h1 className="text-4xl font-bold tracking-widest neon-text-red" style={{ fontFamily: 'serif' }}>
          九龍戦術
        </h1>
        <p className="text-sm tracking-widest" style={{ color: '#666' }}>
          KOWLOON TACTICAL
        </p>
      </div>

      {/* Create room */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
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
      <div className="max-w-xs text-center" style={{ color: '#444', fontSize: '11px', lineHeight: 1.8 }}>
        <p>1〜9のタイルで9ラウンド対決</p>
        <p>大きい数が勝ち　※ <span style={{ color: '#ffd700' }}>1は9に勝つ</span></p>
        <p>相手の手札は非公開</p>
      </div>
    </div>
  );
}
