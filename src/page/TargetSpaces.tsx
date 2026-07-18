import { useState } from "react";
import ScreenHeader from "../components/ScreenHeader";
import { Chip, AddChip } from "../components/Chip";

interface Space {
  id: string;
  name: string;
  sounds: string[];
  custom?: boolean;
}

const INITIAL_SPACES: Space[] = [
  { id: "home", name: "home", sounds: ["baby crying", "dog bark", "door knock", "smoke alarm"] },
  { id: "outdoor", name: "outdoor", sounds: ["car horn", "dog bark", "bicycle bell"] },
  { id: "sleep", name: "sleep", sounds: ["smoke alarm"] },
];

export default function TargetSpaces() {
  const [active, setActive] = useState("home");

  return (
    <div className="flex h-full w-full flex-col bg-auri-black px-6 pb-8 pt-10">
      <ScreenHeader
        title="target spaces"
        subtitle="prioritize sound detection based on your location *note: emergency sounds will be played regardless of selection"
      />

      <div className="flex flex-1 flex-col gap-4">
        {INITIAL_SPACES.map((space) => (
          <button
            key={space.id}
            type="button"
            onClick={() => setActive(space.id)}
            className={`rounded-2xl px-5 py-4 text-left transition-colors ${
              active === space.id ? "bg-auri-teal" : "bg-auri-teal/50"
            }`}
          >
            <p className="font-display text-[17px] font-medium text-white">
              {space.name}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {space.sounds.map((sound) => (
                <Chip key={sound} label={sound} />
              ))}
              <AddChip />
            </div>
          </button>
        ))}

        <button
          type="button"
          onClick={() => setActive("custom")}
          className={`rounded-2xl px-5 py-4 text-left transition-colors ${
            active === "custom" ? "bg-auri-lilac/40" : "bg-white/5"
          }`}
        >
          <p className="font-display text-[17px] font-medium text-white/90">
            custom
          </p>
        </button>
      </div>
    </div>
  );
}
