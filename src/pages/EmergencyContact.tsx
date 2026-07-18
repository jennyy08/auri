import { useState } from "react";
import ScreenHeader from "../components/ScreenHeader";

type ContactMethod = "text" | "call" | "both";

interface Contact {
  name: string;
  number: string;
}

export default function EmergencyContact() {
  const [method, setMethod] = useState<ContactMethod>("text");
  const [threshold, setThreshold] = useState({ times: 3, minutes: 5 });
  const [contacts, setContacts] = useState<Contact[]>([
    { name: "", number: "" },
    { name: "", number: "" },
  ]);

  function updateContact(index: number, field: keyof Contact, value: string) {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-auri-black px-6 pb-8 pt-10">
      <ScreenHeader
        title="emergency contact"
        subtitle="automatically notify a trusted contact if a critical sound is detected more than once"
      />

      <p className="mb-6 font-display text-[19px] font-semibold leading-snug text-white">
        [text] [contact] if an emergency sound plays more than{" "}
        <input
          type="number"
          value={threshold.times}
          onChange={(e) =>
            setThreshold((t) => ({ ...t, times: Number(e.target.value) }))
          }
          className="w-10 rounded bg-white/10 px-1 text-center text-[17px] font-semibold text-auri-blush outline-none"
        />{" "}
        times in{" "}
        <input
          type="number"
          value={threshold.minutes}
          onChange={(e) =>
            setThreshold((t) => ({ ...t, minutes: Number(e.target.value) }))
          }
          className="w-10 rounded bg-white/10 px-1 text-center text-[17px] font-semibold text-auri-blush outline-none"
        />{" "}
        minutes
      </p>

      <div className="mb-6">
        <p className="mb-2 text-[12px] font-medium text-auri-muted">
          contact method
        </p>
        <div className="flex gap-2">
          {(["text", "call", "both"] as ContactMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                method === m
                  ? "bg-white text-auri-black"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {contacts.map((contact, i) => (
          <div key={i} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[12px] font-medium text-auri-muted">
                contact name
              </label>
              <input
                value={contact.name}
                onChange={(e) => updateContact(i, "name", e.target.value)}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/30"
                placeholder="name"
              />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-[12px] font-medium text-auri-muted">
                #
              </label>
              <input
                value={contact.number}
                onChange={(e) => updateContact(i, "number", e.target.value)}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/30"
                placeholder="000-0000"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
