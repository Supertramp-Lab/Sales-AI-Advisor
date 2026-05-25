import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: "Appier AI Deal Room",
  description: "Revenue Intelligence Hub for Appier Enterprise Solutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full" style={{ fontFamily: "'Noto Sans JP','Inter','DM Sans',sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
