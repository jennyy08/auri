import { useState } from "react";
import Toggle from "../components/Toggle";
import NavCard from "../components/NavCard";

export default function Customize() {
  const [haptics, setHaptics] = useState(true);
  const [lights, setLights] = useState(true);

  return (
    <div className="flex h-full w-full flex-col bg-auri-black px-6 pb-8 pt-10">
      <h1 className="font-display text-3xl font-bold text-white">
        customize
      </h1>

      <div className="mt-6 space-y-4">
        <div className="flex items-start gap-3">
          <Toggle checked={haptics} onChange={setHaptics} label="Haptics" />
          <div>
            <p className="font-display text-[15px] font-medium text-white">
              haptics
            </p>
            <p className="text-[11px] leading-snug text-auri-muted">
              feel personalized vibrations for detected sounds
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Toggle checked={lights} onChange={setLights} label="Lights" />
          <div>
            <p className="font-display text-[15px] font-medium text-white">
              lights
            </p>
            <p className="text-[11px] leading-snug text-auri-muted">
              receive color-coded LED alerts for detected sounds
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-1 flex-col gap-4">
        <NavCard
          to="/customize/target-spaces"
          tone="teal"
          title="target space"
          subtitle="filter sounds based on your location"
          trailing={<span className="text-[13px] text-white/70">home</span>}
        />

        <NavCard
          to="/customize/sound-selection"
          tone="sage"
          title="sound selection"
          subtitle="choose & classify which sounds auri should detect"
        >
          <p className="mt-3 text-[12px] leading-snug text-white/70">
            specify vibration strength &amp; speed
            <br />
            specify LED colors
          </p>
        </NavCard>

        <div className="flex-1" />

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
          subtitle="if an emergency-classified sound is repeatedly detected, auri will automatically contact a selected contact"
        />
      </div>
    </div>
  );
}
