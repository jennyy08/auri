"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { hexToRgba } from "../lib/auri-store";

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

// the actual hex behind each tone, used only to tint the faint ambient glow
const TONE_HEX: Record<NonNullable<NavCardProps["tone"]>, string> = {
  teal: "#5eb8e0",
  sage: "#7c8f86",
  slate: "#8a8a94",
  rose: "#e0776d",
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
      style={{ boxShadow: `0 0 26px -6px ${hexToRgba(TONE_HEX[tone], 0.16)}` }}
      className={`w-full rounded-card ${TONE_CLASSES[tone]} px-4 py-3 text-left transition-all duration-300 ease-fluid hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98] active:duration-150`}
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
