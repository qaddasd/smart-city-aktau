"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp } from "lucide-react"

export default function AnalyticsPage() {
  const [language, setLanguage] = useState<"ru" | "kz">("ru")
  const [loading, setLoading] = useState(false)
  const [trafficSummary, setTrafficSummary] = useState<any | null>(null)
  const [areas, setAreas] = useState<Array<{ name: string; lat: number; lon: number; congestion: number }>>([])
  const [series, setSeries] = useState<number[]>([])

  const t = {
    ru: {
      title: "Аналитика",
      congestionNow: "Текущая загруженность",
      snapshot: "Срез по району (центр Актау)",
      districts: "Микрорайоны",
    },
    kz: {
      title: "Аналитика",
      congestionNow: "Ағымдағы жүктеме",
      snapshot: "Аудан бойынша кескін (Ақтау орталығы)",
      districts: "Микроаудандар",
    },
  }

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
      return () => window.removeEventListener("storage", handler)
    } catch {}
  }, [])

  const load = async () => {
    setLoading(true)
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
        try { localStorage.setItem("trafficSummary", JSON.stringify(data)) } catch {}
        try { localStorage.setItem("trafficSeries", JSON.stringify([...series.slice(-59), pct])) } catch {}
      }
      if (areasRes.ok) {
        const data = await areasRes.json()
        setAreas(data.areas || [])
        try { localStorage.setItem("trafficAreas", JSON.stringify(data.areas || [])) } catch {}
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      const sum = localStorage.getItem("trafficSummary")
      if (sum) setTrafficSummary(JSON.parse(sum))
      const ar = localStorage.getItem("trafficAreas")
      if (ar) setAreas(JSON.parse(ar))
      const se = localStorage.getItem("trafficSeries")
      if (se) setSeries(JSON.parse(se))
    } catch {}
    load()
  }, [language])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-neutral-50 md:h-screen">
      <div className="bg-white border-b border-neutral-200 px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-black">{t[language].title}</h1>
        <button onClick={load} className="text-xs bg-black text-white rounded-lg px-3 py-1.5 disabled:opacity-50" disabled={loading}>
          {loading ? "…" : (language === "ru" ? "Обновить" : "Жаңарту")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">{t[language].districts}</h2>
              <div className="text-sm text-neutral-600">
                <TrendingUp className="inline-block h-4 w-4 mr-1" />
                {trafficSummary ? `${Math.round(((trafficSummary.metrics?.congestionPct ?? 0) * 100))}%` : "—"}
              </div>
            </div>
            <div className="space-y-2">
              {areas.slice(0, 16).map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-36 text-xs text-neutral-700 truncate" title={a.name}>{a.name}</div>
                  <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black" style={{ width: `${Math.round(a.congestion * 100)}%` }} />
                  </div>
                  <div className="w-10 text-xs text-neutral-500 text-right">{Math.round(a.congestion * 100)}%</div>
                </div>
              ))}
              {areas.length === 0 && (
                <div className="text-sm text-neutral-500">{language === "ru" ? "Нет данных" : "Деректер жоқ"}</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">{language === "ru" ? "Очаги пробок (топ)" : "Ең тығыз учаскелер"}</h2>
              <div className="text-sm text-neutral-600">{t[language].congestionNow}</div>
            </div>
            <div className="space-y-2">
              {(trafficSummary?.metrics?.topHotspots || []).slice(0, 8).map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 text-xs text-neutral-500">{Math.round(h.congestion * 100)}%</div>
                  <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black" style={{ width: `${Math.round(h.congestion * 100)}%` }} />
                  </div>
                  <div className="w-32 text-[10px] text-neutral-500 text-right truncate">{h.lat.toFixed(3)}, {h.lon.toFixed(3)}</div>
                </div>
              ))}
              {(!trafficSummary || (trafficSummary?.metrics?.topHotspots || []).length === 0) && (
                <div className="text-sm text-neutral-500">{language === "ru" ? "Нет данных" : "Деректер жоқ"}</div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">{t[language].snapshot}</h2>
              <div className="text-sm text-neutral-600">
                <TrendingUp className="inline-block h-4 w-4 mr-1" />
                {trafficSummary ? `${Math.round(((trafficSummary.metrics?.congestionPct ?? 0) * 100))}%` : "—"}
              </div>
            </div>
            
            <div className="h-16 flex items-end gap-1">
              {series.map((v, i) => (
                <div key={i} className="w-1 bg-neutral-900 rounded" style={{ height: `${Math.max(2, Math.min(100, v))}%` }} />
              ))}
              {series.length === 0 && <div className="text-xs text-neutral-500">—</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
