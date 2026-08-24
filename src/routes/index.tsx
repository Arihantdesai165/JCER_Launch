import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { CinematicCanvas } from "@/components/launch/CinematicCanvas";
import { LaunchButton } from "@/components/launch/LaunchButton";
import { LaunchAudio } from "@/lib/launch-audio";
import { DURATIONS, ERP_URL, type Phase } from "@/lib/launch-phases";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JCER ERP System — Official Grand Launch" },
      {
        name: "description",
        content:
          "The official cinematic launch ceremony of the JCER ERP System — one platform, one campus, one digital future.",
      },
      { property: "og:title", content: "JCER ERP System — Official Grand Launch" },
      {
        property: "og:description",
        content: "Witness the grand launch of JCER ERP, the digital campus management platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LaunchPage,
});

function LaunchPage() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [count, setCount] = useState(10);
  const [shake, setShake] = useState(0);
  const [flash, setFlash] = useState(false);
  const [sweep, setSweep] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const started = useRef(false);
  const audio = useRef<LaunchAudio | null>(null);
  const timers = useRef<number[]>([]);

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    audio.current = new LaunchAudio();
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      timers.current.forEach(clearTimeout);
      audio.current?.dispose();
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const launch = useCallback(async () => {
    if (started.current) return;
    started.current = true;

    const a = audio.current!;
    await a.start();
    a.ambient();

    setFlash(true);
    after(450, () => setFlash(false));
    setPhase("activation");

    const D = DURATIONS;
    let t = 0;

    // COUNTDOWN (directly after activation)
    t += D.activation;
    after(t, () => setPhase("countdown"));
    for (let n = 10; n >= 0; n--) {
      const i = 10 - n;
      after(t + i * 900, () => {
        setCount(n);
        a.countdownPulse(n);
        if (n <= 3 && n > 0) {
          setShake(2 + (4 - n) * 1.5);
          after(400, () => setShake(0));
        }
      });
    }

    // IGNITION
    t += D.countdown;
    after(t, () => {
      setPhase("ignition");
      setShake(0);
    });
    after(t + 520, () => {
      a.ignition();
      setFlash(true);
      setShake(14);
    });
    after(t + 900, () => setFlash(false));
    after(t + 2600, () => setShake(7));

    // ROCKET
    t += D.ignition;
    after(t, () => {
      setPhase("rocket");
      setShake(6);
      a.rocket();
    });
    after(t + 2800, () => setShake(3));

    // TRANSFORMATION
    t += D.rocket;
    after(t, () => {
      setPhase("transform");
      setShake(0);
      a.transform();
    });

    // REVEAL
    t += D.transform;
    after(t, () => {
      setPhase("reveal");
      a.reveal();
      a.celebrate();
    });

    // FINALE
    t += D.reveal;
    after(t, () => {
      setPhase("finale");
      a.finale();
    });

    // HANDOFF
    t += D.finale;
    after(t, () => {
      setPhase("handoff");
      setSweep(true);
    });
    after(t + 1400, () => {
      try {
        window.location.href = ERP_URL;
      } catch {
        setPhase("fallback");
      }
    });
    after(t + 5200, () => setPhase("fallback"));
  }, [after]);

  return (
    <main className="relative h-screen h-[100dvh] w-screen w-[100dvw] overflow-hidden bg-[color:var(--void)] text-[color:var(--chrome)] select-none touch-none flex flex-col items-center justify-center">
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,color-mix(in_oklab,var(--hud)_16%,transparent),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 grid-floor opacity-60" />
      <div className="pointer-events-none absolute inset-0 z-0 fog" />
      <div className="pointer-events-none absolute inset-0 z-30 vignette" />

      <CinematicCanvas phase={phase} shake={shake} />

      {/* HUD frame */}
      <div className="pointer-events-none absolute inset-2.5 sm:inset-4 md:inset-6 z-30 border border-[color-mix(in_oklab,var(--hud)_18%,transparent)]">
        <span className="absolute -left-px -top-px h-5 w-5 sm:h-8 sm:w-8 border-l-2 border-t-2 border-[color:var(--hud)]" />
        <span className="absolute -right-px -top-px h-5 w-5 sm:h-8 sm:w-8 border-r-2 border-t-2 border-[color:var(--hud)]" />
        <span className="absolute -bottom-px -left-px h-5 w-5 sm:h-8 sm:w-8 border-b-2 border-l-2 border-[color:var(--hud)]" />
        <span className="absolute -bottom-px -right-px h-5 w-5 sm:h-8 sm:w-8 border-b-2 border-r-2 border-[color:var(--hud)]" />
      </div>

      <div className="relative z-20 flex h-full w-full max-w-4xl max-h-[100dvh] flex-col items-center justify-center px-4 sm:px-8 py-3 sm:py-6 text-center overflow-hidden">
        {phase === "ready" && <ReadyScreen onLaunch={launch} />}
        {phase === "activation" && <ActivationScreen />}
        {phase === "countdown" && <CountdownScreen n={count} />}
        {phase === "ignition" && <IgnitionScreen />}
        {phase === "transform" && <TransformScreen />}
        {phase === "reveal" && <RevealScreen />}
        {(phase === "finale" || phase === "handoff") && <FinaleScreen />}
        {phase === "fallback" && <FallbackScreen />}
      </div>

      {flash && (
        <div className="pointer-events-none absolute inset-0 z-40 animate-flash bg-white" />
      )}
      {sweep && (
        <div className="pointer-events-none absolute inset-0 z-40 animate-sweep bg-[linear-gradient(100deg,transparent_0%,rgba(180,230,255,0.9)_45%,#ffffff_50%,rgba(180,230,255,0.9)_55%,transparent_100%)]" />
      )}

      {/* Standee Fullscreen Utility Button (Top-Right) */}
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 md:top-8 md:right-8 z-50 flex items-center justify-center rounded-lg border border-[color-mix(in_oklab,var(--hud)_25%,transparent)] bg-[color-mix(in_oklab,var(--void)_60%,transparent)] p-1.5 sm:p-2 text-[color-mix(in_oklab,var(--hud)_60%,transparent)] opacity-35 backdrop-blur-sm transition-all duration-300 hover:opacity-100 hover:scale-105 hover:border-[color:var(--hud)] hover:text-[color:var(--hud)] hover:bg-[color-mix(in_oklab,var(--hud)_20%,transparent)] hover:shadow-[0_0_25px_color-mix(in_oklab,var(--hud)_40%,transparent)] focus:opacity-100 active:scale-95 cursor-pointer outline-none"
      >
        {isFullscreen ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4.5 w-4.5 sm:h-5 sm:w-5"
            aria-hidden
          >
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4.5 w-4.5 sm:h-5 sm:w-5"
            aria-hidden
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </button>
    </main>
  );
}

/* ---------------------------------------------------------------- screens */

function ReadyScreen({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="flex w-full flex-col items-center justify-center animate-fade-up text-center max-h-full">
      <h1 className="font-display text-[clamp(1.7rem,5.4vmin,4.5rem)] font-black leading-[1.08] tracking-[0.06em] text-glow max-w-3xl">
        JCER ERP SYSTEM
      </h1>
      <p className="mt-2 sm:mt-3 md:mt-4 font-mono text-[clamp(0.65rem,1.85vmin,1.2rem)] tracking-[0.32em] text-[color:var(--hud)] max-w-2xl leading-relaxed">
        DIGITAL CAMPUS MANAGEMENT PLATFORM
      </p>
      <p className="mt-1.5 sm:mt-2.5 font-display text-[clamp(0.7rem,1.75vmin,1.1rem)] font-bold tracking-[0.38em] text-glow-gold">
        VERSION 1.0
      </p>
      <div className="mt-2.5 sm:mt-4">
        <p className="inline-flex items-center gap-2 sm:gap-2.5 rounded-full border border-[color-mix(in_oklab,var(--online)_40%,transparent)] bg-[color-mix(in_oklab,var(--void)_70%,transparent)] px-3.5 sm:px-5 py-1 sm:py-1.5 font-mono text-[clamp(0.6rem,1.4vmin,0.9rem)] tracking-[0.22em] text-[color:var(--online)] shadow-[0_0_20px_color-mix(in_oklab,var(--online)_20%,transparent)]">
          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-core-pulse rounded-full bg-[color:var(--online)]" />
          SYSTEM STATUS: READY
        </p>
      </div>
      <div className="mt-[clamp(1.75rem,5.5vh,5.5rem)]">
        <LaunchButton onLaunch={onLaunch} armed />
      </div>
    </div>
  );
}

function ActivationScreen() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute h-[clamp(8rem,28vmin,18rem)] w-[clamp(8rem,28vmin,18rem)] rounded-full border-2 border-[color-mix(in_oklab,var(--ignite)_70%,transparent)] animate-shockwave"
          style={{ animationDelay: `${i * 180}ms` }}
        />
      ))}
      <p className="font-display text-[clamp(1.6rem,5.5vmin,4.2rem)] font-black tracking-[0.25em] text-glow-warm text-center px-4">
        SYSTEM ACTIVATED
      </p>
    </div>
  );
}

function CountdownScreen({ n }: { n: number }) {
  const r = 46;
  const dash = 2 * Math.PI * r;
  return (
    <div className="relative flex flex-col items-center justify-center text-center">
      <div className="relative h-[clamp(10rem,32vmin,20rem)] w-[clamp(10rem,32vmin,20rem)]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(120,190,255,0.14)" strokeWidth="1.6" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--hud)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray={dash}
            strokeDashoffset={dash * (1 - n / 10)}
            style={{
              transition: "stroke-dashoffset 0.85s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: "drop-shadow(0 0 12px var(--hud))",
            }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-[clamp(3.5rem,13vmin,8.5rem)] font-black leading-none text-glow select-none">
          {n}
        </span>
      </div>
      <p className="mt-4 sm:mt-6 font-mono text-[clamp(0.75rem,2.2vmin,1.35rem)] tracking-[0.38em] text-[color:var(--hud)]">
        T−{n} &nbsp; LAUNCH SEQUENCE ACTIVE
      </p>
    </div>
  );
}

function IgnitionScreen() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <p className="animate-ignite font-display text-[clamp(2.5rem,10vmin,7.5rem)] font-black tracking-[0.16em] text-glow-warm">
        IGNITION
      </p>
    </div>
  );
}

function TransformScreen() {
  return (
    <div className="flex flex-col items-center justify-center px-4 text-center">
      <p className="animate-fade-up font-mono text-[clamp(0.85rem,2.5vmin,1.5rem)] tracking-[0.35em] text-[color:var(--hud)] leading-relaxed max-w-2xl">
        TRANSFORMING ENERGY → DIGITAL CORE
      </p>
    </div>
  );
}

function RevealScreen() {
  return (
    <div className="flex animate-reveal flex-col items-center justify-center text-center px-4">
      <h1 className="font-display text-[clamp(2.4rem,8.5vmin,6.8rem)] font-black leading-none tracking-[0.06em] text-glow">
        JCER ERP
      </h1>
      <p className="mt-3 sm:mt-5 font-mono text-[clamp(0.9rem,2.8vmin,1.9rem)] tracking-[0.35em] text-[color:var(--gold)] text-glow-gold">
        OFFICIALLY LAUNCHED
      </p>
      <p className="mt-2.5 sm:mt-4 font-display text-[clamp(0.95rem,2.6vmin,1.65rem)] font-black tracking-[0.35em] text-glow-gold">
        VERSION 1.0
      </p>
      <p className="mt-2 sm:mt-3 font-display text-[clamp(1rem,2.8vmin,1.8rem)] font-black tracking-[0.35em] text-[color-mix(in_oklab,var(--chrome)_85%,transparent)]">
        2026
      </p>
    </div>
  );
}

function FinaleScreen() {
  return (
    <div className="flex animate-reveal flex-col items-center justify-center text-center px-4">
      <h1 className="font-display text-[clamp(2.2rem,7.8vmin,6rem)] font-black leading-none tracking-[0.06em] text-glow">
        JCER ERP
      </h1>
      <p className="mt-3 sm:mt-5 font-mono text-[clamp(0.85rem,2.5vmin,1.6rem)] tracking-[0.35em] text-glow-gold">
        OFFICIALLY LAUNCHED
      </p>
      <p className="mt-2.5 sm:mt-3.5 font-display text-[clamp(0.75rem,2vmin,1.3rem)] font-bold tracking-[0.38em] text-[color:var(--hud)]">
        VERSION 1.0 &nbsp;·&nbsp; 2026
      </p>
      <p className="mt-5 sm:mt-8 font-mono text-[clamp(0.7rem,1.8vmin,1.1rem)] tracking-[0.38em] text-[color-mix(in_oklab,var(--hud)_75%,transparent)] animate-pulse">
        ENTERING SYSTEM…
      </p>
    </div>
  );
}

function FallbackScreen() {
  return (
    <div className="flex animate-fade-up flex-col items-center justify-center text-center px-4">
      <h1 className="font-display text-[clamp(2rem,7vmin,5.5rem)] font-black leading-none text-glow">
        JCER ERP
      </h1>
      <p className="mt-3 sm:mt-4 font-mono text-[clamp(0.8rem,2.4vmin,1.5rem)] tracking-[0.32em] text-glow-gold">
        OFFICIALLY LAUNCHED
      </p>
      <p className="mt-2 sm:mt-3 font-display text-[clamp(0.7rem,1.8vmin,1.2rem)] font-bold tracking-[0.35em] text-[color:var(--hud)]">
        VERSION 1.0
      </p>
      <a
        href={ERP_URL}
        className="mt-5 sm:mt-8 inline-block rounded-full border-2 border-[color:var(--hud)] px-5 sm:px-8 py-2.5 sm:py-3.5 font-display text-[clamp(0.8rem,2vmin,1.2rem)] tracking-[0.25em] text-[color:var(--chrome)] shadow-[0_0_35px_color-mix(in_oklab,var(--hud)_45%,transparent)] transition-all hover:scale-105 active:scale-95 hover:bg-[color-mix(in_oklab,var(--hud)_18%,transparent)]"
      >
        CLICK TO ENTER ERP
      </a>
      <p className="mt-3.5 font-mono text-[clamp(0.6rem,1.5vmin,0.85rem)] tracking-[0.16em] text-[color-mix(in_oklab,var(--hud)_60%,transparent)] break-all max-w-sm sm:max-w-md">
        {ERP_URL}
      </p>
    </div>
  );
}
