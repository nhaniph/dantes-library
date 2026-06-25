import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dante's Library",
  description: "Trade setup journal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
