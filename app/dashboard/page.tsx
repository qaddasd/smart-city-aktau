"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { RefreshCw, TrendingUp, Sun, Wind as WindIcon, Droplets, Gauge, MapPin, Sparkles, X } from "lucide-react"
import { getCurrentWeather } from "@/lib/weather"
import { getTrafficDelayBetween } from "@/lib/2gis"

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  const [language, setLanguage] = useState<"ru" | "kz">("ru")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [trafficSummary, setTrafficSummary] = useState<any | null>(null)
  const [areas, setAreas] = useState<Array<{ name: string; lat: number; lon: number; congestion: number }>>([])
  const [series, setSeries] = useState<number[]>([])
  const [seriesTimes, setSeriesTimes] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const [weather, setWeather] = useState<{ temp: number; desc: string; wind?: number; humidity?: number; pressure?: number } | null>(null)
  const [busDelayMin, setBusDelayMin] = useState<number | null>(null)
  const [recommendation, setRecommendation] = useState<{ ru: string; kz: string } | null>(null)
  const [loadingRec, setLoadingRec] = useState(false)
  const [showRecModal, setShowRecModal] = useState(false)

  const t = {
    ru: {
      title: "Городской пульс",
      traffic: "ТРАФИК",
      congestion: "Загруженность города",
      center: "Центр Актау сейчас",
      districts: "Микрорайоны",
      refresh: "Обновить данные",
      trafficChart: "Жүктеме динамика (последние значения)",
      transport: "Транспорт",
      car: "Авто",
      bus: "Автобус",
      weather: "Погода",
      wind: "Ветер",
      humidity: "Влажность",
      pressure: "Давление",
      hotspotsTitle: "Очаги пробок (топ)",
      getRecommendations: "Получить рекомендации AI",
      recommendations: "Рекомендации",
    },
    kz: {
      title: "Қала пульсі",
      traffic: "ЖҮЙЕ ЖҮКТЕМЕСІ",
      congestion: "Жүйе жүктемесі",
      center: "Ақтау орталығы қазір",
      districts: "Микроаудандар",
      refresh: "Деректерді жаңарту",
      trafficChart: "Жүктеме динамикасы (соңғы мәндер)",
      transport: "Көлік",
      car: "Авто",
      bus: "Автобус",
      weather: "Ауа райы",
      wind: "Жел",
      humidity: "Ылғалдылық",
      pressure: "Қысым",
      hotspotsTitle: "Ең тығыз учаскелер",
      getRecommendations: "AI ұсыныстарын алу",
      recommendations: "Ұсыныстар",
    },
  }

  const formatHHmm = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }

  const axisLabels = () => {
    const times = seriesTimes
    if (!times || times.length < 2) return [] as string[]
    const idxs = [0, Math.floor((times.length-1) * 0.33), Math.floor((times.length-1) * 0.66), times.length-1]
    return idxs.map(i => formatHHmm(new Date(times[i])))
  }
  const toPolylinePoints = (arr: number[], w = 220, h = 64) => {
    if (!arr || arr.length === 0) return ""
    const n = arr.length
    const max = 100
    const pts = arr.map((v, i) => {
      const x = (i / Math.max(1, n - 1)) * w
      const y = h - (Math.max(0, Math.min(max, v)) / max) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return pts.join(" ")
  }
  useEffect(() => {
    try {
      const saved = (localStorage.getItem("lang") as "ru" | "kz" | null) || "ru"
      setLanguage(saved)
      const handler = (e: StorageEvent) => {
        if (e.key === "lang" && (e.newValue === "ru" || e.newValue === "kz")) {
          setLanguage(e.newValue)
        }
      }
      window.addEventListener("storage", handler)
      return () => window.removeEventListener("storage", handler)
    } catch {}
  }, [])

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    const onLang = (e: any) => {
      const v = e?.detail
      if (v === 'ru' || v === 'kz') setLanguage(v)
    }
    try { window.addEventListener('lang-change', onLang as any) } catch {}
    return () => { try { window.removeEventListener('lang-change', onLang as any) } catch {} }
  }, [])
  useEffect(() => {
    try {
      const sum = localStorage.getItem("trafficSummary")
      if (sum) setTrafficSummary(JSON.parse(sum))
      const ar = localStorage.getItem("trafficAreas")
      if (ar) setAreas(JSON.parse(ar))
      const se = localStorage.getItem("trafficSeries")
      if (se) setSeries(JSON.parse(se))
      const st = localStorage.getItem("trafficSeriesTimes")
      if (st) setSeriesTimes(JSON.parse(st))
      const w = localStorage.getItem("weatherCurrent")
      if (w) setWeather(JSON.parse(w))
      const bd = localStorage.getItem("busDelayMin")
      if (bd) setBusDelayMin(Number(bd))
    } catch {}
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const loadData = async () => {
    setIsRefreshing(true)
    try {
      const [sumRes, areasRes] = await Promise.all([
        fetch(`/api/traffic/summary?bbox=43.56,51.05,43.74,51.27&steps=7`, { cache: "no-store" }),
        fetch(`/api/traffic/areas?bbox=43.56,51.05,43.74,51.27`, { cache: "no-store" }),
      ])
      if (sumRes.ok) {
        const data = await sumRes.json()
        setTrafficSummary(data)
        const pct = Math.round(((data.metrics?.congestionPct ?? 0) * 100))
        setSeries((prev) => [...prev.slice(-59), pct])
        const nowIso = new Date().toISOString()
        setSeriesTimes((prev) => [...prev.slice(-59), nowIso])
        try { localStorage.setItem("trafficSummary", JSON.stringify(data)) } catch {}
        try { localStorage.setItem("trafficSeries", JSON.stringify([...series.slice(-59), pct])) } catch {}
        try { localStorage.setItem("trafficSeriesTimes", JSON.stringify([...seriesTimes.slice(-59), nowIso])) } catch {}
      }
      if (areasRes.ok) {
        const data = await areasRes.json()
        setAreas(data.areas || [])
        try { localStorage.setItem("trafficAreas", JSON.stringify(data.areas || [])) } catch {}
      }
      const weatherKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
      if (weatherKey) {
        try {
          const w = await getCurrentWeather(47.1056, 51.9142, weatherKey)
          const temp = Math.round(w.main?.temp ?? 0)
          const desc = w.weather?.[0]?.main || ""
          const wind = Number(w.wind?.speed ?? 0)
          const humidity = Number(w.main?.humidity ?? 0)
          const pressure = Number(w.main?.pressure ?? 0)
          setWeather({ temp, desc, wind, humidity, pressure })
          try { localStorage.setItem("weatherCurrent", JSON.stringify({ temp, desc, wind, humidity, pressure })) } catch {}
        } catch {}
      }
      try {
        const delay = await getTrafficDelayBetween({ lat: 47.1056, lon: 51.9142 }, { lat: 47.1156, lon: 51.9242 })
        setBusDelayMin(delay)
        try { localStorage.setItem("busDelayMin", String(delay)) } catch {}
      } catch {}
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/traffic/summary?bbox=43.56,51.05,43.74,51.27&steps=7`, { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setTrafficSummary(data)
          const pct = Math.round(((data.metrics?.congestionPct ?? 0) * 100))
          setSeries((prev) => [...prev.slice(-59), pct])
          const nowIso = new Date().toISOString()
          setSeriesTimes((prev) => [...prev.slice(-59), nowIso])
          try { localStorage.setItem("trafficSummary", JSON.stringify(data)) } catch {}
          try { localStorage.setItem("trafficSeries", JSON.stringify([...series.slice(-59), pct])) } catch {}
          try { localStorage.setItem("trafficSeriesTimes", JSON.stringify([...seriesTimes.slice(-59), nowIso])) } catch {}
        }
      } catch {}
      try {
        const ares = await fetch(`/api/traffic/areas?bbox=43.56,51.05,43.74,51.27`, { cache: "no-store" })
        if (ares.ok) {
          const data = await ares.json()
          setAreas(data.areas || [])
          try { localStorage.setItem("trafficAreas", JSON.stringify(data.areas || [])) } catch {}
        }
      } catch {}
      try {
        const weatherKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
        if (weatherKey) {
          const w = await getCurrentWeather(47.1056, 51.9142, weatherKey)
          const temp = Math.round(w.main?.temp ?? 0)
          const desc = w.weather?.[0]?.main || ""
          const wind = Number(w.wind?.speed ?? 0)
          const humidity = Number(w.main?.humidity ?? 0)
          const pressure = Number(w.main?.pressure ?? 0)
          setWeather({ temp, desc, wind, humidity, pressure })
          try { localStorage.setItem("weatherCurrent", JSON.stringify({ temp, desc, wind, humidity, pressure })) } catch {}
        }
      } catch {}
      try {
        const delay = await getTrafficDelayBetween({ lat: 47.1056, lon: 51.9142 }, { lat: 47.1156, lon: 51.9242 })
        setBusDelayMin(delay)
        try { localStorage.setItem("busDelayMin", String(delay)) } catch {}
      } catch {}
    }, 60000)
    return () => clearInterval(id)
  }, [])

  const getRecommendations = async () => {
    setLoadingRec(true)
    try {
      const hour = new Date().getHours()
      const timeOfDay = hour < 12 ? 'утро' : hour < 18 ? 'день' : 'вечер'
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather: { temp: weather?.temp || 0, condition: weather?.desc || 'н/д' },
          traffic: { congestion: Math.round(((trafficSummary?.metrics?.congestionPct ?? 0) * 100)) },
          busDelay: busDelayMin || 0,
          time: timeOfDay,
        }),
      })
      const data = await res.json()
      setRecommendation(data.recommendation)
      setShowRecModal(true)
    } catch (e) {
      setRecommendation({ ru: 'Ошибка загрузки рекомендаций', kz: 'Ұсыныстарды жүктеу қатесі' })
      setShowRecModal(true)
    } finally {
      setLoadingRec(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-neutral-50 pb-20 md:pb-6">
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-black">{t[language].title}</h1>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={getRecommendations}
              disabled={loadingRec}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-medium hover:bg-neutral-800 transition-all disabled:opacity-50 shadow-sm"
              title={t[language].getRecommendations}
            >
              <Sparkles className={`h-4 w-4 ${loadingRec ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{t[language].getRecommendations}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadData}
              disabled={isRefreshing}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
              title={t[language].refresh}
            >
              <RefreshCw className={`h-5 w-5 text-black ${isRefreshing ? "animate-spin" : ""}`} />
            </motion.button>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
              {t[language].traffic}
            </h2>
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-neutral-200">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-5 w-5 text-neutral-600" />
                <span className="text-sm text-neutral-600">{mounted ? t[language].congestion : ""}</span>
              </div>
              <div className="mb-6">
                <div className="text-3xl md:text-4xl font-bold text-black">
                  {trafficSummary ? `${Math.round(((trafficSummary.metrics?.congestionPct ?? 0) * 100))}%` : "—"}
                </div>
                <div className="text-sm text-neutral-500 mt-1">{t[language].center}</div>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">{t[language].trafficChart}</h3>
                {series.length > 1 ? (
                  <svg viewBox="0 0 220 64" className="w-full h-16">
                    <polyline points={toPolylinePoints(series)} fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div className="text-xs text-neutral-500">—</div>
                )}
                {seriesTimes.length > 1 && (
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                    {axisLabels().map((lbl, i) => (<span key={i}>{lbl}</span>))}
                  </div>
                )}
                <div className="text-xs text-neutral-500 mt-2">
                  {busDelayMin !== null ? `${busDelayMin} мин задержка · последние 60 мин` : ""}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {series.length>1 && seriesTimes.length===series.length ? `${Math.max(...series)}% • ${formatHHmm(new Date(seriesTimes[series.indexOf(Math.max(...series))]))}` : ""}
                </div>
              </div>

              <div className="mt-4 flex items-center flex-wrap gap-2">
                <span className="text-xs text-neutral-600 mr-2">{mounted ? t[language].transport : ""}</span>
                {(() => {
                  const carPct = trafficSummary ? Math.round(((trafficSummary.metrics?.congestionPct ?? 0) * 100)) : null
                  const heavy = carPct !== null && carPct >= 30
                  return (
                    <span className={`${heavy ? "bg-black text-white" : "bg-neutral-100 text-neutral-800"} px-2 py-1 rounded-full text-xs`}>{t[language].car}: {carPct !== null ? `${carPct}%` : "—"}</span>
                  )
                })()}
                {(() => {
                  const heavy = busDelayMin !== null && busDelayMin >= 5
                  return (
                    <span className={`${heavy ? "bg-black text-white" : "bg-neutral-100 text-neutral-800"} px-2 py-1 rounded-full text-xs`}>{t[language].bus}: {busDelayMin !== null ? `${busDelayMin} мин` : "—"}</span>
                  )
                })()}
                {weather && (
                  <span className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded-full text-xs">{weather.temp}°C {weather.desc}</span>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
          >
            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">{t[language].hotspotsTitle}</h2>
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-neutral-200">
              <div className="space-y-2">
                {(trafficSummary?.metrics?.topHotspots || []).slice(0, 8).map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 text-xs text-neutral-500">{Math.round(h.congestion * 100)}%</div>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-black" style={{ width: `${Math.round(h.congestion * 100)}%` }} />
                    </div>
                    <div className="w-32 text-[10px] text-neutral-500 text-right truncate flex items-center justify-end gap-1">
                      <MapPin className="h-3 w-3 text-black" /> {h.lat.toFixed(3)}, {h.lon.toFixed(3)}
                    </div>
                  </div>
                ))}
                {(!trafficSummary || (trafficSummary?.metrics?.topHotspots || []).length === 0) && (
                  <div className="text-sm text-neutral-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-black" /> {language === "ru" ? "Нет данных" : "Деректер жоқ"}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">{t[language].weather}</h2>
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-black">{weather ? `${weather.temp}°C` : "—"}</div>
                  <div className="text-neutral-600 mt-2">{weather?.desc || ""}</div>
                </div>
                <Sun className="h-10 w-10 text-black" />
              </div>
              {weather && (
                <div className="grid grid-cols-3 gap-3 mt-4 text-xs text-neutral-600">
                  <div className="bg-neutral-100 rounded-lg p-2 text-center flex items-center justify-center gap-1">
                    <WindIcon className="h-3 w-3 text-black" /> {t[language].wind}: {weather.wind ?? 0} м/с
                  </div>
                  <div className="bg-neutral-100 rounded-lg p-2 text-center flex items-center justify-center gap-1">
                    <Droplets className="h-3 w-3 text-black" /> {t[language].humidity}: {weather.humidity ?? 0}%
                  </div>
                  <div className="bg-neutral-100 rounded-lg p-2 text-center flex items-center justify-center gap-1">
                    <Gauge className="h-3 w-3 text-black" /> {t[language].pressure}: {weather.pressure ?? 0} гПа
                  </div>
                </div>
              )}
              {recommendation && (
                <div className="mt-4 bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-700 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-black mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">
                      {language === "ru"
                        ? "AI-обзор: одежда и предупреждения"
                        : "AI шолу: киім және ескертулер"}
                    </div>
                    <p className="leading-relaxed line-clamp-3">
                      {language === "ru" ? recommendation.ru : recommendation.kz}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">{t[language].transport}</h2>
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-neutral-200">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600">{t[language].bus}</span>
                    <span className="text-sm font-semibold text-black">{busDelayMin !== null ? `${Math.min(100, Math.round((busDelayMin || 0) * 10))}%` : "—"}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{ width: `${busDelayMin !== null ? Math.min(100, Math.round((busDelayMin || 0) * 10)) : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600">{t[language].car}</span>
                    <span className="text-sm font-semibold text-black">{trafficSummary ? `${Math.round(((trafficSummary.metrics?.congestionPct ?? 0) * 100))}%` : "—"}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{ width: `${trafficSummary ? Math.round(((trafficSummary.metrics?.congestionPct ?? 0) * 100)) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">{t[language].districts}</h2>
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-neutral-200">
              <div className="space-y-2">
                {areas.slice(0, 12).map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-36 text-xs text-neutral-700 truncate" title={a.name}>{a.name}</div>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-black" style={{ width: `${Math.round(a.congestion * 100)}%` }} />
                    </div>
                    <div className="w-10 text-xs text-neutral-500 text-right">{Math.round(a.congestion * 100)}%</div>
                  </div>
                ))}
                {areas.length === 0 && (
                  <div className="text-sm text-neutral-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-black" /> {language === "ru" ? "Нет данных" : "Деректер жоқ"}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {showRecModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowRecModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-black" />
                <h2 className="text-xl font-bold text-black">{t[language].recommendations}</h2>
              </div>
              <button
                onClick={() => setShowRecModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-neutral-600" />
              </button>
            </div>
            {recommendation && (
              <div className="space-y-4">
                <div className="bg-neutral-50 rounded-xl p-4 border-2 border-black">
                  <div className="text-xs font-semibold text-black uppercase tracking-wider mb-2">RU</div>
                  <p className="text-neutral-800 leading-relaxed">{recommendation.ru}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-neutral-300">
                  <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">KZ</div>
                  <p className="text-neutral-800 leading-relaxed">{recommendation.kz}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
