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
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 p-6">

      {/* Title block */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="animate-dragon-glow"
          style={{ fontSize: 96, lineHeight: 1, fontFamily: 'serif' }}
        >
          龍
        </div>
        <h1
          className="font-black tracking-widest"
          style={{
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 56,
            color: '#C41830',
            textShadow: '0 0 20px rgba(196,24,48,0.6), 0 0 50px rgba(196,24,48,0.25)',
            letterSpacing: '0.18em',
          }}
        >
          九龍戦術
        </h1>
        <p
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 13,
            letterSpacing: '0.35em',
            color: '#5C4008',
          }}
        >
          KOWLOON  TACTICAL
        </p>
      </div>

      {/* Main panel */}
      <div
        className="panel-ornate flex flex-col items-center gap-5 w-full"
        style={{ maxWidth: 420, padding: '2.5rem 2rem' }}
      >
        {/* Create */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full transition-all hover:scale-105 active:scale-95"
          style={{
            padding: '14px 0',
            background: 'transparent',
            border: '2px solid #C41830',
            color: '#C41830',
            boxShadow: '0 0 16px rgba(196,24,48,0.3), inset 0 0 16px rgba(196,24,48,0.04)',
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.2em',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? '…' : '対戦ルームを作成'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full">
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #3A2808)' }} />
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#3A2808', letterSpacing: '0.2em' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #3A2808)' }} />
        </div>

        {/* Join */}
        <div className="flex gap-3 w-full">
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            maxLength={6}
            style={{
              flex: 1,
              padding: '12px 14px',
              background: '#09070E',
              border: '1px solid #3A2808',
              color: '#3EA878',
              fontFamily: "'Cinzel', serif",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '0.25em',
              textAlign: 'center',
              outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#C89614'; e.currentTarget.style.boxShadow = '0 0 10px rgba(200,150,20,0.2)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#3A2808'; e.currentTarget.style.boxShadow = 'none'; }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <button
            onClick={handleJoin}
            disabled={loading || !joinCode.trim()}
            className="transition-all hover:scale-105 active:scale-95"
            style={{
              padding: '12px 22px',
              background: 'transparent',
              border: '2px solid #C89614',
              color: '#C89614',
              boxShadow: '0 0 12px rgba(200,150,20,0.25)',
              fontFamily: "'Noto Serif JP', serif",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.15em',
              cursor: (loading || !joinCode.trim()) ? 'not-allowed' : 'pointer',
              opacity: (loading || !joinCode.trim()) ? 0.45 : 1,
            }}
          >
            参加
          </button>
        </div>

        {error && (
          <p style={{ color: '#C41830', fontSize: 13, textShadow: '0 0 8px rgba(196,24,48,0.5)' }}>
            {error}
          </p>
        )}
      </div>

      {/* Rule summary */}
      <div
        className="panel-ornate w-full"
        style={{
          maxWidth: 420,
          padding: '1.5rem 2rem',
          fontFamily: "'Noto Serif JP', serif",
        }}
      >
        <p
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 11,
            letterSpacing: '0.35em',
            color: '#C89614',
            textAlign: 'center',
            marginBottom: '1rem',
          }}
        >
          — HOW TO PLAY —
        </p>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          {([
            ['', '相手より大きい数字を出したら勝ちだよ！'],
            ['', '相手の出した数字は不明で、勝敗だけわかるよ！'],
            ['', '１は９に勝てるよ！９を出してくるタイミングを読んで大逆転できるよ！'],
            ['', '全部で９ラウンドあるよ！勝ちラウンドが多かったプレイヤーが勝利するよ！'],
            ['', 'バグを見つけたらねこまで連絡してね！'],
          ] as [string, string][]).map(([icon, text], i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                fontSize: 13,
                color: i === 4 ? '#5C4008' : '#A08040',
                lineHeight: 1.7,
              }}
            >
              <span style={{ flexShrink: 0 }}>{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
