"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, TrendingUp, AlertCircle, MapPin, Users, X } from "lucide-react"

interface NewsItem {
  id: number
  title: string
  description: string
  category: "traffic" | "event" | "alert" | "infrastructure"
  date: string
  time: string
  location?: string
  image?: string
  priority: "high" | "medium" | "low"
}

export default function NewsPage() {
  const [language, setLanguage] = useState<"ru" | "kz">("ru")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [items, setItems] = useState<NewsItem[]>([])
  const [query, setQuery] = useState("")

  useEffect(() => {
    try {
      const saved = (localStorage.getItem("lang") as "ru" | "kz" | null) || "ru"
      setLanguage(saved)
      const handler = (e: StorageEvent) => {
        if (e.key === "lang" && (e.newValue === "ru" || e.newValue === "kz")) setLanguage(e.newValue)
      }
      window.addEventListener("storage", handler)
      const onLang = (ev: any) => { const v = ev?.detail; if (v === 'ru' || v === 'kz') setLanguage(v) }
      window.addEventListener('lang-change', onLang as any)
      return () => { window.removeEventListener("storage", handler); window.removeEventListener('lang-change', onLang as any) }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const sumStr = localStorage.getItem('trafficSummary')
      const areasStr = localStorage.getItem('trafficAreas')
      if (!sumStr && !areasStr) return
      const sum = sumStr ? JSON.parse(sumStr) : null
      const ars = areasStr ? JSON.parse(areasStr) : []
      setItems(generateNews(sum, ars))
    } catch {}
  }, [language])

  const catLabel = (category: string) => {
    const map: Record<string, string> = {
      traffic: t[language].traffic,
      event: t[language].event,
      alert: t[language].alert,
      infrastructure: t[language].infrastructure,
    }
    return map[category] || category
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, areasRes, newsRes] = await Promise.all([
          fetch(`/api/traffic/summary?bbox=43.56,51.05,43.74,51.27&steps=7`, { cache: 'no-store' }),
          fetch(`/api/traffic/areas?bbox=43.56,51.05,43.74,51.27`, { cache: 'no-store' }),
          fetch(`/api/news/public`, { cache: 'no-store' }),
        ])
        const sum = sumRes.ok ? await sumRes.json() : null
        const ars = areasRes.ok ? (await areasRes.json())?.areas || [] : []
        const adminNews = newsRes.ok ? (await newsRes.json())?.news || [] : []
        
        const autoNews = generateNews(sum, ars)
        const adminItems = adminNews.map((n: any, idx: number) => ({
          id: 10000 + idx,
          title: language === 'ru' ? n.title_ru : n.title_kz,
          description: language === 'ru' ? n.description_ru : n.description_kz,
          category: n.category,
          date: new Date(n.created_at).toISOString().slice(0,10),
          time: new Date(n.created_at).toTimeString().slice(0,5),
          location: n.location,
          image: n.image_url,
          priority: n.priority,
        }))
        
        setItems([...adminItems, ...autoNews])
      } catch {}
    }
    load()
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [language])

  function generateNews(summary: any, areas: any[]): NewsItem[] {
    const now = new Date()
    const date = now.toISOString().slice(0,10)
    const time = now.toTimeString().slice(0,5)
    const out: NewsItem[] = []
    let id = 1

    const pct = Math.round(((summary?.metrics?.congestionPct ?? 0) * 100))
    const hotspots = (summary?.metrics?.topHotspots || []) as Array<{ lat:number; lon:number; congestion:number }>

    if (pct <= 8 && hotspots.length === 0) {
      out.push({ id: id++, title: t[language].calm, description: t[language].calm, category: 'traffic', date, time, priority: 'low' })
    }

    hotspots.slice(0,5).forEach((h) => {
      const hpct = Math.round(h.congestion * 100)
      const nearest = nearestArea(areas, h.lat, h.lon)
      const name = nearest?.name || `${h.lat.toFixed(3)}, ${h.lon.toFixed(3)}`
      out.push({
        id: id++,
        title: t[language].heavy(name, hpct),
        description: t[language].heavy(name, hpct),
        category: 'traffic',
        date, time,
        location: name,
        priority: hpct >= 60 ? 'high' : hpct >= 40 ? 'medium' : 'low',
      })
    })

    areas.filter(a => (a.congestion ?? 0) >= 0.35).slice(0,6).forEach((a) => {
      const ap = Math.round((a.congestion ?? 0) * 100)
      out.push({ id: id++, title: t[language].areaHeavy(a.name, ap), description: t[language].areaHeavy(a.name, ap), category: 'traffic', date, time, location: a.name, priority: ap>=60?'high':ap>=40?'medium':'low' })
    })

    return out
  }

  function generateMangystauNews(language: "ru" | "kz"): NewsItem[] {
    const now = new Date()
    const date = now.toISOString().slice(0,10)
    const time = now.toTimeString().slice(0,5)

    const base = [
      {
        category: "event" as const,
        priority: "medium" as const,
        location: "Актау, набережная 15 мкр",
        ru: {
          title: "Вечерний концерт на набережной",
          description: "На набережной 15 мкр пройдёт бесплатный вечерний концерт местных музыкантов. Начало в 19:30, организаторы рекомендуют приходить заранее.",
        },
        kz: {
          title: "Теңіз жағалауындағы кешкі концерт",
          description: "15-шағын аудандағы теңіз жағалауында жергілікті музыканттардың тегін кешкі концерті өтеді. Басталуы 19:30, ертерек келу ұсынылады.",
        },
      },
      {
        category: "event" as const,
        priority: "medium" as const,
        location: "Актау, городской парк",
        ru: {
          title: "Семейный фестиваль в городском парке",
          description: "В городском парке Актау пройдёт семейный фестиваль с мастер-классами, фуд-кортом и детской программой. Вход свободный, начало в 12:00.",
        },
        kz: {
          title: "Қалалық саябақтағы отбасылық фестиваль",
          description: "Ақтау қалалық саябағында шеберлік сабақтары, фуд-корты және балалар бағдарламасы бар отбасылық фестиваль өтеді. Кіру тегін, басталуы 12:00.",
        },
      },
      {
        category: "event" as const,
        priority: "medium" as const,
        location: "Мангистауский областной музей",
        ru: {
          title: "Выставка местных художников",
          description: "В Мангистауском областном музее открывается выставка картин и фотографий местных художников. Экспозиция будет работать в течение двух недель.",
        },
        kz: {
          title: "Жергілікті суретшілер көрмесі",
          description: "Маңғыстау облыстық музейінде жергілікті суретшілердің картиналары мен фотосуреттер көрмесі ашылады. Экспозиция екі апта бойы жұмыс істейді.",
        },
      },
      {
        category: "event" as const,
        priority: "low" as const,
        location: "Побережье Каспийского моря",
        ru: {
          title: "Эко-субботник на побережье",
          description: "Волонтёры Мангистау организуют эко-субботник на побережье Каспия. Желающим просят взять перчатки и удобную одежду.",
        },
        kz: {
          title: "Каспий жағалауындағы эко-сенбілік",
          description: "Маңғыстау еріктілері Каспий жағалауында эко-сенбілік өткізеді. Қатысушылардан қолғап пен ыңғайлы киім алып келу сұралады.",
        },
      },
      {
        category: "event" as const,
        priority: "medium" as const,
        location: "Актау, коворкинг-центр",
        ru: {
          title: "Встреча IT-сообщества Мангистау",
          description: "В одном из коворкингов Актау пройдёт неформальная встреча IT-специалистов региона. В программе — короткие выступления и свободное общение.",
        },
        kz: {
          title: "Маңғыстау IT қауымдастығының кездесуі",
          description: "Ақтаудағы коворкингтердің бірінде өңірдің IT мамандарының еркін кездесуі өтеді. Бағдарламада қысқа баяндама және еркін қарым-қатынас бар.",
        },
      },
      {
        category: "event" as const,
        priority: "medium" as const,
        location: "Актау, набережная",
        ru: {
          title: "Утренний забег вдоль набережной",
          description: "Для любителей спорта в Актау организуют утренний забег вдоль набережной. Регистрация участников открыта онлайн.",
        },
        kz: {
          title: "Жағалау бойымен таңғы жүгіру",
          description: "Спорт сүйер қауым үшін Ақтауда жағалау бойымен таңғы жүгіру ұйымдастырылады. Қатысушыларды онлайн тіркеу ашық.",
        },
      },
      {
        category: "infrastructure" as const,
        priority: "high" as const,
        location: "Трасса Актау – Жетыбай",
        ru: {
          title: "Ремонт участка трассы Актау – Жетыбай",
          description: "На одном из участков трассы Актау – Жетыбай ведутся дорожные работы, возможны временные заторы. Водителям рекомендуют планировать маршрут заранее.",
        },
        kz: {
          title: "Ақтау – Жетібай трассасындағы жөндеу жұмыстары",
          description: "Ақтау – Жетібай трассасының бір бөлігінде жол жөндеу жұмыстары жүріп жатыр, уақытша кептелістер болуы мүмкін. Жүргізушілерге маршрутты алдын ала жоспарлау ұсынылады.",
        },
      },
      {
        category: "infrastructure" as const,
        priority: "medium" as const,
        location: "Актау, новые автобусные маршруты",
        ru: {
          title: "Запуск дополнительных автобусных рейсов",
          description: "В Актау запускают дополнительные автобусные рейсы в часы пик между микрорайонами и центром. Это должно сократить время ожидания на остановках.",
        },
        kz: {
          title: "Қосымша автобус рейстері іске қосылды",
          description: "Ақтауда микроаудандар мен орталық арасындағы қарбалас уақытта қосымша автобус рейстері іске қосылады. Бұл аялдамалардағы күту уақытын қысқартуға тиіс.",
        },
      },
      {
        category: "alert" as const,
        priority: "high" as const,
        location: "Береговая линия Мангистау",
        ru: {
          title: "Штормовое предупреждение на побережье",
          description: "Синоптики объявили штормовое предупреждение на побережье Мангистау. Жителям советуют ограничить выход к воде и быть осторожнее на дороге.",
        },
        kz: {
          title: "Маңғыстау жағалауында дауылды ескерту",
          description: "Синоптиктер Маңғыстау жағалауында дауылды ескерту жариялады. Тұрғындарға суға жақындауды шектеу және жолда сақ болу ұсынылады.",
        },
      },
      {
        category: "event" as const,
        priority: "medium" as const,
        location: "Долина шаров, Турыш",
        ru: {
          title: "Экскурсии в Долину шаров",
          description: "Туристические компании Мангистау усиливают программу выездных экскурсий в Долину шаров. Для группы предусмотрен трансфер из Актау.",
        },
        kz: {
          title: "Шарлар аңғарына экскурсиялар",
          description: "Маңғыстау туристік компаниялары Шарлар аңғарына выезд экскурсияларын күшейтеді. Топқа Ақтаудан трансфер қарастырылған.",
        },
      },
    ]

    return base.map((item, idx) => ({
      id: 20000 + idx,
      title: language === "ru" ? item.ru.title : item.kz.title,
      description: language === "ru" ? item.ru.description : item.kz.description,
      category: item.category,
      date,
      time,
      location: item.location,
      priority: item.priority,
    }))
  }

  function nearestArea(areas: any[], lat:number, lon:number) {
    if (!areas || areas.length === 0) return null
    let best:any = null; let bd = Infinity
    for (const a of areas) {
      const d = (a.lat-lat)*(a.lat-lat) + (a.lon-lon)*(a.lon-lon)
      if (d < bd) { bd = d; best = a }
    }
    return best
  }
  

  const t = {
    ru: {
      title: "Новости города",
      subtitle: "Актуальные события и обновления",
      all: "Все",
      traffic: "Дорожная обстановка",
      event: "События",
      alert: "Уведомления",
      infrastructure: "Инфраструктура",
      viewDetails: "Подробнее",
      calm: "Город в тишине — пробок нет",
      heavy: (name: string, pct: number) => `Пробка в ${name} — ${pct}%`,
      areaHeavy: (name: string, pct: number) => `Высокая загруженность в ${name} — ${pct}%`,
    },
    kz: {
      title: "Қала жаңалықтары",
      subtitle: "Өзекті оқиғалар мен жаңартулар",
      all: "Барлығы",
      traffic: "Жол жағдайы",
      event: "Оқиғалар",
      alert: "Хабарландырулар",
      infrastructure: "Инфрақұрылым",
      viewDetails: "Толығырақ",
      calm: "Қала тыныш — кептеліс жоқ",
      heavy: (name: string, pct: number) => `${name} ауданында кептеліс — ${pct}%`,
      areaHeavy: (name: string, pct: number) => `${name} жерде жүктеме жоғары — ${pct}%`,
    },
  }
  const categories = [
    { id: "all", label: t[language].all, icon: TrendingUp },
    { id: "traffic", label: t[language].traffic, icon: MapPin },
    { id: "event", label: t[language].event, icon: Calendar },
    { id: "alert", label: t[language].alert, icon: AlertCircle },
    { id: "infrastructure", label: t[language].infrastructure, icon: Users },
  ]

  const filteredByCat = selectedCategory === "all" ? items : items.filter((i) => i.category === selectedCategory)
  const q = query.trim().toLowerCase()
  const filteredNews = q
    ? filteredByCat.filter((n) =>
        [n.title, n.description, n.location || ""].some((f) => (f || "").toLowerCase().includes(q)),
      )
    : filteredByCat
  const eventNews = generateMangystauNews(language)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "traffic":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "event":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "alert":
        return "bg-red-100 text-red-700 border-red-200"
      case "infrastructure":
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-neutral-500"
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6 pb-20 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-black mb-2"
          >
            {t[language].title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-neutral-600"
          >
            {t[language].subtitle}
          </motion.p>
          <div className="mt-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={language === 'ru' ? 'Поиск новостей…' : 'Жаңалықтарды іздеу…'}
              className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm"
            />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6 overflow-x-auto pb-2"
        >
          <div className="flex gap-2 min-w-max">
            {categories.map((category, index) => {
              const Icon = category.icon
              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    selectedCategory === category.id
                      ? "bg-black text-white shadow-md"
                      : "bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-8"
        >
          {eventNews.length > 0 && (
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-neutral-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-black">
                    {language === "ru" ? "Афиша мероприятий" : "Іс-шаралар афишасы"}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    {language === "ru"
                      ? "Ближайшие события в Актау и Мангистау"
                      : "Ақтау мен Маңғыстаудағы алдағы іс-шаралар"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {eventNews.map((news) => (
                  <button
                    key={news.id}
                    onClick={() => setSelectedNews(news)}
                    className="text-left group"
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{news.date}</span>
                      <span>·</span>
                      <span>{news.time}</span>
                    </div>
                    <div className="font-semibold text-sm text-black line-clamp-2 group-hover:underline">
                      {news.title}
                    </div>
                    {news.location && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{news.location}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredNews.map((news, index) => (
            <motion.div
              key={news.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full border ${getCategoryColor(
                    news.category
                  )}`}
                >
                  {catLabel(news.category)}
                </span>
                <div className={`h-2 w-2 rounded-full ${getPriorityColor(news.priority)}`} />
              </div>

              <h3 className="text-lg font-bold text-black mb-2 line-clamp-2">{news.title}</h3>
              <p className="text-sm text-neutral-600 mb-4 line-clamp-3">{news.description}</p>

              <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{news.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{news.time}</span>
                </div>
              </div>

              {news.location && (
                <div className="flex items-center gap-1 text-xs text-neutral-500 mb-4">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{news.location}</span>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedNews(news)}
                className="w-full bg-neutral-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                {t[language].viewDetails}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {filteredNews.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <AlertCircle className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">
              {language === "ru" ? "Новостей не найдено" : "Жаңалықтар табылмады"}
            </p>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedNews && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedNews(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full border ${getCategoryColor(
                        selectedNews.category
                      )}`}
                    >
                      {catLabel(selectedNews.category)}
                    </span>
                    <div className={`h-2 w-2 rounded-full ${getPriorityColor(selectedNews.priority)}`} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
                    {selectedNews.title}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedNews(null)}
                  className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
                >
                  <X className="h-6 w-6 text-neutral-600" />
                </motion.button>
              </div>

              {selectedNews.image && (
                <div className="mb-6">
                  <img
                    src={selectedNews.image}
                    alt={selectedNews.title}
                    className="w-full max-h-80 rounded-2xl object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-6 text-sm text-neutral-600 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{selectedNews.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{selectedNews.time}</span>
                </div>
              </div>

              {selectedNews.location && (
                <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedNews.location}</span>
                </div>
              )}

              <div className="prose prose-neutral max-w-none">
                <p className="text-neutral-700 leading-relaxed text-base">
                  {selectedNews.description}
                </p>
                
                <div className="mt-6 p-4 bg-neutral-50 rounded-xl text-sm text-neutral-600">
                  {selectedNews.description}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
