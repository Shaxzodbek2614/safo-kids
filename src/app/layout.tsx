import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "Safo Kids — boshqaruv tizimi",
    template: "%s · Safo Kids",
  },
  description: "Safo Kids bolalar bogʻchalari uchun boshqaruv tizimi",
};

export const viewport: Viewport = {
  themeColor: "#0b7c80",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
