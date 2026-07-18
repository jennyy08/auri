"use client";

import { useEffect, useRef, useState } from "react";
import ScreenHeader from "../../../components/ScreenHeader";
import Toggle from "../../../components/Toggle";
import {
  useAuriStore,
  type ContactMethod,
  type EmergencyContactEntry,
  type EmergencySettings,
} from "../../../lib/auri-store";

const METHODS: ContactMethod[] = ["text", "call", "both"];
const GRACE_PERIOD_MS = 8000;

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

// loose but real validation: allows digits, spaces, dashes, dots, parens,
// and an optional leading +, and requires 7–15 digits (covers local and
// international formats without being overly strict about punctuation)
function isValidPhoneNumber(number: string): boolean {
  const trimmed = number.trim();
  if (!trimmed) return false;
  if (!/^\+?[\d\s\-().]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export default function EmergencyContact() {
  const { emergency, saveEmergency, logDetection } = useAuriStore();

  const [draft, setDraft] = useState<EmergencySettings>(emergency);
  const [dirty, setDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [justTested, setJustTested] = useState(false);
  const [sending, setSending] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ kind: "sent" | "fallback" | "error"; text: string } | null>(
    null
  );
  // true the moment someone flips the switch on but hasn't filled in a
  // contact yet — the switch shows "on" and the contact boxes highlight,
  // but nothing is actually saved as enabled until a contact lands
  const [pendingActivation, setPendingActivation] = useState(false);

  const validContacts = draft.contacts.filter(
    (c) => c.name.trim() && isValidPhoneNumber(c.number)
  );
  const hasValidContact = validContacts.length > 0;
  const primary = validContacts[0];

  // refs so the unmount cleanup below can see the latest values without
  // re-subscribing every render
  const pendingRef = useRef(pendingActivation);
  const hasValidContactRef = useRef(hasValidContact);
  useEffect(() => {
    pendingRef.current = pendingActivation;
  }, [pendingActivation]);
  useEffect(() => {
    hasValidContactRef.current = hasValidContact;
  }, [hasValidContact]);

  // keep the draft synced with the store until the person starts editing
  // (the store hydrates from localStorage a beat after mount)
  useEffect(() => {
    if (!dirty) setDraft(emergency);
  }, [emergency, dirty]);

  // a contact showed up while we were waiting — confirm activation for
  // real. crucially this saves the *whole* draft, not just `enabled`: if we
  // only saved `{ enabled: true }`, the store's contacts would stay stale
  // (whatever they were before this visit), so the very next mount would
  // see "enabled but no valid contact" and immediately revert it — which is
  // exactly the bug where a correctly-filled contact seemed to disappear.
  useEffect(() => {
    if (pendingActivation && hasValidContact) {
      setPendingActivation(false);
      saveEmergency({ ...draft, enabled: true });
      setDirty(false);
    }
  }, [pendingActivation, hasValidContact, saveEmergency, draft]);

  // grace period: if nothing's filled in within a few seconds of flipping
  // the switch on, slide it back off automatically
  useEffect(() => {
    if (!pendingActivation) return;
    const timer = setTimeout(() => {
      setDraft((prev) => ({ ...prev, enabled: false }));
      setPendingActivation(false);
      saveEmergency({ enabled: false });
    }, GRACE_PERIOD_MS);
    return () => clearTimeout(timer);
  }, [pendingActivation, saveEmergency]);

  // if a previously-active setup loses its last valid contact (not the
  // pending-activation case above — this is "it was on, now it can't be"),
  // turn it off rather than leave a switch on that can't reach anyone
  useEffect(() => {
    if (!pendingActivation && !hasValidContact && draft.enabled) {
      setDraft((prev) => ({ ...prev, enabled: false }));
      saveEmergency({ enabled: false });
    }
  }, [pendingActivation, hasValidContact, draft.enabled, saveEmergency]);

  // if the person navigates away mid-grace-period, don't leave the store
  // thinking emergency contact is on with nobody to reach
  useEffect(() => {
    return () => {
      if (pendingRef.current && !hasValidContactRef.current) {
        saveEmergency({ enabled: false });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patch(update: Partial<EmergencySettings>) {
    setDirty(true);
    setJustSaved(false);
    setDraft((prev) => ({ ...prev, ...update }));
  }

  // the enabled switch is a live control, not a draft field — it commits to
  // the shared store the moment it's confirmed, so the customize page's
  // "on/off" label and every other screen stay in sync immediately
  function handleToggleEnabled(next: boolean) {
    setJustSaved(false);

    if (!next) {
      setPendingActivation(false);
      setDraft((prev) => ({ ...prev, enabled: false }));
      saveEmergency({ enabled: false });
      return;
    }

    // turning on
    setDraft((prev) => ({ ...prev, enabled: true }));
    if (hasValidContact) {
      saveEmergency({ ...draft, enabled: true });
      setDirty(false);
    } else {
      // flip visually on and prompt for a contact — see the effects above
      // for what happens next
      setPendingActivation(true);
    }
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

  async function sendTestAlert() {
    if (!primary || sending) return;
    const message = `this is a test alert from auri — an emergency sound was detected ${draft.times}+ times in ${draft.minutes} minutes.`;

    setSending(true);
    setTestFeedback(null);

    try {
      const res = await fetch("/api/emergency-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: primary.number, method: draft.method, message }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "the alert service couldn't send it");

      logDetection("smoke-alarm", "home");
      setJustTested(true);
      setTestFeedback({
        kind: "sent",
        text: `sent for real via Twilio — ${methodLabel(draft.method)} delivered to ${primary.name || "your contact"}.`,
      });
      setTimeout(() => setJustTested(false), 2500);
    } catch (err) {
      // couldn't send automatically (most likely Twilio isn't configured
      // in this environment yet) — fall back to opening the phone's own
      // call/text app so tapping the button still does *something*.
      logDetection("smoke-alarm", "home");
      setJustTested(true);
      setTestFeedback({
        kind: "error",
        text: err instanceof Error ? err.message : "the alert service couldn't send it",
      });
      setTimeout(() => setJustTested(false), 2500);
      if (draft.method === "call") {
        window.location.href = telHref(primary.number);
      } else {
        window.location.href = smsHref(primary.number, message);
      }
    } finally {
      setSending(false);
      setTimeout(() => setTestFeedback(null), 7000);
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-auri-black px-5 pb-6 pt-8">
      {/* ambient rose glow, echoing the emergency-contact nav card color */}
      <div
        className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-auri-rose/25 blur-[70px]"
        aria-hidden
      />

      <ScreenHeader
        title="emergency contact"
        subtitle="automatically notify a trusted contact if an emergency sound is detected more than once"
      />

      <div className="relative mb-4 flex items-start justify-between gap-3 rounded-card bg-white/5 px-4 py-3 transition-colors duration-300 hover:bg-white/[0.07]">
        <div className="flex-1">
          <p className="font-display text-[11px] font-normal leading-snug text-white/60">
            {pendingActivation ? (
              "fill in a contact below to turn this on — it'll switch back off if nothing's filled in."
            ) : draft.enabled ? (
              <>
                auri will <span className="font-semibold text-auri-blush">{methodLabel(draft.method)}</span>{" "}
                <span className="font-semibold text-auri-blush">{contactsPhrase(draft.contacts)}</span> if an
                emergency sound is detected more than{" "}
                <input
                  type="number"
                  min={1}
                  value={draft.times}
                  onChange={(e) => patch({ times: Number(e.target.value) })}
                  className="w-8 rounded bg-white/10 px-1 text-center text-[11px] font-semibold text-auri-blush outline-none transition-colors duration-200 focus:bg-white/20"
                />{" "}
                times in{" "}
                <input
                  type="number"
                  min={1}
                  value={draft.minutes}
                  onChange={(e) => patch({ minutes: Number(e.target.value) })}
                  className="w-8 rounded bg-white/10 px-1 text-center text-[11px] font-semibold text-auri-blush outline-none transition-colors duration-200 focus:bg-white/20"
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
          onChange={handleToggleEnabled}
          label="Emergency contact enabled"
          accent="rose"
        />
      </div>

      <div className="space-y-4">
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
                className={`rounded-full px-3 py-1 text-[10px] font-normal transition-all duration-200 ease-fluid hover:-translate-y-px active:translate-y-0 active:scale-95 ${
                  draft.method === m
                    ? "bg-auri-rose text-white shadow-[0_0_0_3px_rgba(224,119,109,0.25)]"
                    : "bg-white/10 text-white/70 hover:bg-white/15"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {pendingActivation && (
            <p className="text-[10px] font-semibold leading-snug text-auri-rose">
              fill in a name &amp; number below to activate emergency contact
            </p>
          )}

          {draft.contacts.map((contact, i) => {
            const numberTouched = contact.number.trim().length > 0;
            const numberValid = isValidPhoneNumber(contact.number);
            return (
              <div
                key={contact.id}
                className={`rounded-card bg-white/5 px-3 py-2.5 transition-all duration-300 hover:bg-white/[0.07] ${
                  pendingActivation && !hasValidContact
                    ? "ring-2 ring-auri-rose/70 animate-pulse"
                    : ""
                }`}
              >
                <div className="flex items-end gap-2.5">
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-bold text-auri-muted">
                      contact name
                    </label>
                    <input
                      value={contact.name}
                      onChange={(e) => updateContact(contact.id, { name: e.target.value })}
                      className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px] font-normal text-white outline-none placeholder:text-white/30 transition-colors duration-200 focus:bg-white/[0.14]"
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
                      className={`w-full rounded-lg px-2.5 py-1.5 text-[12px] font-normal text-white outline-none placeholder:text-white/30 transition-colors duration-200 focus:bg-white/[0.14] ${
                        numberTouched && !numberValid
                          ? "bg-auri-rose/10 ring-1 ring-auri-rose/60"
                          : "bg-white/10"
                      }`}
                      placeholder="000-0000"
                      inputMode="tel"
                    />
                  </div>
                  {draft.contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContactRow(contact.id)}
                      aria-label={`Remove contact ${i + 1}`}
                      className="mb-1.5 text-[13px] text-white/30 transition-all duration-200 hover:scale-125 hover:text-white/70 active:scale-90"
                    >
                      ×
                    </button>
                  )}
                </div>

                {numberTouched && !numberValid && (
                  <p className="mt-1 text-[9px] font-normal text-auri-rose">
                    enter a valid phone number (7–15 digits)
                  </p>
                )}

                {contact.name.trim() && numberValid && (
                  <div className="mt-2 flex gap-2">
                    <a
                      href={telHref(contact.number)}
                      className="flex-1 rounded-full bg-white/10 py-1 text-center text-[10px] font-bold text-white/80 transition-all duration-200 ease-fluid hover:-translate-y-px hover:bg-white/20 active:translate-y-0 active:scale-95"
                    >
                      call now
                    </a>
                    <a
                      href={smsHref(
                        contact.number,
                        `this is a test alert from auri — checking that ${contact.name.trim()} can be reached.`
                      )}
                      className="flex-1 rounded-full bg-white/10 py-1 text-center text-[10px] font-bold text-white/80 transition-all duration-200 ease-fluid hover:-translate-y-px hover:bg-white/20 active:translate-y-0 active:scale-95"
                    >
                      text now
                    </a>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addContactRow}
            className="flex w-full items-center justify-center gap-1.5 rounded-card border border-dashed border-white/20 py-2 text-[11px] font-bold text-white/70 transition-all duration-200 ease-fluid hover:-translate-y-px hover:border-white/35 hover:text-white active:translate-y-0 active:scale-[0.98]"
          >
            <span className="text-[13px] leading-none">+</span> add another contact
          </button>
        </div>
      </div>

      <div className="relative mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSave}
          className={`w-full rounded-full py-2 text-[12px] font-bold transition-all duration-200 ease-fluid hover:-translate-y-px active:translate-y-0 active:scale-[0.97] ${
            justSaved
              ? "animate-success-flash bg-auri-rose text-white"
              : "bg-white text-auri-black hover:shadow-[0_4px_20px_-4px_rgba(224,119,109,0.45)]"
          }`}
        >
          {justSaved ? "saved ✓" : "save"}
        </button>

        {(() => {
          const disabledReason = !draft.enabled
            ? "turn on the \"emergency contact\" switch above to enable this."
            : !primary
            ? "add a contact with a name and a valid phone number, then save, to enable this."
            : null;
          return (
            <button
              type="button"
              onClick={sendTestAlert}
              disabled={!draft.enabled || !primary || sending}
              title={disabledReason ?? undefined}
              className="w-full rounded-full bg-white/10 py-2 text-[12px] font-bold text-white/80 transition-all duration-200 ease-fluid hover:-translate-y-px hover:bg-white/20 active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
            >
              {sending ? "sending…" : justTested ? "test alert sent ✓" : "send test alert now"}
            </button>
          );
        })()}

        {(!draft.enabled || !primary) && (
          <p className="text-center text-[9px] font-semibold leading-snug text-auri-rose">
            {!draft.enabled
              ? "turn on the emergency contact switch above to enable the test alert button."
              : "add a contact with a name and a valid phone number, then hit save, to enable the test alert button."}
          </p>
        )}

        {testFeedback && (
          <p
            className={`text-center text-[9px] font-normal leading-snug ${
              testFeedback.kind === "sent" ? "text-auri-sage" : "text-auri-rose"
            }`}
          >
            {testFeedback.kind === "sent"
              ? testFeedback.text
              : `couldn't send automatically — opened your phone's app instead. (${testFeedback.text})`}
          </p>
        )}

        <p className="text-center text-[9px] font-normal leading-snug text-auri-muted">
          {primary
            ? "\"send test alert\" tries to send a real text/call automatically through your Twilio backend. If Twilio isn't set up yet, it opens your phone's call or messages app instead so you can send it yourself."
            : "add a contact with a name and number to enable real call/text alerts."}
        </p>
      </div>
    </div>
  );
}
