"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/customize")}
      className="group relative flex h-full w-full flex-col items-center justify-center bg-auri-black px-8 text-left transition-transform duration-300 ease-fluid active:scale-[0.98]"
      aria-label="Enter auri"
    >
      <span className="font-display text-[52px] font-extrabold leading-none text-auri-blush transition-all duration-500 ease-fluid group-hover:scale-105 group-hover:drop-shadow-[0_0_24px_rgba(242,217,238,0.35)]">
        auri
      </span>
      <span className="absolute bottom-10 left-0 right-0 text-center text-[11px] font-normal tracking-wide text-white/50 transition-colors duration-300 group-hover:text-white/80">
        sound &rarr; sensation
      </span>
    </button>
  );
}
