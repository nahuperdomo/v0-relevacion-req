import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SidebarNav } from "@/components/sidebar-nav"
import { ErrorAlertProvider } from "@/components/error-alert"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LAiB - Plataforma de Relevamiento",
  description: "Sistema de relevamiento automatizado de requerimientos con agentes conversacionales de IA",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/logolaib.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logolaib.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logolaib.png",
        type: "image/png",
      },
    ],
    apple: "/logolaib.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`font-sans antialiased`}>
        <ErrorAlertProvider>
          <AuthProvider>
            <div className="flex h-screen bg-background">
              <SidebarNav />
              <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
            </div>
          </AuthProvider>
          <Analytics />
        </ErrorAlertProvider>
      </body>
    </html>
  )
}
