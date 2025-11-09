"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

const ADMIN_EMAIL = "ch.qynon@gmail.com"

type EditState = { status: string; comment: string }

export default function AdminFeedbackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, EditState>>({})
  const [activeTab, setActiveTab] = useState(0)
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
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (user.email !== ADMIN_EMAIL) { router.push('/dashboard'); return }
      setAllowed(true)
      await load()
    }
    init()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false })
    const loaded = data || []
    setRows(loaded)
    const initialEdits: Record<string, EditState> = {}
    loaded.forEach((r: any) => { initialEdits[r.id] = { status: r.status, comment: r.admin_comment || '' } })
    setEdits(initialEdits)
    setLoading(false)
  }

  const save = async (id: string) => {
    const edit = edits[id]
    if (!edit) return
    setSavingId(id)
    await fetch('/api/feedback/admin/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: edit.status, comment: edit.comment }) })
    setSavingId(null)
    await load()
  }

  const updateEdit = (id: string, field: 'status' | 'comment', value: string) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const t = {
    ru: {
      title: 'Админ · Жалобы',
      loading: 'Загрузка…',
      empty: 'Нет жалоб',
      open: 'Открыть',
      comment: 'Комментарий',
      save: 'Сохранить',
      saving: 'Сохранение…',
      all: 'Все',
      received: 'Получено',
      inProgress: 'В процессе',
      resolved: 'Решено',
      rejected: 'Отклонено',
    },
    kz: {
      title: 'Әкімші · Шағымдар',
      loading: 'Жүктелуде…',
      empty: 'Шағымдар жоқ',
      open: 'Ашу',
      comment: 'Түсініктеме',
      save: 'Сақтау',
      saving: 'Сақталуда…',
      all: 'Барлығы',
      received: 'Алынды',
      inProgress: 'Орындалуда',
      resolved: 'Шешілді',
      rejected: 'Қабылданбады',
    },
  }

  const tabs = [
    { id: 0, label: t[language].all },
    { id: 1, label: t[language].received, status: 'Received' },
    { id: 2, label: t[language].inProgress, status: 'In Progress' },
    { id: 3, label: t[language].resolved, status: 'Resolved' },
    { id: 4, label: t[language].rejected, status: 'Rejected' },
  ]

  const filtered = activeTab === 0 ? rows : rows.filter(r => r.status === tabs[activeTab].status)

  if (!allowed && !loading) return null

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-neutral-50 md:h-screen">
      <div className="bg-white border-b border-neutral-200 px-4 py-4">
        <h1 className="text-lg font-semibold text-black mb-4">{t[language].title}</h1>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-3">
          {loading && <div className="text-neutral-600">{t[language].loading}</div>}
          {!loading && filtered.length === 0 && <div className="text-neutral-500">{t[language].empty}</div>}
          {!loading && filtered.map((r) => {
            const edit = edits[r.id]
            if (!edit) return null
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-neutral-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-black">{r.title}</div>
                    <div className="text-xs text-neutral-500">#{r.case_id} · {new Date(r.created_at).toLocaleString(language === 'ru' ? 'ru-RU' : 'kk-KZ')}</div>
                  </div>
                  <a className="text-xs underline text-neutral-600" href={`/submissions/${r.id}`}>{t[language].open}</a>
                </div>
                <div className="mt-3 text-sm text-neutral-700 whitespace-pre-wrap">{r.description}</div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={edit.status}
                    onChange={(e) => updateEdit(r.id, 'status', e.target.value)}
                    className="border border-neutral-300 rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="Received">{t[language].received}</option>
                    <option value="In Progress">{t[language].inProgress}</option>
                    <option value="Resolved">{t[language].resolved}</option>
                    <option value="Rejected">{t[language].rejected}</option>
                  </select>
                  <input
                    value={edit.comment}
                    onChange={(e) => updateEdit(r.id, 'comment', e.target.value)}
                    placeholder={t[language].comment}
                    className="border border-neutral-300 rounded-xl px-3 py-2 text-sm bg-white"
                  />
                  <button
                    onClick={() => save(r.id)}
                    disabled={savingId === r.id}
                    className="bg-black text-white rounded-xl px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {savingId === r.id ? t[language].saving : t[language].save}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
