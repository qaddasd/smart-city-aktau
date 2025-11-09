import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppLayout } from "@/components/app-layout"
import { ToastProvider } from "@/lib/toast"
import { PWAClient } from "@/components/pwa-client"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "Smart City Актау",
  description: "Платформа для гражданского участия",
  generator: 'Mitelis Team',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  }
}

export const viewport: Viewport = {
  themeColor: '#111111',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <ToastProvider>
          <SidebarProvider>
            <AppLayout>{children}</AppLayout>
          </SidebarProvider>
          <PWAClient />
        </ToastProvider>
      </body>
    </html>
  )
}
