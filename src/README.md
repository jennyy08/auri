# auri — project structure (Next.js App Router)

```
src/
  app/
    layout.tsx                          # wraps every route in <AuriStoreProvider><PhoneFrame>
    globals.css                         # Tailwind v4 import + @theme tokens
    page.tsx                            # "/"                       — Home splash
    customize/
      page.tsx                          # "/customize"              — toggles + links
      target-spaces/page.tsx            # "/customize/target-spaces"
      sound-selection/page.tsx          # "/customize/sound-selection"
      history/page.tsx                  # "/customize/history"
      emergency-contact/page.tsx        # "/customize/emergency-contact"
  components/
    PhoneFrame.tsx    # centers + scales the phone screen to fit the viewport
    ScreenHeader.tsx   # back button (router.back()) + title
    NavCard.tsx        # colored tappable rows (router.push())
    Toggle.tsx         # haptics / lights / per-sound switches
    Chip.tsx           # sound tag pills
  lib/
    auri-store.tsx     # shared state (sounds, spaces, emergency contact, history),
                        # persisted to localStorage, read/written from every screen
postcss.config.js       # Tailwind v4 PostCSS plugin
```

## What's new

- **Sound selection**
  - "add a sound" lets you type in any custom sound name and pick a
    classification for it (urgent / medium / low priority). It's added to
    the shared sound list immediately and can be toggled or removed like
    any other sound.
  - Every sound now has a classification badge (tap it to cycle
    urgent → medium → low). Classification also drives a global
    **"notify me for"** filter (all sounds / urgent & medium / urgent only) —
    sounds outside the selected level are still "detected" but dimmed and
    won't alert you.
- **Target spaces** — the "+" chip on each space now opens a picker of every
  sound from Sound Selection that isn't already in that space; tapping one
  adds it. Chips can be removed with their "×".
- **Emergency contact**
  - The sentence at the top is no longer a placeholder — it's generated
    live from your actual method, contact name(s), and thresholds
    ("auri will text Mom and Dad if an urgent sound is detected more than
    3 times in 5 minutes"), and updates as you type.
  - A real **enabled/disabled** toggle, an **add another contact** button,
    and a **save** button that persists your settings (shared store +
    localStorage) with a "saved ✓" confirmation.
  - **Call now / text now** buttons on each contact use `tel:` / `sms:`
    links, which hand off to the phone's real dialer/messaging app — the
    same thing that would fire automatically once the threshold is hit.
    A **"send test alert now"** button simulates that automatic trigger for
    your primary contact. True unattended/background calling (without the
    person tapping anything) needs a server-side telephony service such as
    Twilio, since a browser page can't place calls on its own — this is the
    closest a client-only app can get to "actually contacting them."
- **History** now pulls sound names/classification from the shared sound
  list, and new detections (e.g. from a test alert) are logged live.
- All of this state lives in `lib/auri-store.tsx` and is saved to
  `localStorage`, so it survives refreshes and is shared across every route.

Routing now uses **Next's own router** (`next/navigation`'s `useRouter`) instead of
`react-router-dom` — each screen is a real route Next.js knows about, so
`router.push("/customize/history")` and `router.back()` just work, and you get
proper URLs/back-button behavior for free. You can uninstall `react-router-dom`,
it's no longer used anywhere.

## Merging into your existing project

1. Copy `src/app/*` and `src/components/*` into your project's `src/`
   (merge `globals.css` with your existing one rather than overwriting it,
   if you've already customized it).
2. Replace your root `postcss.config.js` with the one here — it fixes the
   `@tailwindcss/postcss` error from Tailwind v4.
3. Make sure `@tailwindcss/postcss` is installed:
   ```
   npm install -D @tailwindcss/postcss
   ```
4. You can remove `react-router-dom` if you'd installed it for the previous
   version of this:
   ```
   npm uninstall react-router-dom
   ```
5. `npm run dev`.

## How the scaling works

`PhoneFrame.tsx` treats 396.01 × 824.6 (radius 57.28) as the *design* size from
your Figma frame and drives one CSS variable, `--phone-h`, as the smallest of:
the real height (824.6px), 88% of viewport height, or the width-constrained
equivalent. Width and corner radius are both derived from that variable with
`calc()`, so the whole screen — corners included — scales together.

## Colors & fonts (Tailwind v4)

Tailwind v4 is CSS-first: instead of `tailwind.config.js`, the `auri` palette
and fonts are defined directly in `globals.css` under `@theme`, and Tailwind
auto-generates the matching utilities (`bg-auri-teal`, `text-auri-blush`,
`font-display`, `rounded-phone`, etc). Edit the values there if you want to
retune the palette.

## Routes

| Path                              | File                                         |
| ---------------------------------- | --------------------------------------------- |
| `/`                                 | `src/app/page.tsx`                            |
| `/customize`                        | `src/app/customize/page.tsx`                  |
| `/customize/target-spaces`          | `src/app/customize/target-spaces/page.tsx`    |
| `/customize/sound-selection`        | `src/app/customize/sound-selection/page.tsx`  |
| `/customize/history`                | `src/app/customize/history/page.tsx`          |
| `/customize/emergency-contact`      | `src/app/customize/emergency-contact/page.tsx`|

## Notes

- `SoundSelection` and `History` are built from what was visible in your
  cropped screenshot — swap in your real sound list / history data.
- Every route file is a Client Component (`"use client"`) since they use
  `useState` and/or `useRouter`. `PhoneFrame` and `layout.tsx` stay server
  components since they don't need interactivity.
- When you're ready to wire up real Arduino data (sound detection, haptics),
  that state can live in a context provider inside `layout.tsx`, above
  `{children}`, so every route can read it.
