import type { Metadata } from "next";
import type { ReactNode } from "react";
import PhoneFrame from "../components/PhoneFrame";
import { AuriStoreProvider } from "../lib/auri-store";
import "./globals.css";

export const metadata: Metadata = {
  title: "auri",
  description: "sound → sensation",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuriStoreProvider>
          <PhoneFrame>{children}</PhoneFrame>
        </AuriStoreProvider>
      </body>
    </html>
  );
}
