"use client";

import type { MouseEvent } from "react";

interface ChipProps {
  label: string;
  onRemove?: () => void;
}

export function Chip({ label, onRemove }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-medium text-auri-black transition-all duration-200 ease-fluid hover:bg-white">
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="text-auri-black/50 transition-all duration-200 hover:scale-125 hover:text-auri-black active:scale-90"
        >
          ×
        </button>
      )}
    </span>
  );
}

export function AddChip({
  onClick,
}: {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add sound"
      className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/20 text-[11px] text-white transition-all duration-200 ease-spring hover:rotate-90 hover:bg-white/30 active:scale-90"
    >
      +
    </button>
  );
}
