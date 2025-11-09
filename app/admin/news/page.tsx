"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"

const ADMIN_EMAIL = "ch.qynon@gmail.com"

type NewsArticle = {
  id: string
  title_ru: string
  title_kz: string
  description_ru: string
  description_kz: string
  category: string
  priority: string
  location?: string
  image_url?: string
  published: boolean
  created_at: string
}

export default function AdminNewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [language, setLanguage] = useState<"ru" | "kz">("ru")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title_ru: '',
    title_kz: '',
    description_ru: '',
    description_kz: '',
    category: 'event',
    priority: 'medium',
    location: '',
    image_url: '',
    published: true,
  })
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
    const res = await fetch('/api/news/admin')
    const data = await res.json()
    setNews(data.news || [])
    setLoading(false)
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData({
      title_ru: '',
      title_kz: '',
      description_ru: '',
      description_kz: '',
      category: 'event',
      priority: 'medium',
      location: '',
      image_url: '',
      published: true,
    })
    setShowModal(true)
  }

  const openEdit = (article: NewsArticle) => {
    setEditingId(article.id)
    setFormData({
      title_ru: article.title_ru,
      title_kz: article.title_kz,
      description_ru: article.description_ru,
      description_kz: article.description_kz,
      category: article.category,
      priority: article.priority,
      location: article.location || '',
      image_url: article.image_url || '',
      published: article.published,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.title_ru || !formData.title_kz || !formData.description_ru || !formData.description_kz) {
      alert(language === 'ru' ? 'Заполните все обязательные поля' : 'Барлық міндетті өрістерді толтырыңыз')
      return
    }

    const method = editingId ? 'PUT' : 'POST'
    const body = editingId ? { ...formData, id: editingId } : formData

    await fetch('/api/news/admin', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setShowModal(false)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'ru' ? 'Удалить новость?' : 'Жаңалықты жою керек пе?')) return
    await fetch(`/api/news/admin?id=${id}`, { method: 'DELETE' })
    await load()
  }

  const togglePublish = async (article: NewsArticle) => {
    await fetch('/api/news/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: article.id, published: !article.published }),
    })
    await load()
  }

  const t = {
    ru: {
      title: 'Админ · Новости',
      loading: 'Загрузка…',
      empty: 'Нет новостей',
      create: 'Создать новость',
      edit: 'Редактировать',
      delete: 'Удалить',
      published: 'Опубликовано',
      unpublished: 'Не опубликовано',
      togglePublish: 'Опубликовать/Снять',
      save: 'Сохранить',
      cancel: 'Отмена',
      titleRu: 'Заголовок (RU)',
      titleKz: 'Заголовок (KZ)',
      descRu: 'Описание (RU)',
      descKz: 'Описание (KZ)',
      category: 'Категория',
      priority: 'Приоритет',
      location: 'Локация (опционально)',
      imageUrl: 'URL изображения (опционально)',
      publishStatus: 'Опубликовать',
      categories: { traffic: 'Дорожная обстановка', event: 'События', alert: 'Уведомления', infrastructure: 'Инфраструктура' },
      priorities: { high: 'Высокий', medium: 'Средний', low: 'Низкий' },
    },
    kz: {
      title: 'Әкімші · Жаңалықтар',
      loading: 'Жүктелуде…',
      empty: 'Жаңалықтар жоқ',
      create: 'Жаңалық жасау',
      edit: 'Өңдеу',
      delete: 'Жою',
      published: 'Жарияланды',
      unpublished: 'Жарияланбады',
      togglePublish: 'Жариялау/Алып тастау',
      save: 'Сақтау',
      cancel: 'Болдырмау',
      titleRu: 'Тақырып (RU)',
      titleKz: 'Тақырып (KZ)',
      descRu: 'Сипаттама (RU)',
      descKz: 'Сипаттама (KZ)',
      category: 'Санат',
      priority: 'Басымдық',
      location: 'Орналасу (қосымша)',
      imageUrl: 'Сурет URL (қосымша)',
      publishStatus: 'Жариялау',
      categories: { traffic: 'Жол жағдайы', event: 'Оқиғалар', alert: 'Хабарландырулар', infrastructure: 'Инфрақұрылым' },
      priorities: { high: 'Жоғары', medium: 'Орташа', low: 'Төмен' },
    },
  }

  if (!allowed && !loading) return null

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-neutral-50 md:h-screen">
      <div className="bg-white border-b border-neutral-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-black">{t[language].title}</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            {t[language].create}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-3">
          {loading && <div className="text-neutral-600">{t[language].loading}</div>}
          {!loading && news.length === 0 && <div className="text-neutral-500">{t[language].empty}</div>}
          {!loading && news.map((article) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-neutral-200 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-semibold text-black">
                      {language === 'ru' ? article.title_ru : article.title_kz}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${article.published ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {article.published ? t[language].published : t[language].unpublished}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-600 line-clamp-2">
                    {language === 'ru' ? article.description_ru : article.description_kz}
                  </div>
                  <div className="mt-2 flex gap-2 text-xs text-neutral-500">
                    <span className="bg-neutral-100 px-2 py-1 rounded">{t[language].categories[article.category as keyof typeof t.ru.categories]}</span>
                    <span className="bg-neutral-100 px-2 py-1 rounded">{t[language].priorities[article.priority as keyof typeof t.ru.priorities]}</span>
                    {article.location && <span className="bg-neutral-100 px-2 py-1 rounded">{article.location}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => togglePublish(article)} className="p-2 hover:bg-neutral-100 rounded-lg" title={t[language].togglePublish}>
                    {article.published ? <EyeOff className="h-4 w-4 text-neutral-600" /> : <Eye className="h-4 w-4 text-neutral-600" />}
                  </button>
                  <button onClick={() => openEdit(article)} className="p-2 hover:bg-neutral-100 rounded-lg" title={t[language].edit}>
                    <Edit className="h-4 w-4 text-neutral-600" />
                  </button>
                  <button onClick={() => handleDelete(article.id)} className="p-2 hover:bg-red-50 rounded-lg" title={t[language].delete}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-black mb-4">
              {editingId ? t[language].edit : t[language].create}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">{t[language].titleRu} *</label>
                <input
                  value={formData.title_ru}
                  onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })}
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">{t[language].titleKz} *</label>
                <input
                  value={formData.title_kz}
                  onChange={(e) => setFormData({ ...formData, title_kz: e.target.value })}
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">{t[language].descRu} *</label>
                <textarea
                  value={formData.description_ru}
                  onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm min-h-[100px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">{t[language].descKz} *</label>
                <textarea
                  value={formData.description_kz}
                  onChange={(e) => setFormData({ ...formData, description_kz: e.target.value })}
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">{t[language].category}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="traffic">{t[language].categories.traffic}</option>
                    <option value="event">{t[language].categories.event}</option>
                    <option value="alert">{t[language].categories.alert}</option>
                    <option value="infrastructure">{t[language].categories.infrastructure}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">{t[language].priority}</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="high">{t[language].priorities.high}</option>
                    <option value="medium">{t[language].priorities.medium}</option>
                    <option value="low">{t[language].priorities.low}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">{t[language].location}</label>
                <input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">{t[language].imageUrl}</label>
                <input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm text-black">{t[language].publishStatus}</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 border border-neutral-300 rounded-xl px-4 py-3 text-sm">
                  {t[language].cancel}
                </button>
                <button onClick={handleSave} className="flex-1 bg-black text-white rounded-xl px-4 py-3 text-sm">
                  {t[language].save}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
