import batSrc from "../assets/bat.png";

/**
 * Faint, blurred bat silhouettes drifting in the background — a nod to
 * echolocation / "sound → sensation". Uses the real bat.png (recolored via
 * a CSS mask, since the source art is solid black) and kept very
 * transparent so it reads as ambience on interior screens, not decoration
 * you consciously notice.
 */
export default function BatShadows() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <Bat className="absolute -left-8 top-8 h-20 w-32 rotate-[-9deg] text-auri-lilac opacity-[0.07] blur-[1px] animate-drift-slow" />
      <Bat className="absolute -right-10 top-28 h-14 w-24 rotate-[12deg] text-white opacity-[0.05] blur-[1px] animate-drift-slower" />
      <Bat className="absolute left-1/4 top-2 h-9 w-16 rotate-[5deg] text-auri-blush opacity-[0.06] blur-[0.5px] animate-drift-slow" />
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
