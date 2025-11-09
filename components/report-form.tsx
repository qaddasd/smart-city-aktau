"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { useToast } from "@/lib/toast"

export function ReportForm({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { addToast } = useToast()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    const { data: inserted, error } = await supabase.from("feedback").insert({
      user_id: user.id,
      title,
      description,
      category,
      status: "Received",
      case_id: `C-${Date.now().toString().slice(-5)}`,
    }).select('id,title').single()

    if (error) {
      console.error("Error submitting feedback:", error)
      addToast({
        type: "error",
        title: "Ошибка отправки",
        description: error.message,
      })
    } else {
      addToast({
        type: "success",
        title: "Жалоба отправлена!",
        description: "Мы рассмотрим вашу жалобу в ближайшее время",
      })
      try { await fetch('/api/feedback/notify-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: inserted?.id, title }) }) } catch {}
      onClose()
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-black mb-2">Заголовок</label>
        <input
          type="text"
          placeholder="Яма на главной улице"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">Описание</label>
        <textarea
          placeholder="Пожалуйста, опишите проблему подробно..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">Категория</label>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 text-black appearance-none focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Выберите категорию</option>
            <option value="roads">Дороги и инфраструктура</option>
            <option value="safety">Общественная безопасность</option>
            <option value="parks">Парки и отдых</option>
            <option value="utilities">Коммунальные услуги</option>
            <option value="other">Другое</option>
          </select>
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <button
        type="button"
        className="w-full border-2 border-dashed border-neutral-300 rounded-xl py-10 flex flex-col items-center justify-center gap-2 hover:border-neutral-400 transition-colors bg-neutral-50"
      >
        <div className="h-12 w-12 bg-neutral-200 rounded-full flex items-center justify-center">
          <svg className="h-6 w-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="font-semibold text-black">Прикрепить фото или видео</span>
      </button>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white rounded-xl py-4 font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
      >
        {loading ? "Отправка..." : "Отправить"}
      </button>
    </form>
  )
}
