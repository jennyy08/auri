"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface NavCardProps {
  to: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  tone?: "teal" | "sage" | "slate" | "rose";
  children?: ReactNode;
}

const TONE_CLASSES: Record<NonNullable<NavCardProps["tone"]>, string> = {
  teal: "bg-auri-teal",
  sage: "bg-auri-sage",
  slate: "bg-auri-slate",
  rose: "bg-auri-rose",
};

export default function NavCard({
  to,
  title,
  subtitle,
  trailing,
  tone = "teal",
  children,
}: NavCardProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(to)}
      className={`w-full rounded-card ${TONE_CLASSES[tone]} px-4 py-3 text-left transition-all duration-300 ease-fluid hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] hover:brightness-110 active:translate-y-0 active:scale-[0.98] active:duration-150`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-[14px] font-bold leading-none text-white">
          {title}
        </span>
        {trailing}
      </div>
      {subtitle && (
        <p className="mt-1 text-[10px] font-normal leading-snug text-white/60">
          {subtitle}
        </p>
      )}
      {children}
    </button>
  );
}
