import ScreenHeader from "../components/ScreenHeader";

interface HistoryEntry {
  sound: string;
  space: string;
  time: string;
}

const ENTRIES: HistoryEntry[] = [
  { sound: "door knock", space: "home", time: "2 min ago" },
  { sound: "dog bark", space: "outdoor", time: "18 min ago" },
  { sound: "smoke alarm", space: "sleep", time: "yesterday, 11:42 pm" },
];

export default function History() {
  return (
    <div className="flex h-full w-full flex-col bg-auri-black px-6 pb-8 pt-10">
      <ScreenHeader title="history" subtitle="recently-detected sounds" />

      <div className="space-y-3">
        {ENTRIES.map((entry, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl bg-auri-slate/60 px-5 py-4"
          >
            <div>
              <p className="font-display text-[15px] font-medium text-white">
                {entry.sound}
              </p>
              <p className="text-[11px] text-auri-muted">{entry.space}</p>
            </div>
            <span className="text-[11px] text-white/50">{entry.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
