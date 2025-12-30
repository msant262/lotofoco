import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "LotoFoco - Inteligência Artificial para Loterias",
  description: "Aumente suas chances com estatísticas avançadas e palpites gerados por IA Avançada.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "LotoFoco - A revolução das Loterias",
    description: "Plataforma SaaS de análise estatística e geração de palpites.",
    url: "https://lotofoco.com.br",
    siteName: "LotoFoco",
    images: [
      {
        url: "https://lotofoco.com.br/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LotoFoco Dashboard",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

import { Navbar } from "@/components/layout/navbar";

import { AuthProvider } from "@/components/providers/auth-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          outfit.variable
        )}
      >
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
