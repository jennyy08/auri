# auri (Next.js App Router)

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
    PhoneFrame.tsx     # centers + scales the phone screen to fit the viewport
    ScreenHeader.tsx    # back button (router.back()) + title
    NavCard.tsx         # colored tappable rows (router.push())
    Toggle.tsx          # haptics / lights / per-sound switches
    Chip.tsx            # sound tag pills
  lib/
    auri-store.tsx      # shared state (sounds, spaces, emergency contact, history),
                         # persisted to localStorage, read/written from every screen
postcss.config.mjs       # Tailwind v4 PostCSS plugin
```

## Emergency contact

There's no backend telephony service wired up. "call now" / "text now" and
"send test alert now" all use `tel:` / `sms:` links, which hand off to the
phone's own dialer/messaging app — a manual "reach them yourself right now"
shortcut. "send test alert now" additionally logs a test detection to
History so you can see what an automatic trigger would look like.

If you want real unattended (no-tap) alerts later, that needs a server-side
telephony service such as Twilio, added back as a route handler under
`src/app/api/`.

## Getting started

```
npm install
npm run dev
```

## Routes

| Path                            | File                                            |
| -------------------------------- | ------------------------------------------------ |
| `/`                               | `src/app/page.tsx`                                |
| `/customize`                      | `src/app/customize/page.tsx`                      |
| `/customize/target-spaces`        | `src/app/customize/target-spaces/page.tsx`        |
| `/customize/sound-selection`      | `src/app/customize/sound-selection/page.tsx`      |
| `/customize/history`              | `src/app/customize/history/page.tsx`              |
| `/customize/emergency-contact`    | `src/app/customize/emergency-contact/page.tsx`    |

## Notes

- Every route file is a Client Component (`"use client"`) since they use
  `useState` and/or `useRouter`. `PhoneFrame` and `layout.tsx` stay server
  components since they don't need interactivity.
- State lives in `lib/auri-store.tsx` and is saved to `localStorage`, so it
  survives refreshes and is shared across every route.
- When you're ready to wire up real Arduino data (sound detection, haptics),
  that state can live in a context provider inside `layout.tsx`, above
  `{children}`, so every route can read it.
