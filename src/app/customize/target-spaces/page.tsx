"use client";

import { useState } from "react";
import ScreenHeader from "../../../components/ScreenHeader";
import { Chip, AddChip } from "../../../components/Chip";
import { hexToRgba, useAuriStore } from "../../../lib/auri-store";

export default function TargetSpaces() {
  const {
    spaces,
    sounds,
    activeSpaceId,
    setActiveSpace,
    addSoundToSpace,
    removeSoundFromSpace,
    renameSpace,
  } = useAuriStore();
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  function soundName(id: string) {
    return sounds.find((s) => s.id === id)?.name ?? id;
  }

  return (
    <div className="flex h-full w-full flex-col bg-auri-black px-5 pb-6 pt-8">
      <ScreenHeader
        title="target spaces"
        subtitle="prioritize sound detection based on your location *note: emergency sounds will be played regardless of selection"
      />

      <div className="flex flex-col gap-3">
        {spaces.map((space) => {
          const isCustom = space.id === "custom";
          const available = sounds.filter((s) => !space.soundIds.includes(s.id));
          const pickerOpen = pickerFor === space.id;
          const isActive = activeSpaceId === space.id;

          return (
            <div
              key={space.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveSpace(space.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveSpace(space.id);
                }
              }}
              style={{
                boxShadow: `0 0 24px -8px ${hexToRgba(isCustom ? "#b9a9d9" : "#5eb8e0", 0.18)}`,
              }}
              className={`cursor-pointer rounded-card px-4 py-3 text-left transition-all duration-300 ease-fluid hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${
                isActive
                  ? isCustom
                    ? "bg-auri-lilac/40 ring-2 ring-auri-highlight"
                    : "bg-auri-teal ring-2 ring-auri-highlight"
                  : isCustom
                    ? "bg-white/5 hover:bg-white/[0.08]"
                    : "bg-auri-teal/50 hover:bg-auri-teal/70"
              }`}
            >
              {isCustom ? (
                <input
                  value={space.name}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => renameSpace(space.id, e.target.value)}
                  placeholder="name this space"
                  className="w-full bg-transparent font-display text-[13px] font-bold text-white/90 outline-none placeholder:text-white/40"
                />
              ) : (
                <p className="font-display text-[13px] font-bold text-white">
                  {space.name}
                </p>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {space.soundIds.map((soundId) => (
                  <Chip
                    key={soundId}
                    label={soundName(soundId)}
                    onRemove={() => removeSoundFromSpace(space.id, soundId)}
                  />
                ))}
                <AddChip
                  onClick={(e) => {
                    e.stopPropagation();
                    setPickerFor(pickerOpen ? null : space.id);
                  }}
                />
              </div>

              {pickerOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 flex flex-wrap gap-1.5 rounded-lg bg-black/25 p-2"
                >
                  {available.length === 0 ? (
                    <p className="text-[9px] font-normal text-white/50">
                      every sound is already added — add more in sound
                      selection
                    </p>
                  ) : (
                    available.map((sound) => (
                      <button
                        key={sound.id}
                        type="button"
                        onClick={() => {
                          addSoundToSpace(space.id, sound.id);
                          setPickerFor(null);
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-medium text-white transition-all duration-200 ease-fluid hover:-translate-y-px hover:bg-white/25 active:translate-y-0 active:scale-95"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: sound.color }}
                        />
                        {sound.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
