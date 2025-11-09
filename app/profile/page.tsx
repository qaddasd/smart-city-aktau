"use client"

import { useState, useEffect } from "react"
import { User, LogOut, Settings, FileText } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [stats, setStats] = useState({ submitted: 0, resolved: 0, pending: 0 })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    setUser(user)

    let { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()
    if (!profile) {
      await supabase.from("users").upsert({ id: user.id, email: user.email || "" }, { onConflict: "id" })
      const res = await supabase.from("users").select("*").eq("id", user.id).single()
      profile = res.data || null
    }
    if (profile) setUserData(profile)

    const { data: submissions } = await supabase.from("feedback").select("status").eq("user_id", user.id)

    if (submissions) {
      setStats({
        submitted: submissions.length,
        resolved: submissions.filter((s: any) => s.status === "Resolved").length,
        pending: submissions.filter((s: any) => s.status === "Received" || s.status === "In Progress").length,
      })
    }
  }

  const handleLogout = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  if (!user || !userData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-neutral-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-neutral-50 md:h-screen">
      <div className="bg-white border-b border-neutral-200 px-4 py-4">
        <h1 className="text-xl font-semibold text-black">Профиль</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-black text-white flex items-center justify-center text-2xl font-semibold">
                {userData.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("") || "U"}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-black">{userData.full_name || "Пользователь"}</h2>
                <p className="text-sm text-neutral-600">{userData.email}</p>
                {userData.phone && <p className="text-sm text-neutral-600">{userData.phone}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/profile/edit" className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50">
                <User className="h-5 w-5 text-neutral-600" />
                <span className="flex-1 font-medium text-black">Редактировать профиль</span>
                <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link href="/submissions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50">
                <FileText className="h-5 w-5 text-neutral-600" />
                <span className="flex-1 font-medium text-black">Мои жалобы</span>
                <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link href="/profile/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50">
                <Settings className="h-5 w-5 text-neutral-600" />
                <span className="flex-1 font-medium text-black">Настройки</span>
                <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600"
              >
                <LogOut className="h-5 w-5" />
                <span className="flex-1 font-medium text-left">Выйти</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <h3 className="font-semibold text-black mb-4">Статистика</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-black">{stats.submitted}</div>
                <div className="text-xs text-neutral-600">Отправлено</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-black">{stats.resolved}</div>
                <div className="text-xs text-neutral-600">Решено</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-black">{stats.pending}</div>
                <div className="text-xs text-neutral-600">В ожидании</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
