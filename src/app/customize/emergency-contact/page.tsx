"use client";

import { useEffect, useState } from "react";
import ScreenHeader from "../../../components/ScreenHeader";
import Toggle from "../../../components/Toggle";
import {
  useAuriStore,
  type ContactMethod,
  type EmergencyContactEntry,
  type EmergencySettings,
} from "../../../lib/auri-store";

const METHODS: ContactMethod[] = ["text", "call", "both"];

function methodLabel(method: ContactMethod) {
  if (method === "both") return "text and call";
  return method;
}

function contactsPhrase(contacts: EmergencyContactEntry[]) {
  const names = contacts.map((c) => c.name.trim()).filter(Boolean);
  if (names.length === 0) return "your emergency contact";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function smsHref(number: string, body: string) {
  return `sms:${number.replace(/[^\d+]/g, "")}?body=${encodeURIComponent(body)}`;
}

function telHref(number: string) {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

export default function EmergencyContact() {
  const { emergency, saveEmergency, logDetection } = useAuriStore();

  const [draft, setDraft] = useState<EmergencySettings>(emergency);
  const [dirty, setDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [justTested, setJustTested] = useState(false);

  // keep the draft synced with the store until the person starts editing
  // (the store hydrates from localStorage a beat after mount)
  useEffect(() => {
    if (!dirty) setDraft(emergency);
  }, [emergency, dirty]);

  function patch(update: Partial<EmergencySettings>) {
    setDirty(true);
    setJustSaved(false);
    setDraft((prev) => ({ ...prev, ...update }));
  }

  function updateContact(id: string, update: Partial<EmergencyContactEntry>) {
    patch({
      contacts: draft.contacts.map((c) => (c.id === id ? { ...c, ...update } : c)),
    });
  }

  function addContactRow() {
    patch({
      contacts: [...draft.contacts, { id: `contact-${Date.now()}`, name: "", number: "" }],
    });
  }

  function removeContactRow(id: string) {
    patch({ contacts: draft.contacts.filter((c) => c.id !== id) });
  }

  function handleSave() {
    saveEmergency(draft);
    setDirty(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  }

  const validContacts = draft.contacts.filter((c) => c.name.trim() && c.number.trim());
  const primary = validContacts[0];

  function sendTestAlert() {
    if (!primary) return;
    const message = `this is a test alert from auri — an urgent sound was detected ${draft.times}+ times in ${draft.minutes} minutes.`;
    logDetection("smoke-alarm", "home");
    setJustTested(true);
    setTimeout(() => setJustTested(false), 2500);
    if (draft.method === "call") {
      window.location.href = telHref(primary.number);
    } else {
      window.location.href = smsHref(primary.number, message);
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-auri-black px-5 pb-6 pt-8">
      <ScreenHeader
        title="emergency contact"
        subtitle="automatically notify a trusted contact if an urgent sound is detected more than once"
      />

      <div className="mb-4 flex items-start justify-between gap-3 rounded-card bg-white/5 px-4 py-3">
        <div className="flex-1">
          <p className="font-display text-[13px] font-bold leading-snug text-white">
            {draft.enabled ? (
              <>
                auri will <span className="text-auri-blush">{methodLabel(draft.method)}</span>{" "}
                <span className="text-auri-blush">{contactsPhrase(draft.contacts)}</span> if an
                urgent sound is detected more than{" "}
                <input
                  type="number"
                  min={1}
                  value={draft.times}
                  onChange={(e) => patch({ times: Number(e.target.value) })}
                  className="w-8 rounded bg-white/10 px-1 text-center text-[13px] font-bold text-auri-blush outline-none"
                />{" "}
                times in{" "}
                <input
                  type="number"
                  min={1}
                  value={draft.minutes}
                  onChange={(e) => patch({ minutes: Number(e.target.value) })}
                  className="w-8 rounded bg-white/10 px-1 text-center text-[13px] font-bold text-auri-blush outline-none"
                />{" "}
                minutes.
              </>
            ) : (
              "emergency contact is turned off — auri won't reach out to anyone automatically."
            )}
          </p>
        </div>
        <Toggle
          checked={draft.enabled}
          onChange={(v) => patch({ enabled: v })}
          label="Emergency contact enabled"
        />
      </div>

      <div className={`space-y-4 ${draft.enabled ? "" : "pointer-events-none opacity-40"}`}>
        <div>
          <p className="mb-1.5 text-[10px] font-bold text-auri-muted">
            contact method
          </p>
          <div className="flex gap-1.5">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => patch({ method: m })}
                className={`rounded-full px-3 py-1 text-[10px] font-normal transition-colors ${
                  draft.method === m
                    ? "bg-white text-auri-black"
                    : "bg-white/10 text-white/70"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {draft.contacts.map((contact, i) => (
            <div key={contact.id} className="rounded-card bg-white/5 px-3 py-2.5">
              <div className="flex items-end gap-2.5">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-bold text-auri-muted">
                    contact name
                  </label>
                  <input
                    value={contact.name}
                    onChange={(e) => updateContact(contact.id, { name: e.target.value })}
                    className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px] font-normal text-white outline-none placeholder:text-white/30"
                    placeholder="name"
                  />
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-[10px] font-bold text-auri-muted">
                    #
                  </label>
                  <input
                    value={contact.number}
                    onChange={(e) => updateContact(contact.id, { number: e.target.value })}
                    className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px] font-normal text-white outline-none placeholder:text-white/30"
                    placeholder="000-0000"
                  />
                </div>
                {draft.contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContactRow(contact.id)}
                    aria-label={`Remove contact ${i + 1}`}
                    className="mb-1.5 text-[13px] text-white/30 hover:text-white/70"
                  >
                    ×
                  </button>
                )}
              </div>

              {contact.name.trim() && contact.number.trim() && (
                <div className="mt-2 flex gap-2">
                  <a
                    href={telHref(contact.number)}
                    className="flex-1 rounded-full bg-white/10 py-1 text-center text-[10px] font-bold text-white/80 transition-colors hover:bg-white/20"
                  >
                    call now
                  </a>
                  <a
                    href={smsHref(
                      contact.number,
                      `this is a test alert from auri — checking that ${contact.name.trim()} can be reached.`
                    )}
                    className="flex-1 rounded-full bg-white/10 py-1 text-center text-[10px] font-bold text-white/80 transition-colors hover:bg-white/20"
                  >
                    text now
                  </a>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addContactRow}
            className="flex w-full items-center justify-center gap-1.5 rounded-card border border-dashed border-white/15 py-2 text-[11px] font-bold text-white/60 transition-colors hover:border-white/30 hover:text-white"
          >
            <span className="text-[13px] leading-none">+</span> add another contact
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-full bg-white py-2 text-[12px] font-bold text-auri-black transition-opacity"
        >
          {justSaved ? "saved ✓" : "save"}
        </button>

        <button
          type="button"
          onClick={sendTestAlert}
          disabled={!draft.enabled || !primary}
          className="w-full rounded-full bg-white/10 py-2 text-[12px] font-bold text-white/80 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {justTested ? "test alert sent ✓" : "send test alert now"}
        </button>

        <p className="text-center text-[9px] font-normal leading-snug text-auri-muted">
          {primary
            ? "\"send test alert\" opens your phone's call or messages app to actually reach your primary contact — the same action auri triggers automatically once the threshold above is hit."
            : "add a contact with a name and number to enable real call/text alerts."}
        </p>
      </div>
    </div>
  );
}
