import type { Metadata } from "next";
import { Caveat_Brush, Fredoka } from "next/font/google";
import "./globals.css";

const display = Caveat_Brush({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
const body = Fredoka({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Where's Daddy?",
  description: "9 days of surprises while Daddy's away.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-paper text-ink font-body antialiased">{children}</body>
    </html>
  );
}
