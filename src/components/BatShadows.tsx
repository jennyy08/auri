/**
 * Very faint, blurred bat silhouettes drifting in the background — a nod to
 * echolocation / "sound → sensation". Kept extremely transparent so they
 * read as ambience, not decoration you consciously notice.
 */
export default function BatShadows() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <Bat className="absolute -left-6 top-10 h-24 w-24 rotate-[-8deg] opacity-[0.07] animate-drift-slow blur-[1px]" />
      <Bat className="absolute -right-4 top-24 h-16 w-16 rotate-[10deg] opacity-[0.05] animate-drift-slower blur-[1px]" />
      <Bat className="absolute left-1/3 top-4 h-10 w-10 rotate-[4deg] opacity-[0.06] animate-drift-slow blur-[0.5px]" />
    </div>
  );
}

function Bat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 60" className={className} fill="white">
      <path d="M50 14 C45 6 34 2 22 6 C28 10 33 14 35 20 C24 20 10 27 0 40 C14 36 27 33 34 34 C31 41 30 49 32 56 C37 49 42 42 47 38 C48 45 49 52 50 58 C51 52 52 45 53 38 C58 42 63 49 68 56 C70 49 69 41 66 34 C73 33 86 36 100 40 C90 27 76 20 65 20 C67 14 72 10 78 6 C66 2 55 6 50 14 Z" />
    </svg>
  );
}
