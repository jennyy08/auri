"use client";

import { useRouter } from "next/navigation";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export default function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-4 flex items-start gap-2.5">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Back"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-[13px] text-white/70 transition-colors hover:bg-white/10"
      >
        ←
      </button>
      <div>
        <h1 className="font-display text-[19px] font-bold leading-tight text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[10px] font-normal leading-snug text-auri-muted">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
