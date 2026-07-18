import batSrc from "../assets/bat.png";

/**
 * A more obvious flock of bats for the landing screen — same recolored
 * bat.png as BatShadows, but bigger, more opaque, and less blurred so
 * they're clearly (if softly) part of the scene, not just texture.
 */
export default function BatHero() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <Bat className="absolute -left-10 top-[3%] h-24 w-40 rotate-[-7deg] text-auri-lilac opacity-[0.22] animate-drift-slow" />
      <Bat className="absolute -right-8 top-[10%] h-16 w-28 rotate-[9deg] text-auri-blush opacity-[0.18] animate-drift-slower" />
      <Bat className="absolute left-[8%] top-[38%] h-12 w-20 rotate-[4deg] text-white opacity-[0.14] blur-[0.5px] animate-drift-slower" />
      <Bat className="absolute right-[6%] top-[58%] h-20 w-32 rotate-[-11deg] text-auri-lilac opacity-[0.16] blur-[0.5px] animate-drift-slow" />
      <Bat className="absolute left-1/2 top-[72%] h-10 w-16 -translate-x-1/2 rotate-[3deg] text-auri-blush opacity-[0.12] animate-drift-slow" />
    </div>
  );
}

function Bat({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${batSrc.src})`,
        maskImage: `url(${batSrc.src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
