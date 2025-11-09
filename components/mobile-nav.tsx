"use client"
import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { MapIcon, ListIcon, BarChart3Icon, UserIcon, LayoutDashboardIcon, Newspaper } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ReportForm } from "@/components/report-form"

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboardIcon, label: "Отчеты" },
    { href: "/map", icon: MapIcon, label: "Карта" },
    { href: "/news", icon: Newspaper, label: "Новости" },
    { href: "/submissions", icon: ListIcon, label: "Жалобы" },
    { href: "/analytics", icon: BarChart3Icon, label: "Аналитика" },
    { href: "/profile", icon: UserIcon, label: "Профиль" },
  ]

  if (pathname === "/login" || pathname === "/register") {
    return null
  }

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-[1300] md:hidden bg-white border-t border-neutral-200 shadow-lg"
      >
        <div className="flex items-center justify-around px-2 pb-safe">
          {/* First 3 items */}
          {navItems.slice(0, 3).map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex-1"
              >
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center h-16 gap-1"
                >
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Icon className={`h-6 w-6 transition-colors ${isActive ? "text-black" : "text-neutral-400"}`} />
                  </motion.div>
                  <span className={`text-[10px] transition-colors ${isActive ? "text-black font-medium" : "text-neutral-400"}`}>
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            )
          })}

          {/* Centered complaint button */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            className="flex-1 flex justify-center"
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setOpen(true)}
              className="flex flex-col items-center justify-center h-16 gap-1 -mt-6"
            >
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.3 }}
                className="h-14 w-14 rounded-full bg-black flex items-center justify-center shadow-lg"
              >
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </motion.div>
              <span className="text-[10px] text-black font-medium">Жалоба</span>
            </motion.button>
          </motion.div>

          {/* Last 3 items */}
          {navItems.slice(3).map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: (index + 3) * 0.05 }}
                className="flex-1"
              >
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center h-16 gap-1"
                >
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Icon className={`h-6 w-6 transition-colors ${isActive ? "text-black" : "text-neutral-400"}`} />
                  </motion.div>
                  <span className={`text-[10px] transition-colors ${isActive ? "text-black font-medium" : "text-neutral-400"}`}>
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[92vh] bg-white border-t border-neutral-200 p-0 rounded-t-3xl">
          <SheetHeader className="px-6 py-4 border-b border-neutral-200">
            <SheetTitle>Отправить жалобу</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ReportForm onClose={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
