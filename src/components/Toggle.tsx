"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  accent?: "lilac" | "rose";
  disabled?: boolean;
}

export default function Toggle({
  checked,
  onChange,
  label,
  accent = "lilac",
  disabled = false,
}: ToggleProps) {
  const isRose = accent === "rose";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`group relative h-[18px] w-[32px] shrink-0 rounded-full transition-all duration-300 ease-fluid active:scale-90 ${
        disabled ? "cursor-not-allowed opacity-40" : ""
      } ${
        checked
          ? isRose
            ? "bg-auri-rose animate-glow-pulse-rose"
            : "bg-auri-lilac shadow-[0_0_0_4px_rgba(185,169,217,0.18)]"
          : "bg-white/15 hover:bg-white/25"
      }`}
    >
      <span
        className={`absolute left-[2px] top-[2px] h-[14px] w-[14px] rounded-full bg-auri-black shadow-sm transition-transform duration-300 ease-spring group-active:scale-90 ${
          checked ? "translate-x-[14px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
