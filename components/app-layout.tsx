"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { MapIcon, ListIcon, BarChart3Icon, UserIcon, LayoutDashboardIcon, Plus, Newspaper, Shield } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ReportForm } from "@/components/report-form"
import { createBrowserClient } from "@/lib/supabase-client"

const ADMIN_EMAIL = "ch.qynon@gmail.com"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [openReport, setOpenReport] = useState(false)
  const [lang, setLang] = useState<'ru' | 'kz'>('ru')
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createBrowserClient()
  useEffect(() => {
    try {
      const v = localStorage.getItem('lang') as 'ru' | 'kz' | null
      if (v === 'ru' || v === 'kz') setLang(v)
    } catch {}
    
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setIsAdmin(user?.email === ADMIN_EMAIL)
      } catch {}
    }
    checkAdmin()
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang)
      try {
        window.dispatchEvent(new CustomEvent('lang-change', { detail: lang }))
      } catch {}
      try {
        document.documentElement.lang = lang === 'ru' ? 'ru' : 'kk'
      } catch {}
    }
  }, [lang])

  // Don't show layout on login/register pages
  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="border-b border-neutral-200 px-4 py-4 bg-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
              <LayoutDashboardIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-black">Smart City</span>
          </motion.div>
        </SidebarHeader>

        <SidebarContent className="bg-white">
          <SidebarMenu className="p-2 gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip={lang==='ru'?"Отчеты":"Есептер"}>
                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5">
                  <LayoutDashboardIcon className="h-5 w-5" />
                  <span>{lang==='ru'?"Отчеты":"Есептер"}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/" || pathname === "/map"} tooltip={lang==='ru'?"Карта":"Карта"}>
                <Link href="/map" className="flex items-center gap-3 px-3 py-2.5">
                  <MapIcon className="h-5 w-5" />
                  <span>{lang==='ru'?"Карта":"Карта"}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/news"} tooltip={lang==='ru'?"Новости":"Жаңалықтар"}>
                <Link href="/news" className="flex items-center gap-3 px-3 py-2.5">
                  <Newspaper className="h-5 w-5" />
                  <span>{lang==='ru'?"Новости":"Жаңалықтар"}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarSeparator />
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/submissions"} tooltip={lang==='ru'?"Жалобы":"Шағымдар"}>
                <Link href="/submissions" className="flex items-center gap-3 px-3 py-2.5">
                  <ListIcon className="h-5 w-5" />
                  <span>{lang==='ru'?"Жалобы":"Шағымдар"}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/analytics"} tooltip={lang==='ru'?"Аналитика":"Аналитика"}>
                <Link href="/analytics" className="flex items-center gap-3 px-3 py-2.5">
                  <BarChart3Icon className="h-5 w-5" />
                  <span>{lang==='ru'?"Аналитика":"Аналитика"}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/profile"} tooltip={lang==='ru'?"Профиль":"Профиль"}>
                <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5">
                  <UserIcon className="h-5 w-5" />
                  <span>{lang==='ru'?"Профиль":"Профиль"}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isAdmin && (
              <>
                <SidebarSeparator />
                <div className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase">
                  {lang==='ru'?'Админ':'Әкімші'}
                </div>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin/feedback"} tooltip={lang==='ru'?"Управление жалобами":"Шағымдарды басқару"}>
                    <Link href="/admin/feedback" className="flex items-center gap-3 px-3 py-2.5">
                      <Shield className="h-5 w-5" />
                      <span>{lang==='ru'?"Жалобы":"Шағымдар"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin/news"} tooltip={lang==='ru'?"Управление новостями":"Жаңалықтарды басқару"}>
                    <Link href="/admin/news" className="flex items-center gap-3 px-3 py-2.5">
                      <Newspaper className="h-5 w-5" />
                      <span>{lang==='ru'?"Новости":"Жаңалықтар"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-neutral-200 bg-white">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setOpenReport(true)}
            className="w-full bg-black text-white rounded-xl py-3 px-4 font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {lang==='ru'? 'Отправить жалобу' : 'Шағым жіберу'}
          </motion.button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white/80 backdrop-blur-md px-4"
        >
          <SidebarTrigger />
          <div className="flex-1" />
          <div className="flex items-center rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLang('ru')}
              className={`px-3 py-1.5 text-sm transition-colors ${lang==='ru'?'bg-neutral-900 text-white':'bg-white text-neutral-700 hover:bg-neutral-50'}`}
            >
              RU
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLang('kz')}
              className={`px-3 py-1.5 text-sm transition-colors ${lang==='kz'?'bg-neutral-900 text-white':'bg-white text-neutral-700 hover:bg-neutral-50'}`}
            >
              KZ
            </motion.button>
          </div>
        </motion.header>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </SidebarInset>

      <MobileNav />

      <Sheet open={openReport} onOpenChange={setOpenReport}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-white p-0">
          <SheetHeader className="px-6 py-4 border-b border-neutral-200">
            <SheetTitle>{lang==='ru'? 'Отправить жалобу' : 'Шағым жіберу'}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ReportForm onClose={() => setOpenReport(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
