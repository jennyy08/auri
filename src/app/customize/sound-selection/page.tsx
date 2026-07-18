"use client";

import { useState } from "react";
import ScreenHeader from "../../../components/ScreenHeader";
import Toggle from "../../../components/Toggle";
import {
  CLASSIFICATIONS,
  CLASSIFICATION_META,
  LED_COLORS,
  NOTIFY_LEVEL_META,
  VIBRATION_SPEEDS,
  VIBRATION_STRENGTHS,
  hexToRgba,
  useAuriStore,
  type Classification,
  type NotifyLevel,
  type SoundDef,
} from "../../../lib/auri-store";

const NOTIFY_LEVELS: NotifyLevel[] = ["all", "emergency-important", "emergency-only"];
const FILTER_OPTIONS: ("all" | Classification)[] = ["all", ...CLASSIFICATIONS];

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
    haptics,
    lights,
  } = useAuriStore();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClassification, setNewClassification] = useState<Classification>("important");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Classification>("all");

  function handleAddSound() {
    if (!newName.trim()) return;
    addSound(newName, newClassification);
    setNewName("");
    setNewClassification("important");
    setShowAdd(false);
  }

  const editingSound: SoundDef | undefined = sounds.find((s) => s.id === editingId);
  const visibleSounds =
    filter === "all" ? sounds : sounds.filter((s) => s.classification === filter);

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
              className={`flex-1 rounded-lg px-2 py-1.5 text-center leading-tight transition-all duration-200 ease-fluid hover:-translate-y-px active:translate-y-0 active:scale-95 ${
                level === "emergency-important" ? "text-[8.5px]" : "text-[10px]"
              } font-normal ${
                notifyLevel === level
                  ? "bg-white text-auri-black shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                  : "bg-white/10 text-white/70 hover:bg-white/15"
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

      {/* filter the list by tag — purely a display filter, doesn't touch notify settings */}
      <p className="mb-1.5 text-[10px] font-semibold text-auri-muted">filter by:</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map((f) => {
          const active = filter === f;
          const meta = f === "all" ? null : CLASSIFICATION_META[f];
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-all duration-200 ease-fluid hover:scale-105"
              style={
                meta
                  ? {
                      backgroundColor: meta.color,
                      color: meta.textColor,
                      opacity: active ? 1 : 0.35,
                      boxShadow: active
                        ? `0 0 10px -1px ${hexToRgba(meta.color, 0.6)}`
                        : "none",
                    }
                  : {
                      backgroundColor: active ? "#ffffff" : "rgba(255,255,255,0.08)",
                      color: active ? "#050505" : "rgba(255,255,255,0.6)",
                    }
              }
            >
              {meta && <span aria-hidden>{meta.icon}</span>}
              {meta ? meta.label : "all"}
            </button>
          );
        })}
      </div>

      <p className="mb-2 text-[9px] font-normal text-auri-muted">
        tap a sound to edit its vibration &amp; color
      </p>

      <div className="space-y-2.5">
        {visibleSounds.length === 0 && (
          <p className="rounded-card bg-white/5 px-4 py-3 text-center text-[10px] font-normal text-white/40">
            no sounds match this filter
          </p>
        )}
        {visibleSounds.map((sound) => {
          const meta = CLASSIFICATION_META[sound.classification];
          const active = willNotify(sound);
          return (
            <div
              key={sound.id}
              onClick={() => setEditingId(sound.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setEditingId(sound.id);
                }
              }}
              style={{ boxShadow: `0 0 20px -16px ${hexToRgba(sound.color, 0.15)}` }}
              className={`cursor-pointer rounded-card bg-white/5 px-4 py-3 transition-all duration-300 ease-fluid hover:bg-white/[0.07] ${
                active ? "" : "opacity-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: sound.color,
                      boxShadow: `0 0 8px 1px ${hexToRgba(sound.color, 0.7)}`,
                    }}
                  />
                  <span className="font-display text-[13px] font-bold text-white">
                    {sound.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {sound.custom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSound(sound.id);
                      }}
                      aria-label={`Remove ${sound.name}`}
                      className="text-[13px] text-white/30 transition-all duration-200 hover:scale-125 hover:text-white/70 active:scale-90"
                    >
                      ×
                    </button>
                  )}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Toggle
                      checked={sound.enabled}
                      onChange={() => toggleSound(sound.id)}
                      label={sound.name}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span
                  style={{
                    backgroundColor: meta.color,
                    color: meta.textColor,
                    boxShadow: `0 0 10px -1px ${hexToRgba(meta.color, 0.6)}`,
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                >
                  <span aria-hidden>{meta.icon}</span>
                  {meta.label}
                </span>
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
            urgency level
          </label>
          <div className="flex gap-1.5">
            {CLASSIFICATIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewClassification(c)}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-all duration-200 ease-fluid hover:scale-105"
                style={{
                  backgroundColor: CLASSIFICATION_META[c].color,
                  color: CLASSIFICATION_META[c].textColor,
                  opacity: newClassification === c ? 1 : 0.4,
                  boxShadow: `0 0 10px -1px ${hexToRgba(CLASSIFICATION_META[c].color, 0.6)}`,
                }}
              >
                <span aria-hidden>{CLASSIFICATION_META[c].icon}</span>
                {CLASSIFICATION_META[c].label}
              </button>
            ))}
          </div>
          <p className="text-[9px] font-normal leading-snug text-auri-muted">
            {CLASSIFICATION_META[newClassification].icon}{" "}
            {CLASSIFICATION_META[newClassification].label} —{" "}
            {CLASSIFICATION_META[newClassification].experience}
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddSound}
              className="flex-1 rounded-full bg-white py-1.5 text-[11px] font-bold text-auri-black transition-all duration-200 ease-fluid hover:-translate-y-px hover:shadow-[0_4px_16px_-4px_rgba(255,255,255,0.35)] active:translate-y-0 active:scale-95"
            >
              add sound
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="flex-1 rounded-full bg-white/10 py-1.5 text-[11px] font-bold text-white/70 transition-all duration-200 ease-fluid hover:-translate-y-px hover:bg-white/20 active:translate-y-0 active:scale-95"
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-card border border-dashed border-white/15 py-2.5 text-[11px] font-bold text-white/60 transition-all duration-200 ease-fluid hover:-translate-y-px hover:border-white/30 hover:text-white active:translate-y-0 active:scale-[0.98]"
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
                className="text-[15px] text-white/40 transition-all duration-200 hover:scale-125 hover:text-white/80 active:scale-90"
              >
                ×
              </button>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[10px] font-bold text-auri-muted">
                  led color
                </p>
                <p className="text-[8px] font-normal text-auri-muted">
                  auri's LED supports 5 colors
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {LED_COLORS.map(({ name, hex }) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Set color ${name}`}
                    onClick={() => updateSoundSettings(editingSound.id, { color: hex })}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className="block h-6 w-6 rounded-full transition-transform duration-200 ease-spring hover:scale-[1.15] active:scale-90"
                      style={{
                        backgroundColor: hex,
                        boxShadow: `0 0 10px -1px ${hexToRgba(hex, 0.6)}`,
                        outline:
                          editingSound.color === hex ? "2px solid white" : "2px solid transparent",
                        outlineOffset: "2px",
                      }}
                    />
                    <span className="text-[8px] font-normal capitalize text-white/40">
                      {name}
                    </span>
                  </button>
                ))}
              </div>
              {!lights && (
                <p className="mt-2 text-[9px] font-normal leading-snug text-auri-muted">
                  lights are turned off in customize — this color won&apos;t show
                  until you turn them back on.
                </p>
              )}
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
                    className={`flex-1 rounded-full py-1 text-[10px] font-normal capitalize transition-all duration-200 ease-fluid active:scale-95 ${
                      editingSound.vibrationStrength === strength
                        ? "bg-white text-auri-black shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                        : "bg-white/10 text-white/70 hover:bg-white/15"
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
                    className={`flex-1 rounded-full py-1 text-[10px] font-normal capitalize transition-all duration-200 ease-fluid active:scale-95 ${
                      editingSound.vibrationSpeed === speed
                        ? "bg-white text-auri-black shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                        : "bg-white/10 text-white/70 hover:bg-white/15"
                    }`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
              {!haptics && (
                <p className="mt-2 text-[9px] font-normal leading-snug text-auri-muted">
                  haptics are turned off in customize — you won&apos;t feel this
                  vibration until you turn them back on.
                </p>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold text-auri-muted">
                tag
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CLASSIFICATIONS.map((c) => {
                  const cMeta = CLASSIFICATION_META[c];
                  const active = editingSound.classification === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSoundClassification(editingSound.id, c)}
                      style={{
                        backgroundColor: cMeta.color,
                        color: cMeta.textColor,
                        opacity: active ? 1 : 0.4,
                        boxShadow: active
                          ? `0 0 10px -1px ${hexToRgba(cMeta.color, 0.6)}`
                          : "none",
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-all duration-200 ease-fluid hover:scale-105"
                    >
                      <span aria-hidden>{cMeta.icon}</span>
                      {cMeta.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[9px] font-normal leading-snug text-auri-muted">
                {CLASSIFICATION_META[editingSound.classification].experience}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                removeSound(editingSound.id);
                setEditingId(null);
              }}
              className="w-full rounded-full bg-auri-rose/20 py-1.5 text-[11px] font-bold text-auri-rose ring-1 ring-auri-rose/40 transition-all duration-200 ease-fluid hover:bg-auri-rose/30 active:scale-95"
            >
              delete sound
            </button>

            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="w-full rounded-full bg-white py-1.5 text-[11px] font-bold text-auri-black transition-all duration-200 ease-fluid hover:-translate-y-px hover:shadow-[0_4px_16px_-4px_rgba(255,255,255,0.35)] active:translate-y-0 active:scale-95"
            >
              done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
