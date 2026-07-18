"use client";

import Toggle from "../../components/Toggle";
import NavCard from "../../components/NavCard";
import BatShadows from "../../components/BatShadows";
import { NOTIFY_LEVEL_META, useAuriStore } from "../../lib/auri-store";

export default function Customize() {
  const {
    haptics,
    setHaptics,
    lights,
    setLights,
    notifyLevel,
    emergency,
    spaces,
    activeSpaceId,
    userName,
    setUserName,
  } = useAuriStore();

  const activeSpaceName =
    spaces.find((s) => s.id === activeSpaceId)?.name || "home";

  return (
    <div className="relative isolate flex h-full w-full flex-col bg-auri-black px-5 pb-6 pt-8">
      <BatShadows />

    <h1 className="mt-1 flex items-center justify-center gap-2">
      <span className="font-display text-xl font-bold text-white">
        auri
      </span>
      <span className="mt-[2px] font-sans text-[10px] font-semibold tracking-wide text-auri-muted">
        <span className="text-[#C58A96]">feel</span> the aura
      </span>
    </h1>

      <div className="mt-3 rounded-card bg-white/5 px-4 py-3">
        <label
          htmlFor="user-name"
          className="mb-1.5 block text-[10px] font-bold text-auri-muted"
        >
          your name
        </label>
        <input
          id="user-name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="e.g. Jordan"
          className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px] font-normal text-white outline-none placeholder:text-white/30"
        />
        <p className="mt-1.5 text-[9px] font-normal leading-snug text-auri-muted">
          so auri can recognize when your name is called.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <div className="group -mx-2 flex items-start gap-2.5 rounded-card px-2 py-1.5 transition-colors duration-200 hover:bg-white/5">
          <Toggle checked={haptics} onChange={setHaptics} label="Haptics" />
          <div>
            <p className="font-display text-[12px] font-bold text-white">
              haptics
            </p>
            <p className="text-[9px] font-normal leading-snug text-auri-muted">
              feel personalized vibrations for detected sounds
            </p>
          </div>
        </div>

        <div className="group -mx-2 flex items-start gap-2.5 rounded-card px-2 py-1.5 transition-colors duration-200 hover:bg-white/5">
          <Toggle checked={lights} onChange={setLights} label="Lights" />
          <div>
            <p className="font-display text-[12px] font-bold text-white">
              lights
            </p>
            <p className="text-[9px] font-normal leading-snug text-auri-muted">
              receive color-coded LED alerts for detected sounds
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <NavCard
          to="/customize/target-spaces"
          tone="teal"
          title="target space"
          subtitle="filter sounds by location"
          trailing={
            <span className="text-[11px] font-normal text-white/70">
              {activeSpaceName}
            </span>
          }
        />

        <NavCard
          to="/customize/sound-selection"
          tone="sage"
          title="sound selection"
          subtitle="choose & classify which sounds auri should detect"
          trailing={
            <span className="text-[10px] font-normal text-white/70">
              {NOTIFY_LEVEL_META[notifyLevel].label}
            </span>
          }
        />

        <NavCard
          to="/customize/history"
          tone="slate"
          title="history"
          subtitle="view recently-detected sounds"
        />

        <NavCard
          to="/customize/emergency-contact"
          tone="rose"
          title="emergency contact"
          subtitle="if an emergency sound is repeatedly detected, auri will automatically call or text a trusted contact"
          trailing={
            <span
              className={`text-[10px] font-normal ${
                emergency.enabled ? "text-white/70" : "text-white/50"
              }`}
            >
              {emergency.enabled ? "on" : "off"}
            </span>
          }
        />
      </div>
    </div>
  );
}
