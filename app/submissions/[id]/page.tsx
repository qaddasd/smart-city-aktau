"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase-client"
import { ArrowLeft, Trash2, CheckCircle2, Clock, XCircle, FileText } from "lucide-react"
import Link from "next/link"

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [record, setRecord] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [language, setLanguage] = useState<"ru" | "kz">("ru")

  const supabase = createBrowserClient()

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
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from("feedback").select("*").eq("id", id).single()
      setRecord(data)
      setLoading(false)
    }
    if (id) load()
  }, [id])

  const t = {
    ru: {
      loading: 'Загрузка…',
      notFound: 'Не найдено',
      category: 'Категория',
      delete: 'Удалить',
      deleting: 'Удаление…',
      confirm: 'Удалить жалобу?',
      statuses: { resolved: 'Решено', inProgress: 'В процессе', rejected: 'Отклонено', received: 'Получено' },
    },
    kz: {
      loading: 'Жүктелуде…',
      notFound: 'Табылмады',
      category: 'Санат',
      delete: 'Жою',
      deleting: 'Жойылуда…',
      confirm: 'Шағымды жою керек пе?',
      statuses: { resolved: 'Шешілді', inProgress: 'Орындалуда', rejected: 'Қабылданбады', received: 'Алынды' },
    },
  }

  const statusMap: Record<string, { icon: any; label: (lang: 'ru'|'kz') => string; color: string; bg: string }> = {
    "Resolved": { icon: CheckCircle2, label: (l) => t[l].statuses.resolved, color: "text-green-600", bg: "bg-green-50" },
    "In Progress": { icon: Clock, label: (l) => t[l].statuses.inProgress, color: "text-blue-600", bg: "bg-blue-50" },
    "Rejected": { icon: XCircle, label: (l) => t[l].statuses.rejected, color: "text-neutral-600", bg: "bg-neutral-100" },
    "Received": { icon: FileText, label: (l) => t[l].statuses.received, color: "text-orange-600", bg: "bg-orange-50" },
  }

  const onDelete = async () => {
    if (!record) return
    if (!confirm(t[language].confirm)) return
    setDeleting(true)
    await supabase.from("feedback").delete().eq("id", record.id)
    setDeleting(false)
    router.push("/submissions")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center text-neutral-600">{t[language].loading}</div>
    )
  }

  if (!record) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center text-neutral-600">{t[language].notFound}</div>
    )
  }

  const S = statusMap[record.status] || statusMap["Received"]
  const Icon = S.icon

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-neutral-50 md:h-screen">
      <div className="flex items-center justify-between bg-white px-4 py-4 border-b border-neutral-200">
        <Link href="/submissions" className="h-10 w-10 flex items-center justify-center hover:bg-neutral-100 rounded-lg -ml-2">
          <ArrowLeft className="h-6 w-6 text-black" />
        </Link>
        <h1 className="text-lg font-semibold text-black truncate">{record.title}</h1>
        <div className="h-10 w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${S.bg}`}>
                <Icon className={`h-5 w-5 ${S.color}`} />
              </div>
              <div className="text-sm text-neutral-600">{S.label(language)} · ID: #{record.case_id} · {new Date(record.created_at).toLocaleDateString(language === "ru" ? "ru-RU" : "kz-KZ")}</div>
            </div>
            <div className="text-sm text-neutral-600">{t[language].category}: {record.category || "—"}</div>
            <div className="mt-4 text-neutral-900 whitespace-pre-wrap">{record.description}</div>
          </div>

          <div className="flex gap-3">
            <button onClick={onDelete} disabled={deleting} className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Trash2 className="h-5 w-5" /> {deleting ? t[language].deleting : t[language].delete}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
