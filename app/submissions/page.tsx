"use client"

import { ArrowLeft, CheckCircle2, Clock, FileText, XCircle, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase-client"

export default function MySubmissionsPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [language, setLanguage] = useState<"ru" | "kz">("ru")

  useEffect(() => {
    try {
      const saved = (localStorage.getItem("lang") as "ru" | "kz" | null) || "ru"
      setLanguage(saved)
    } catch {}
    const onLang = (ev: any) => { const v = ev?.detail; if (v === 'ru' || v === 'kz') setLanguage(v) }
    window.addEventListener('lang-change', onLang as any)
    return () => window.removeEventListener('lang-change', onLang as any)
  }, [])

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    const supabase = createBrowserClient()
    const { data } = await supabase.from("feedback").select("*").order("created_at", { ascending: false })
    if (data) setSubmissions(data)
  }

  const t = {
    ru: {
      title: "Мои жалобы",
      tabs: ["Все", "В процессе", "Решено", "Получено"],
      status: { resolved: "Решено", inProgress: "В процессе", rejected: "Отклонено", received: "Получено" },
      empty: "Жалоб пока нет",
    },
    kz: {
      title: "Менің шағымдарым",
      tabs: ["Барлығы", "Орындалуда", "Шешілді", "Алынды"],
      status: { resolved: "Шешілді", inProgress: "Орындалуда", rejected: "Қабылданбады", received: "Алынды" },
      empty: "Шағымдар әлі жоқ",
    },
  }

  const tabs = t[language].tabs

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Resolved":
        return { icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" }
      case "In Progress":
        return { icon: Clock, bg: "bg-blue-50", color: "text-blue-600" }
      case "Rejected":
        return { icon: XCircle, bg: "bg-neutral-100", color: "text-neutral-600" }
      default:
        return { icon: FileText, bg: "bg-orange-50", color: "text-orange-600" }
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "Resolved":
        return t[language].status.resolved
      case "In Progress":
        return t[language].status.inProgress
      case "Rejected":
        return t[language].status.rejected
      default:
        return t[language].status.received
    }
  }

  const filtered = submissions.filter((s) => {
    if (activeTab === 1) return s.status === "In Progress"
    if (activeTab === 2) return s.status === "Resolved"
    if (activeTab === 3) return s.status === "Received"
    return true
  })

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-neutral-50 md:h-screen">
      <div className="flex items-center justify-between bg-white px-4 py-4 border-b border-neutral-200">
        <Link
          href="/map"
          className="h-10 w-10 flex items-center justify-center hover:bg-neutral-100 rounded-lg -ml-2 md:hidden"
        >
          <ArrowLeft className="h-6 w-6 text-black" />
        </Link>
        <h1 className="text-lg font-semibold text-black">{t[language].title}</h1>
        <div className="h-10 w-10 md:hidden" />
      </div>

      <div className="overflow-x-auto bg-white border-b border-neutral-200">
        <div className="flex gap-2 px-4 py-3">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`h-9 shrink-0 rounded-full px-5 text-sm font-medium transition-colors ${
                index === activeTab
                  ? "bg-blue-600 text-white"
                  : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 md:pb-4 md:mx-auto md:w-full md:max-w-2xl">
        <div className="bg-white divide-y divide-neutral-200">
          {filtered.map((submission) => {
            const statusData = getStatusIcon(submission.status)
            const IconComponent = statusData.icon
            return (
              <Link href={`/submissions/${submission.id}`} key={submission.id} className="block transition-colors hover:bg-neutral-50 cursor-pointer">
                <div className="flex items-center gap-3 px-4 py-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${statusData.bg}`}>
                    <IconComponent className={`h-6 w-6 ${statusData.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-black mb-0.5">{submission.title}</h3>
                    <p className="text-sm text-neutral-600">
                      {getStatusText(submission.status)} | ID: #{submission.case_id} |{" "}
                      {new Date(submission.created_at).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'kk-KZ')}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" />
                </div>
              </Link>
            )
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-neutral-500">
              <p>{t[language].empty}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
