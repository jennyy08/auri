"use client";

import ScreenHeader from "../../../components/ScreenHeader";
import { CLASSIFICATION_META, useAuriStore } from "../../../lib/auri-store";

export default function History() {
  const { history, sounds } = useAuriStore();

  return (
    <div className="flex h-full w-full flex-col bg-auri-black px-5 pb-6 pt-8">
      <ScreenHeader title="history" subtitle="recently-detected sounds" />

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
              className="flex items-center justify-between rounded-card bg-auri-slate/60 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-display text-[13px] font-bold text-white">
                    {sound?.name ?? entry.soundId}
                  </p>
                  {meta && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: meta.color, color: meta.textColor }}
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
