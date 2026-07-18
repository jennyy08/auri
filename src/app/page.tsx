"use client";

import { useRouter } from "next/navigation";
import BatShadows from "../components/BatShadows";

export default function Home() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/customize")}
      className="group relative flex h-full w-full flex-col items-center overflow-hidden bg-auri-black px-8 text-left"
      aria-label="Enter auri"
    >
      <BatShadows />

      {/* top 1/4 breathing room before the wordmark */}
      <div className="flex-[1]" />

      <span className="animate-glow-pulse font-display text-[52px] font-extrabold leading-none text-auri-blush transition-transform duration-500 ease-fluid group-hover:scale-105">
        auri
      </span>
      <span className="mt-3 text-center text-[11px] font-normal tracking-wide text-white/50 transition-colors duration-300 group-hover:text-white/80">
        sound &rarr; sensation
      </span>

      <div className="flex-[3]" />
    </button>
  );
}
