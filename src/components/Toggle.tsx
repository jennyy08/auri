"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-auri-lilac" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute left-[2px] top-[2px] h-[14px] w-[14px] rounded-full bg-auri-black transition-transform duration-200 ${
          checked ? "translate-x-[14px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
