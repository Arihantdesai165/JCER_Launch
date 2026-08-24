export function LaunchButton({ onLaunch, armed }: { onLaunch: () => void; armed: boolean }) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 -m-8 sm:-m-14 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ignite)_32%,transparent),transparent_68%)] blur-xl sm:blur-2xl" />
      
      {/* Dynamic pulsing radar rings */}
      <span className="pointer-events-none absolute h-[clamp(13rem,38vmin,22rem)] w-[clamp(13rem,38vmin,22rem)] rounded-full border border-[color-mix(in_oklab,var(--ignite)_38%,transparent)] animate-ring-pulse" />
      <span className="pointer-events-none absolute h-[clamp(16rem,48vmin,28rem)] w-[clamp(16rem,48vmin,28rem)] rounded-full border border-[color-mix(in_oklab,var(--hud)_24%,transparent)] animate-ring-pulse [animation-delay:1s]" />

      <button
        type="button"
        disabled={!armed}
        onClick={onLaunch}
        aria-label="Launch JCER ERP"
        className="group relative h-[clamp(9.5rem,28vmin,17rem)] w-[clamp(9.5rem,28vmin,17rem)] cursor-pointer rounded-full outline-none transition-transform duration-200 will-change-transform hover:scale-[1.05] active:scale-[0.94] disabled:opacity-40 select-none touch-manipulation"
      >
        {/* metal bezel */}
        <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_140deg,#0d1424,#5c6a85,#0d1424,#8d9bb5,#0d1424)] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)]" />
        <span className="absolute inset-[7%] rounded-full bg-[#141c2e] shadow-[inset_0_4px_16px_rgba(255,255,255,0.12),inset_0_-8px_20px_rgba(0,0,0,0.8)]" />
        {/* red core */}
        <span className="absolute inset-[15%] rounded-full bg-[radial-gradient(circle_at_35%_28%,#ff8b7a,#ff2d1a_45%,#8e0f06_100%)] shadow-[0_0_55px_color-mix(in_oklab,var(--ignite)_60%,transparent),inset_0_-10px_24px_rgba(0,0,0,0.55)] transition-all duration-300 group-hover:shadow-[0_0_95px_color-mix(in_oklab,var(--ignite)_85%,transparent),inset_0_-10px_24px_rgba(0,0,0,0.55)]" />
        <span className="absolute inset-[15%] rounded-full animate-core-pulse bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.28),transparent_60%)]" />
        {/* gloss */}
        <span className="absolute left-[22%] top-[17%] h-[26%] w-[52%] rounded-[50%] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.55),rgba(255,255,255,0))] blur-[2px]" />
        
        {/* Button content */}
        <span className="relative z-10 flex h-full flex-col items-center justify-center gap-0.5 sm:gap-1 font-display tracking-[0.14em] text-[color:var(--chrome)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-[clamp(1.7rem,5vmin,3rem)] w-[clamp(1.7rem,5vmin,3rem)]" aria-hidden>
            <path d="M12 1.6c3.3 2.6 5 6.2 5 10.2v3.4l2 2.2v2.2l-3.6-1.5a3.6 3.6 0 0 1-6.8 0L5 19.6v-2.2l2-2.2v-3.4c0-4 1.7-7.6 5-10.2Zm0 5.6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
          </svg>
          <span className="text-[clamp(0.95rem,2.8vmin,1.6rem)] font-black tracking-[0.14em]">LAUNCH</span>
          <span className="text-[clamp(0.65rem,1.8vmin,1.05rem)] font-semibold tracking-[0.32em]">JCER ERP</span>
        </span>
      </button>

      <p className="mt-[clamp(0.75rem,2vh,1.5rem)] font-mono text-[clamp(0.75rem,2vmin,1.2rem)] tracking-[0.42em] text-[color:var(--hud)]">
        CLICK TO LAUNCH
      </p>
    </div>
  );
}
