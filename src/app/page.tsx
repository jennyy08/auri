"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/customize")}
      className="relative flex h-full w-full flex-col items-center justify-center bg-auri-black px-8 text-left"
      aria-label="Enter auri"
    >
      <span className="font-display text-[52px] font-extrabold leading-none text-auri-blush">
        auri
      </span>
      <span className="absolute bottom-10 left-0 right-0 text-center text-[11px] font-normal tracking-wide text-white/50">
        sound &rarr; sensation
      </span>
    </button>
  );
}
