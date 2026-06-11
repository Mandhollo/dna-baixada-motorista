import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import BottomNav from "@/components/layout/BottomNav";
import InstallBanner from "@/components/ui/InstallBanner";

export const metadata: Metadata = {
  title: "DNA Baixada Motorista",
  description: "App para motoristas DNA Baixada - Transporte Executivo",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-[#0f172a] text-[#f8fafc] min-h-dvh antialiased">
        <AuthProvider>
          <main className="pb-20 min-h-dvh">{children}</main>
          <BottomNav />
          <InstallBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
