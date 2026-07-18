import { useState } from "react";
import ScreenHeader from "../components/ScreenHeader";
import Toggle from "../components/Toggle";

interface Sound {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
}

const INITIAL_SOUNDS: Sound[] = [
  { id: "baby-crying", name: "baby crying", enabled: true, color: "#f2d9ee" },
  { id: "dog-bark", name: "dog bark", enabled: true, color: "#b9a9d9" },
  { id: "door-knock", name: "door knock", enabled: true, color: "#7c8f86" },
  { id: "smoke-alarm", name: "smoke alarm", enabled: true, color: "#e0776d" },
  { id: "car-horn", name: "car horn", enabled: false, color: "#e8c05f" },
];

export default function SoundSelection() {
  const [sounds, setSounds] = useState(INITIAL_SOUNDS);

  function toggleSound(id: string) {
    setSounds((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-auri-black px-6 pb-8 pt-10">
      <ScreenHeader
        title="sound selection"
        subtitle="choose & classify which sounds auri should detect"
      />

      <div className="space-y-3">
        {sounds.map((sound) => (
          <div
            key={sound.id}
            className="flex items-center justify-between rounded-2xl bg-white/5 px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: sound.color }}
              />
              <span className="font-display text-[15px] font-medium text-white">
                {sound.name}
              </span>
            </div>
            <Toggle
              checked={sound.enabled}
              onChange={() => toggleSound(sound.id)}
              label={sound.name}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
