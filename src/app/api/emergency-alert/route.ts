import { NextResponse } from "next/server";
import twilio from "twilio";

// this route is what turns "auri" from a demo into something that can
// actually reach a person: it runs on the SERVER (never in the browser),
// so it's the only safe place to hold real Twilio credentials.
//
// SETUP (do this once):
//   1. npm install twilio
//   2. sign up at https://www.twilio.com/try-twilio, buy/verify a phone
//      number (Twilio gives you a free trial number + credit to start)
//   3. create a .env.local file in your project root with:
//        TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//        TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//        TWILIO_FROM_NUMBER=+15551234567   <- the number Twilio gave you
//   4. restart `npm run dev` (env vars are only read at startup)
//
// On Twilio's free trial, you can only text/call phone numbers you've
// manually verified in the Twilio console (Console > Phone Numbers >
// Verified Caller IDs) until you upgrade to a paid account. That's a
// Twilio account-level restriction, not something this code controls.

type AlertMethod = "text" | "call" | "both";

interface AlertRequestBody {
  to: string;
  method: AlertMethod;
  message: string;
}

function missingEnvVars() {
  const missing: string[] = [];
  if (!process.env.TWILIO_ACCOUNT_SID) missing.push("TWILIO_ACCOUNT_SID");
  if (!process.env.TWILIO_AUTH_TOKEN) missing.push("TWILIO_AUTH_TOKEN");
  if (!process.env.TWILIO_FROM_NUMBER) missing.push("TWILIO_FROM_NUMBER");
  return missing;
}

// Twilio matches verified caller IDs (and sends messages/calls) using strict
// E.164 formatting (+1XXXXXXXXXX, no spaces/dashes/parens). The contact form
// in the app doesn't force that format, so "343-297-6867" and "+13432976867"
// look like two different numbers to Twilio even though they're the same
// phone — which shows up as "not a verified recipient" even when it IS
// verified. Normalize here so formatting quirks can't cause that mismatch.
// NOTE: this assumes US/Canada (+1) for any number that doesn't already
// start with "+" — fine for this app's current single-country contact form,
// but would need a country picker to support other countries properly.
function normalizeToE164(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.slice(1).replace(/\D/g, "");
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+1${digits}`;
}

export async function POST(req: Request) {
  let body: AlertRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  const { to: rawTo, method, message } = body;

  if (!rawTo || !method || !message) {
    return NextResponse.json(
      { error: "missing 'to', 'method', or 'message'" },
      { status: 400 }
    );
  }

  const to = normalizeToE164(rawTo);

  const missing = missingEnvVars();
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `Twilio isn't configured yet — missing ${missing.join(", ")}. Add these to a .env.local file (see comments in src/app/api/emergency-alert/route.ts) and restart the dev server.`,
        configured: false,
      },
      { status: 501 }
    );
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const from = normalizeToE164(process.env.TWILIO_FROM_NUMBER!);

  const results: { text?: string; call?: string } = {};

  try {
    if (method === "text" || method === "both") {
      const sms = await client.messages.create({ to, from, body: message });
      results.text = sms.sid;
    }
    if (method === "call" || method === "both") {
      // Twilio calls need TwiML (instructions for what to say/do on
      // answer) — <Say> uses Twilio's built-in text-to-speech so the
      // call actually speaks your alert message aloud.
      const twiml = `<Response><Say>${message.replace(/[<>&]/g, "")}</Say></Response>`;
      const call = await client.calls.create({ to, from, twiml });
      results.call = call.sid;
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown Twilio error";
    return NextResponse.json({ error: `Twilio couldn't send it: ${detail}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true, configured: true, results });
}
