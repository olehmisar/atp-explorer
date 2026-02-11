import DisclaimerBanner from "@/components/DisclaimerBanner";
import { QueryProvider } from "@/components/QueryProvider";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATP Explorer - Aztec Token Position Stats",
  description: "Explorer showing statistics for Aztec Token Positions (ATPs)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <DisclaimerBanner />
        <main className="flex-1">
          <QueryProvider>{children}</QueryProvider>
        </main>
        <Analytics />
      </body>
    </html>
  );
}
