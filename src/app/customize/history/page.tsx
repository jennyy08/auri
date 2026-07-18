"use client";

import { useState } from "react";
import ScreenHeader from "../../../components/ScreenHeader";
import { CLASSIFICATION_META, hexToRgba, useAuriStore } from "../../../lib/auri-store";

export default function History() {
  const { history, sounds, clearHistory } = useAuriStore();
  const [confirmingClear, setConfirmingClear] = useState(false);

  function handleClear() {
    clearHistory();
    setConfirmingClear(false);
  }

  return (
    <div className="flex h-full w-full flex-col bg-auri-black px-5 pb-6 pt-8">
      <div className="flex items-start justify-between gap-3">
        <ScreenHeader title="history" subtitle="recently-detected sounds" />
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="mt-0.5 shrink-0 rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/50 transition-all duration-200 ease-fluid hover:-translate-y-px hover:bg-white/10 hover:text-white/80 active:translate-y-0 active:scale-95"
          >
            clear history
          </button>
        )}
      </div>

      {confirmingClear && (
        <div className="mb-3 space-y-2 rounded-card border border-auri-rose/40 bg-auri-rose/10 px-4 py-3">
          <p className="text-[11px] font-bold leading-snug text-white">
            clear all history?
          </p>
          <p className="text-[10px] font-normal leading-snug text-auri-muted">
            this permanently deletes every logged detection — it can&apos;t be
            undone.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 rounded-full bg-auri-rose py-1.5 text-[11px] font-bold text-white transition-all duration-200 ease-fluid hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-95"
            >
              yes, clear it
            </button>
            <button
              type="button"
              onClick={() => setConfirmingClear(false)}
              className="flex-1 rounded-full bg-white/10 py-1.5 text-[11px] font-bold text-white/70 transition-all duration-200 ease-fluid hover:-translate-y-px hover:bg-white/20 active:translate-y-0 active:scale-95"
            >
              cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {history.length === 0 && (
          <p className="text-[11px] font-normal text-auri-muted">
            nothing detected yet
          </p>
        )}
        {history.map((entry) => {
          const sound = sounds.find((s) => s.id === entry.soundId);
          const meta = sound ? CLASSIFICATION_META[sound.classification] : null;
          return (
            <div
              key={entry.id}
              style={
                meta
                  ? { boxShadow: `0 0 26px -12px ${hexToRgba(meta.color, 0.45)}` }
                  : undefined
              }
              className="flex items-center justify-between rounded-card bg-auri-slate/60 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-display text-[13px] font-bold text-white">
                    {sound?.name ?? entry.soundId}
                  </p>
                  {meta && (
                    <span
                      style={{
                        backgroundColor: meta.color,
                        color: meta.textColor,
                        boxShadow: `0 0 8px -1px ${hexToRgba(meta.color, 0.6)}`,
                      }}
                      className="rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
                    >
                      {meta.label}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-normal text-auri-muted">
                  {entry.space}
                </p>
              </div>
              <span className="text-[10px] font-normal text-white/50">
                {entry.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
