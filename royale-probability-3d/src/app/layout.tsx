import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruleta Casino",
  description: "Ruleta Casino 3D interactiva con iluminación realista y ambiente de salón de casino.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-obsidian-950 text-zinc-100 min-h-[100dvh] flex flex-col selection:bg-gold-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}

