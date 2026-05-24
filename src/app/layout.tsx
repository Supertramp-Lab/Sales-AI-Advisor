import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
