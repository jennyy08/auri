"use client";

import { useRouter } from "next/navigation";
import BatHero from "../components/BatHero";
import logoSrc from "../assets/logo.png";

export default function Home() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/customize")}
      className="group relative isolate flex h-full w-full flex-col items-center overflow-hidden bg-auri-black px-8 text-left"
      aria-label="Enter auri"
    >
      <BatHero />

      {/* push the wordmark much further down the screen */}
      <div className="flex-[1]" />

      <span className="animate-glow-pulse font-display text-[52px] font-extrabold leading-none text-auri-blush transition-transform duration-500 ease-fluid group-hover:scale-105">
        auri
      </span>

      <div className="flex-[1]" />

      {/* mark + tagline, lifted up off the very bottom edge */}
      <img
        src={logoSrc.src}
        alt="auri"
        className="h-16 w-16 rounded-full transition-transform duration-500 ease-fluid group-hover:scale-105"
      />
      <span className="mt-3 text-center text-[11px] font-normal tracking-wide text-white/50 transition-colors duration-300 group-hover:text-white/80">
        sound &rarr; sensation
      </span>

      <div className="flex-[1]" />
    </button>
  );
}