import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Tech Equipment Manager",
  description: "Gestión de equipos técnicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.className} antialiased`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 lg:ml-64 p-4 lg:p-8 transition-all duration-300">
            <Toaster position="top-right" />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
