import { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

/**
 * Centers a fixed-aspect "phone screen" in the middle of the viewport and
 * scales it down to fit, using the Figma frame spec:
 *   W 396.01  H 824.6  radius 57.28  (radius/width ratio ≈ 0.1446)
 *
 * Everything is driven by CSS custom properties so the corner radius,
 * padding, etc. all scale proportionally with the frame instead of the
 * radius staying fixed while the box shrinks.
 */
export default function PhoneFrame({ children }: PhoneFrameProps) {
  const ratio = 436 / 824.6; // width / height — ~10% wider than the original 396.01 figma frame

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-6">
      {/* soft ambient glow behind the device */}
      <div
        className="pointer-events-none absolute h-[60vh] w-[60vh] rounded-full bg-auri-lilac/10 blur-[120px]"
        aria-hidden
      />

      <div
        style={
          {
            "--phone-h": `min(824.6px, 88vh, ${88 / ratio}vw)`,
            "--phone-w": "calc(var(--phone-h) * " + ratio + ")",
            "--phone-r": "calc(var(--phone-w) * 0.14464)",
            width: "var(--phone-w)",
            height: "var(--phone-h)",
            borderRadius: "var(--phone-r)",
          } as React.CSSProperties
        }
        className="relative overflow-hidden bg-auri-black shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_40px_80px_-20px_rgba(0,0,0,0.8)]"
      >
        <div className="phone-scroll h-full w-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
