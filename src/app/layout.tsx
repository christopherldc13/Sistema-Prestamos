import React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Préstamos | Premium Management",
  description: "Gestión completa de préstamos, clientes y pagos con generación de PDF.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

// Se aplica antes de hidratar React para evitar el flash del tema incorrecto al cargar
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
        <Providers>
          <div className="layout-container">
            <Navbar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </Providers>
        </ThemeProvider>


        <style dangerouslySetInnerHTML={{
          __html: `
          .layout-container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          .main-content {
            flex: 1;
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
            width: 100%;
          }

          @media (max-width: 768px) {
            .main-content {
              padding: 1rem 0.75rem;
            }
          }

        `}} />
      </body>
    </html>
  );
}

// Simple Link mock as I'm writing layout first
function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href}>{children}</a>;
}
