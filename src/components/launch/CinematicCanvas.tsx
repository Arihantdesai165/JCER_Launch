import { useEffect, useRef } from "react";
import type { Phase } from "@/lib/launch-phases";

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  drag: number;
  glow: number;
  tx?: number | undefined;
  ty?: number | undefined;
  seek?: boolean | undefined;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function CinematicCanvas({ phase, shake }: { phase: Phase; shake: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef(phase);
  const shakeRef = useRef(shake);
  const phaseStart = useRef(performance.now());

  useEffect(() => {
    phaseRef.current = phase;
    phaseStart.current = performance.now();
  }, [phase]);
  useEffect(() => {
    shakeRef.current = shake;
  }, [shake]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Ambient star / dust field
    const stars = Array.from({ length: 190 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: rand(0.25, 1),
      s: rand(0.5, 1.9),
      tw: Math.random() * Math.PI * 2,
    }));

    const parts: P[] = [];
    const spawn = (p: Partial<P>) => {
      if (parts.length > 2600) return;
      parts.push({
        x: p.x ?? w / 2,
        y: p.y ?? h / 2,
        vx: p.vx ?? 0,
        vy: p.vy ?? 0,
        life: 0,
        maxLife: p.maxLife ?? 1,
        size: p.size ?? 2,
        hue: p.hue ?? 200,
        drag: p.drag ?? 0.985,
        glow: p.glow ?? 1,
        tx: p.tx,
        ty: p.ty,
        seek: p.seek,
      });
    };

    let rocketY = 0;
    let rocketFired = false;
    let burstDone = false;
    let transformDone = false;
    let lastFirework = 0;

    const drawRocket = (cx: number, cy: number, scale: number, thrust: number, t: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      // Flame
      if (thrust > 0) {
        const flick = 1 + Math.sin(t * 0.05) * 0.12 + Math.random() * 0.1;
        const len = 150 * thrust * flick;
        const g = ctx.createLinearGradient(0, 60, 0, 60 + len);
        g.addColorStop(0, "rgba(255,255,255,0.95)");
        g.addColorStop(0.25, "rgba(255,214,140,0.9)");
        g.addColorStop(0.6, "rgba(255,122,26,0.65)");
        g.addColorStop(1, "rgba(255,60,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-24, 58);
        ctx.quadraticCurveTo(-14, 60 + len * 0.6, 0, 60 + len);
        ctx.quadraticCurveTo(14, 60 + len * 0.6, 24, 58);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.moveTo(-8, 58);
        ctx.quadraticCurveTo(0, 60 + len * 0.42, 8, 58);
        ctx.closePath();
        ctx.fill();
      }

      // Body
      ctx.shadowColor = "rgba(120,200,255,0.55)";
      ctx.shadowBlur = 28;
      const body = ctx.createLinearGradient(-30, 0, 30, 0);
      body.addColorStop(0, "#7e8ba3");
      body.addColorStop(0.35, "#eef4ff");
      body.addColorStop(0.65, "#cfe0f5");
      body.addColorStop(1, "#5c6a85");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(0, -120);
      ctx.quadraticCurveTo(30, -60, 30, 10);
      ctx.lineTo(30, 56);
      ctx.lineTo(-30, 56);
      ctx.lineTo(-30, 10);
      ctx.quadraticCurveTo(-30, -60, 0, -120);
      ctx.closePath();
      ctx.fill();

      // Nose cone
      const nose = ctx.createLinearGradient(-24, -120, 24, -40);
      nose.addColorStop(0, "#ff9a4d");
      nose.addColorStop(0.5, "#ff5f2e");
      nose.addColorStop(1, "#c8371a");
      ctx.fillStyle = nose;
      ctx.beginPath();
      ctx.moveTo(0, -122);
      ctx.quadraticCurveTo(26, -70, 26, -36);
      ctx.lineTo(-26, -36);
      ctx.quadraticCurveTo(-26, -70, 0, -122);
      ctx.closePath();
      ctx.fill();

      // Fins
      ctx.fillStyle = "#d4502a";
      ctx.beginPath();
      ctx.moveTo(-30, 8);
      ctx.quadraticCurveTo(-72, 40, -62, 76);
      ctx.lineTo(-30, 56);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(30, 8);
      ctx.quadraticCurveTo(72, 40, 62, 76);
      ctx.lineTo(30, 56);
      ctx.closePath();
      ctx.fill();

      // Window
      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(90,200,255,0.9)";
      const win = ctx.createRadialGradient(-4, -12, 2, 0, -8, 18);
      win.addColorStop(0, "#bff0ff");
      win.addColorStop(1, "#0f4b7a");
      ctx.fillStyle = win;
      ctx.beginPath();
      ctx.arc(0, -8, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#22314a";
      ctx.stroke();

      // Nozzle
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#3b4a63";
      ctx.fillRect(-20, 56, 40, 10);
      ctx.restore();
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const ph = phaseRef.current;
      const el = t - phaseStart.current;
      const cx = w / 2;

      ctx.clearRect(0, 0, w, h);

      const sh = shakeRef.current;
      ctx.save();
      if (sh > 0)
        ctx.translate(rand(-sh, sh), rand(-sh, sh));

      // Stars
      ctx.globalCompositeOperation = "lighter";
      for (const s of stars) {
        s.tw += 0.01 + s.z * 0.01;
        s.y -= 0.00012 * s.z;
        if (s.y < 0) s.y += 1;
        const a = 0.22 + Math.abs(Math.sin(s.tw)) * 0.55 * s.z;
        ctx.fillStyle = `rgba(150,205,255,${a})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.s * s.z, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- Phase behaviour -------------------------------------------------
      if (ph === "ignition") {
        if (!burstDone && el > 500) {
          burstDone = true;
          for (let i = 0; i < 520; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = rand(2, 26);
            spawn({
              x: cx,
              y: h * 0.62,
              vx: Math.cos(a) * sp,
              vy: Math.sin(a) * sp * 0.75,
              maxLife: rand(0.7, 2.2),
              size: rand(1.2, 4.4),
              hue: rand(18, 50),
              drag: 0.955,
              glow: 1.4,
            });
          }
        }
        if (burstDone) {
          for (let i = 0; i < 6; i++)
            spawn({
              x: cx + rand(-90, 90),
              y: h * 0.66,
              vx: rand(-2.5, 2.5),
              vy: rand(-1, 2),
              maxLife: rand(1, 2.4),
              size: rand(8, 26),
              hue: 215,
              drag: 0.96,
              glow: 0.28,
            });
        }
      } else {
        burstDone = false;
      }

      if (ph === "rocket") {
        rocketFired = true;
        const p = Math.min(1, el / 4800);
        const eased = Math.pow(p, 2.0);
        rocketY = h * 0.66 - eased * (h * 1.05);
        const scale = Math.max(0.45, 1.15 - eased * 0.7);
        // exhaust
        for (let i = 0; i < 11; i++) {
          spawn({
            x: cx + rand(-16, 16) * scale,
            y: rocketY + 70 * scale,
            vx: rand(-2, 2),
            vy: rand(3, 12),
            maxLife: rand(0.4, 1.3),
            size: rand(1.5, 5.5) * scale,
            hue: rand(15, 45),
            drag: 0.965,
            glow: 1.3,
          });
          if (i % 3 === 0)
            spawn({
              x: cx + rand(-30, 30) * scale,
              y: rocketY + 90 * scale,
              vx: rand(-1.4, 1.4),
              vy: rand(0.5, 3),
              maxLife: rand(1.2, 2.6),
              size: rand(12, 34) * scale,
              hue: 212,
              drag: 0.97,
              glow: 0.2,
            });
          if (i % 4 === 0)
            spawn({
              x: cx + rand(-140, 140),
              y: rocketY + rand(-40, 140),
              vx: rand(-0.6, 0.6),
              vy: rand(3, 8),
              maxLife: rand(0.6, 1.6),
              size: rand(1, 2.6),
              hue: 195,
              drag: 0.99,
              glow: 1,
            });
        }
        drawRocket(cx, rocketY, scale, 1, t);
        transformDone = false;
      } else if (ph === "transform") {
        if (!transformDone) {
          transformDone = true;
          const ox = cx;
          const oy = Math.min(rocketY, h * 0.22);
          for (let i = 0; i < 1400; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = rand(1, 18);
            spawn({
              x: ox + rand(-50, 50),
              y: oy + rand(-120, 90),
              vx: Math.cos(a) * sp,
              vy: Math.sin(a) * sp,
              maxLife: rand(3.4, 5),
              size: rand(1, 3.2),
              hue: Math.random() < 0.7 ? rand(185, 215) : rand(42, 52),
              drag: 0.97,
              glow: 1.2,
              seek: true,
              tx: cx + rand(-w * 0.28, w * 0.28),
              ty: h * 0.5 + rand(-70, 70),
            });
          }
        }
      } else if (ph === "reveal") {
        transformDone = false;
        if (t - lastFirework > 480) {
          lastFirework = t;
          const fx = rand(w * 0.16, w * 0.84);
          const fy = rand(h * 0.14, h * 0.55);
          const gold = Math.random() < 0.5;
          for (let i = 0; i < 190; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = rand(1, 13);
            spawn({
              x: fx,
              y: fy,
              vx: Math.cos(a) * sp,
              vy: Math.sin(a) * sp,
              maxLife: rand(1.2, 2.6),
              size: rand(1, 3),
              hue: gold ? rand(40, 55) : rand(185, 210),
              drag: 0.95,
              glow: 1.3,
            });
          }
        }
        if (Math.random() < 0.6)
          spawn({
            x: rand(0, w),
            y: h + 10,
            vx: rand(-0.4, 0.4),
            vy: rand(-1.6, -0.5),
            maxLife: rand(3, 5),
            size: rand(1, 2.6),
            hue: Math.random() < 0.5 ? 48 : 198,
            drag: 1,
            glow: 1,
          });
      } else if (ph === "ready" || ph === "activation" || ph === "countdown") {
        rocketFired = false;
        if (Math.random() < (ph === "countdown" ? 0.9 : 0.35))
          spawn({
            x: rand(0, w),
            y: h + 8,
            vx: rand(-0.3, 0.3),
            vy: rand(-1.4, -0.4),
            maxLife: rand(3, 6),
            size: rand(0.8, 2.2),
            hue: 200,
            drag: 1,
            glow: 1,
          });
      }

      if (ph === "finale" || ph === "handoff") {
        if (Math.random() < 0.5)
          spawn({
            x: rand(0, w),
            y: h + 8,
            vx: 0,
            vy: rand(-1.8, -0.6),
            maxLife: rand(3, 5),
            size: rand(1, 2.4),
            hue: 48,
            drag: 1,
            glow: 1,
          });
      }

      // ---- Particle update -------------------------------------------------
      const dt = 1 / 60;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]!;
        p.life += dt;
        if (p.life >= p.maxLife) {
          parts.splice(i, 1);
          continue;
        }
        if (p.seek && p.tx !== undefined && p.ty !== undefined) {
          const k = Math.min(1, p.life / p.maxLife);
          p.vx += (p.tx - p.x) * 0.0016 * (0.4 + k * 2.4);
          p.vy += (p.ty - p.y) * 0.0016 * (0.4 + k * 2.4);
          p.vx *= 0.94;
          p.vy *= 0.94;
        } else {
          p.vx *= p.drag;
          p.vy *= p.drag;
        }
        p.x += p.vx;
        p.y += p.vy;
        const a = (1 - p.life / p.maxLife) * p.glow;
        ctx.fillStyle = `hsla(${p.hue}, 95%, ${p.hue > 100 ? 68 : 60}%, ${Math.min(1, a)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (rocketFired && ph !== "rocket") rocketFired = false;

      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-10" aria-hidden />;
}
