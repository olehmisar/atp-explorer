import { QueryProvider } from "@/components/QueryProvider";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATP Dashboard - Aztec Token Position Stats",
  description: "Dashboard showing statistics for Aztec Token Positions (ATPs)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
