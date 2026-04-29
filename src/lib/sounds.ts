let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function note(
  audioCtx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  vol = 0.18,
  type: OscillatorType = 'sine',
) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.01);
}

export function playSuspenseTicks() {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  // 加速するティック: 間隔が徐々に縮まって緊張感を演出
  [0, 0.30, 0.56, 0.78, 0.96, 1.10, 1.20, 1.27, 1.32, 1.36].forEach((t) => {
    note(audioCtx, 880, now + t, 0.06, 0.13, 'square');
  });
}

export function playReveal() {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.start(now);
  osc.stop(now + 0.31);
}

export function playWin() {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  // 昇順ペンタトニック C5 E5 G5 C6
  [523, 659, 784, 1047].forEach((freq, i) => {
    note(audioCtx, freq, now + i * 0.11, 0.35, 0.22, 'sine');
  });
}

export function playLose() {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  // 降順 G4 Eb4 C4
  [392, 311, 261].forEach((freq, i) => {
    note(audioCtx, freq, now + i * 0.14, 0.4, 0.18, 'sine');
  });
}

export function playDraw() {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  note(audioCtx, 440, now, 0.15, 0.14, 'sine');
  note(audioCtx, 440, now + 0.2, 0.15, 0.1, 'sine');
}
