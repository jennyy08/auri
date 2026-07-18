"use client";

import { useState } from "react";
import ScreenHeader from "../../../components/ScreenHeader";
import Toggle from "../../../components/Toggle";
import {
  CLASSIFICATIONS,
  CLASSIFICATION_META,
  NOTIFY_LEVEL_META,
  SOUND_COLOR_PRESETS,
  VIBRATION_SPEEDS,
  VIBRATION_STRENGTHS,
  useAuriStore,
  type Classification,
  type NotifyLevel,
  type SoundDef,
} from "../../../lib/auri-store";

const NOTIFY_LEVELS: NotifyLevel[] = ["all", "urgent-medium", "urgent-only"];

export default function SoundSelection() {
  const {
    sounds,
    notifyLevel,
    setNotifyLevel,
    toggleSound,
    setSoundClassification,
    updateSoundSettings,
    addSound,
    removeSound,
    willNotify,
  } = useAuriStore();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClassification, setNewClassification] = useState<Classification>("medium");
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleAddSound() {
    if (!newName.trim()) return;
    addSound(newName, newClassification);
    setNewName("");
    setNewClassification("medium");
    setShowAdd(false);
  }

  function cycleClassification(current: Classification): Classification {
    const idx = CLASSIFICATIONS.indexOf(current);
    return CLASSIFICATIONS[(idx + 1) % CLASSIFICATIONS.length];
  }

  const editingSound: SoundDef | undefined = sounds.find((s) => s.id === editingId);

  return (
    <div className="relative flex h-full w-full flex-col bg-auri-black px-5 pb-6 pt-8">
      <ScreenHeader
        title="sound selection"
        subtitle="choose & classify which sounds auri should detect"
      />

      {/* notify-level filter */}
      <div className="mb-4 rounded-card bg-white/5 px-4 py-3">
        <p className="mb-1.5 text-[10px] font-bold text-auri-muted">
          notify me for
        </p>
        <div className="flex gap-1.5">
          {NOTIFY_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setNotifyLevel(level)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-normal transition-colors ${
                notifyLevel === level
                  ? "bg-white text-auri-black"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {NOTIFY_LEVEL_META[level].label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[9px] font-normal leading-snug text-auri-muted">
          {NOTIFY_LEVEL_META[notifyLevel].blurb} — sounds outside this level
          will still be detected, but won&apos;t alert you
        </p>
      </div>

      <p className="mb-2 text-[9px] font-normal text-auri-muted">
        double-tap a sound to edit its vibration &amp; color
      </p>

      <div className="space-y-2.5">
        {sounds.map((sound) => {
          const meta = CLASSIFICATION_META[sound.classification];
          const active = willNotify(sound);
          return (
            <div
              key={sound.id}
              onDoubleClick={() => setEditingId(sound.id)}
              className={`rounded-card bg-white/5 px-4 py-3 transition-opacity ${
                active ? "" : "opacity-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: sound.color }}
                  />
                  <span className="font-display text-[13px] font-bold text-white">
                    {sound.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {sound.custom && (
                    <button
                      type="button"
                      onClick={() => removeSound(sound.id)}
                      aria-label={`Remove ${sound.name}`}
                      className="text-[13px] text-white/30 hover:text-white/70"
                    >
                      ×
                    </button>
                  )}
                  <Toggle
                    checked={sound.enabled}
                    onChange={() => toggleSound(sound.id)}
                    label={sound.name}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setSoundClassification(sound.id, cycleClassification(sound.classification))
                  }
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors"
                  style={{ backgroundColor: meta.color, color: meta.textColor }}
                >
                  {meta.label}
                </button>
                <span className="text-[9px] font-normal capitalize text-white/40">
                  {sound.vibrationStrength} · {sound.vibrationSpeed}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* add a sound */}
      {showAdd ? (
        <div className="mt-3 space-y-2.5 rounded-card bg-white/5 px-4 py-3">
          <label className="block text-[10px] font-bold text-auri-muted">
            sound name
          </label>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. microwave beep"
            className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px] font-normal text-white outline-none placeholder:text-white/30"
          />

          <label className="block text-[10px] font-bold text-auri-muted">
            classification
          </label>
          <div className="flex gap-1.5">
            {CLASSIFICATIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewClassification(c)}
                className="rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-opacity"
                style={{
                  backgroundColor: CLASSIFICATION_META[c].color,
                  color: CLASSIFICATION_META[c].textColor,
                  opacity: newClassification === c ? 1 : 0.4,
                }}
              >
                {CLASSIFICATION_META[c].label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddSound}
              className="flex-1 rounded-full bg-white py-1.5 text-[11px] font-bold text-auri-black"
            >
              add sound
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="flex-1 rounded-full bg-white/10 py-1.5 text-[11px] font-bold text-white/70"
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-card border border-dashed border-white/15 py-2.5 text-[11px] font-bold text-white/60 transition-colors hover:border-white/30 hover:text-white"
        >
          <span className="text-[13px] leading-none">+</span> add a sound
        </button>
      )}

      {/* double-click edit modal */}
      {editingSound && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 px-5"
          onClick={() => setEditingId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full space-y-3 rounded-card bg-auri-panel px-4 py-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-[14px] font-bold text-white">
                edit &ldquo;{editingSound.name}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                aria-label="Close"
                className="text-[15px] text-white/40 hover:text-white/80"
              >
                ×
              </button>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold text-auri-muted">color</p>
              <div className="flex flex-wrap gap-2">
                {SOUND_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Set color ${color}`}
                    onClick={() => updateSoundSettings(editingSound.id, { color })}
                    className="h-6 w-6 rounded-full transition-transform"
                    style={{
                      backgroundColor: color,
                      outline:
                        editingSound.color === color ? "2px solid white" : "2px solid transparent",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold text-auri-muted">
                vibration strength
              </p>
              <div className="flex gap-1.5">
                {VIBRATION_STRENGTHS.map((strength) => (
                  <button
                    key={strength}
                    type="button"
                    onClick={() => updateSoundSettings(editingSound.id, { vibrationStrength: strength })}
                    className={`flex-1 rounded-full py-1 text-[10px] font-normal capitalize transition-colors ${
                      editingSound.vibrationStrength === strength
                        ? "bg-white text-auri-black"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {strength}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold text-auri-muted">
                vibration speed
              </p>
              <div className="flex gap-1.5">
                {VIBRATION_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => updateSoundSettings(editingSound.id, { vibrationSpeed: speed })}
                    className={`flex-1 rounded-full py-1 text-[10px] font-normal capitalize transition-colors ${
                      editingSound.vibrationSpeed === speed
                        ? "bg-white text-auri-black"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="w-full rounded-full bg-white py-1.5 text-[11px] font-bold text-auri-black"
            >
              done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
