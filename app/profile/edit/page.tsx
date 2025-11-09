"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"

export default function ProfileEditPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
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
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) {
        setFullName(data.full_name || '')
        setPhone(data.phone || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('users').update({ full_name: fullName, phone }).eq('id', user.id)
    setSaving(false)
    router.push('/profile')
    router.refresh()
  }

  const t = {
    ru: {
      loading: 'Загрузка…',
      title: 'Редактировать профиль',
      name: 'Имя',
      phone: 'Телефон',
      cancel: 'Отмена',
      save: 'Сохранить',
      saving: 'Сохранение…',
    },
    kz: {
      loading: 'Жүктелуде…',
      title: 'Профильді өңдеу',
      name: 'Аты',
      phone: 'Телефон',
      cancel: 'Болдырмау',
      save: 'Сақтау',
      saving: 'Сақталуда…',
    },
  }

  if (loading) return <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center text-neutral-600">{t[language].loading}</div>

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-neutral-50 md:h-screen">
      <div className="bg-white border-b border-neutral-200 px-4 py-4">
        <h1 className="text-lg font-semibold text-black">{t[language].title}</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-xl mx-auto bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">{t[language].name}</label>
            <input value={fullName} onChange={(e)=>setFullName(e.target.value)} className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">{t[language].phone}</label>
            <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3" />
          </div>
          <div className="flex gap-3">
            <button onClick={()=>router.push('/profile')} className="flex-1 border border-neutral-300 rounded-xl px-4 py-3">{t[language].cancel}</button>
            <button onClick={save} disabled={saving} className="flex-1 bg-black text-white rounded-xl px-4 py-3 disabled:opacity-50">{saving ? t[language].saving : t[language].save}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
