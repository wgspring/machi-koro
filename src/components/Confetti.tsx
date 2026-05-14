import { useEffect, useRef } from 'react';
import './Confetti.css';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  rotV: number;
  color: string;
  shape: 'rect' | 'circle' | 'ribbon';
  life: number;
  maxLife: number;
  alpha: number;
}

const PALETTE_BASE = [
  '#FFC832', '#FF7A45', '#FF4D6D', '#7C3AED',
  '#3B82F6', '#22C55E', '#F472B6', '#FFFFFF',
];

const WINNER_PALETTE: Record<0 | 1, string[]> = {
  0: ['#3B82F6', '#60A5FA', '#FFC832', '#FFFFFF', '#FF7A45'],
  1: ['#FF7A45', '#FFAB6B', '#FFC832', '#FFFFFF', '#FF4D6D'],
};

const GRAVITY = 0.18;
const DRAG = 0.992;
/** 持续模式下,每隔多少 ms 触发一波 */
const BURST_INTERVAL_MS = 900;
/** 在屏幕上的最大粒子数(超过则不再生成新 burst,避免性能崩) */
const MAX_PARTICLES = 800;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface Props {
  /** true=持续放礼花;false=立刻停止并清空画布 */
  active: boolean;
  /** 0/1 控制配色;active=false 时无关 */
  winner: 0 | 1 | null;
}

export default function Confetti({ active, winner }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || winner === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let w = window.innerWidth;
    let h = window.innerHeight;
    const resize = () => {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const palette = [...WINNER_PALETTE[winner], ...PALETTE_BASE];
    const particles: Particle[] = [];

    /** 生成一波礼花;每次随机选一种发射点(左下/右下/顶撒) */
    const spawnRandomBurst = () => {
      if (particles.length >= MAX_PARTICLES) return;
      const variants = [
        // 左下礼炮
        { n: 100, x: 0.05, y: 1.0, baseAngle: -Math.PI / 3,           spread: Math.PI / 4,   speed: 16, jitter: 5 },
        // 右下礼炮
        { n: 100, x: 0.95, y: 1.0, baseAngle: -Math.PI + Math.PI / 3, spread: Math.PI / 4,   speed: 16, jitter: 5 },
        // 中下大礼炮
        { n: 120, x: 0.5,  y: 1.0, baseAngle: -Math.PI / 2,           spread: Math.PI / 3,   speed: 18, jitter: 5 },
        // 顶部撒花
        { n: 70,  x: 0.5,  y: -0.05, baseAngle: Math.PI / 2,          spread: Math.PI / 1.4, speed: 4,  jitter: 3 },
      ];
      const v = pick(variants);
      const cx = v.x * w;
      const cy = v.y * h;
      for (let i = 0; i < v.n; i++) {
        const a = v.baseAngle + rand(-v.spread / 2, v.spread / 2);
        const sp = v.speed + rand(-v.jitter, v.jitter);
        const shape: Particle['shape'] =
          Math.random() < 0.55 ? 'rect' : Math.random() < 0.7 ? 'ribbon' : 'circle';
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          size: rand(5, 11),
          rot: rand(0, Math.PI * 2),
          rotV: rand(-0.3, 0.3),
          color: pick(palette),
          shape,
          life: 0,
          maxLife: Math.floor(rand(160, 260)),
          alpha: 1,
        });
      }
    };

    // 第一波马上放;再加个右下侧应,营造"两声炮响"开局
    spawnRandomBurst();
    spawnRandomBurst();
    let lastBurstAt = performance.now();

    const draw = (now: number) => {
      // 持续触发新波次
      if (now - lastBurstAt >= BURST_INTERVAL_MS) {
        lastBurstAt = now;
        spawnRandomBurst();
      }

      ctx.clearRect(0, 0, w, h);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        p.vy += GRAVITY;
        p.vx *= DRAG;
        p.vy *= DRAG;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotV;
        const fadeAt = p.maxLife * 0.7;
        p.alpha = p.life < fadeAt ? 1 : Math.max(0, 1 - (p.life - fadeAt) / (p.maxLife - fadeAt));
        if (p.life > p.maxLife || p.y - p.size > h) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 'ribbon') {
          ctx.fillRect(-p.size, -p.size / 4, p.size * 2, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, w, h);
    };
  }, [active, winner]);

  return (
    <canvas
      ref={canvasRef}
      className={`confetti ${active && winner !== null ? '' : 'confetti--hidden'}`}
      aria-hidden
    />
  );
}
