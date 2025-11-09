"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Minus, Locate, Navigation, X, ArrowUpDown } from "lucide-react"
import { searchPlaces, getSuggestions, geocode, calculateAllModes, formatKm, formatMin, getPlaceDetails, reverseGeocode } from "@/lib/osm"
import MapSettingsPanel from "@/components/map-settings-panel"

declare global {
  interface Window {
    L: any
  }
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const routeLayersRef = useRef<{ car?: any; walk?: any; bus?: any }>({})
  const tileLayerRef = useRef<any>(null)
  const trafficTileRef = useRef<any>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [showTraffic, setShowTraffic] = useState(false)
  const [language, setLanguage] = useState<"ru" | "kz">("ru")
  const [isLoading, setIsLoading] = useState(false)
  const [routeInfo, setRouteInfo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"search" | "route">("search")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [routeFrom, setRouteFrom] = useState<string>("")
  const [routeTo, setRouteTo] = useState<string>("")
  const [routesByMode, setRoutesByMode] = useState<{ mode: "car" | "walk" | "bus"; route: any | null }[]>([])
  const [selectedMode, setSelectedMode] = useState<"car" | "walk" | "bus">("car")
  const [placeDetails, setPlaceDetails] = useState<any | null>(null)
  const [showDirections, setShowDirections] = useState(false)
  const [currentSteps, setCurrentSteps] = useState<any[] | undefined>(undefined)
  const [routeFromSuggestions, setRouteFromSuggestions] = useState<any[]>([])
  const [routeToSuggestions, setRouteToSuggestions] = useState<any[]>([])
  const [routeFromPlace, setRouteFromPlace] = useState<any | null>(null)
  const [routeToPlace, setRouteToPlace] = useState<any | null>(null)

  const handleSuggestionClick = async (s: any) => {
    try {
      const location: [number, number] = userLocation ? [userLocation[1], userLocation[0]] : [43.6515, 51.17]
      const lang = language === "kz" ? "kk" : "ru"
      const res = await searchPlaces(s.name || s.full_name || searchQuery, location, lang as "ru" | "kk")
      if (res[0]) handleSelectResult(res[0])
    } catch {}
  }
  useEffect(() => {
    const q = searchQuery.trim()
    let canceled = false
    let t: any
    const run = async () => {
      if (q.length < 1) { setSuggestions([]); return }
      try {
        const location: [number, number] = userLocation ? [userLocation[1], userLocation[0]] : [43.6515, 51.17]
        const lang = language === "kz" ? "kk" : "ru"
        const s = await getSuggestions(q, location, lang as "ru" | "kk")
        if (!canceled) setSuggestions(s)
      } catch {}
    }
    t = setTimeout(run, 300)
    return () => { canceled = true; if (t) clearTimeout(t) }
  }, [searchQuery, userLocation, language])
  const buildRouteFromFields = async () => {
    if (!routeFrom.trim() || !routeTo.trim() || !mapInstanceRef.current) return
    setIsLoading(true)
    try {
      const lang = (language === "kz" ? "kk" : "ru") as "ru" | "kk"
      const fromPlace = routeFromPlace || await geocode(routeFrom, lang)
      const toPlace = routeToPlace || await geocode(routeTo, lang)
      if (!fromPlace?.point || !toPlace?.point) return
      if (markersRef.current.length > 0) {
        markersRef.current.forEach((m) => m?.remove && m.remove())
        markersRef.current = []
      }
      const fromMarker = window.L.marker([fromPlace.point.lat, fromPlace.point.lon]).addTo(mapInstanceRef.current)
      const toMarker = window.L.marker([toPlace.point.lat, toPlace.point.lon]).addTo(mapInstanceRef.current)
      markersRef.current.push(fromMarker, toMarker)

      await buildAndShowAllModes([fromPlace.point.lat, fromPlace.point.lon], [toPlace.point.lat, toPlace.point.lon])
    } catch (e) {
      console.error("Route (fields) error:", e)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    const q = routeFrom.trim(); let canceled = false; let t: any
    const run = async () => {
      if (q.length < 1) { setRouteFromSuggestions([]); return }
      try {
        const location: [number, number] = userLocation ? [userLocation[1], userLocation[0]] : [43.6515, 51.17]
        const lang = language === "kz" ? "kk" : "ru"
        const s = await getSuggestions(q, location, lang as "ru" | "kk")
        if (!canceled) setRouteFromSuggestions(s)
      } catch { }
    }
    t = setTimeout(run, 250)
    return () => { canceled = true; if (t) clearTimeout(t) }
  }, [routeFrom, userLocation, language])
  useEffect(() => {
    const q = routeTo.trim(); let canceled = false; let t: any
    const run = async () => {
      if (q.length < 1) { setRouteToSuggestions([]); return }
      try {
        const location: [number, number] = userLocation ? [userLocation[1], userLocation[0]] : [43.6515, 51.17]
        const lang = language === "kz" ? "kk" : "ru"
        const s = await getSuggestions(q, location, lang as "ru" | "kk")
        if (!canceled) setRouteToSuggestions(s)
      } catch { }
    }
    t = setTimeout(run, 250)
    return () => { canceled = true; if (t) clearTimeout(t) }
  }, [routeTo, userLocation, language])

  const handleSelectRouteFrom = (p: any) => {
    setRouteFrom(p.name || p.full_name || p.address_name || "")
    setRouteFromPlace(p)
    setRouteFromSuggestions([])
  }
  const handleSelectRouteTo = (p: any) => {
    setRouteTo(p.name || p.full_name || p.address_name || "")
    setRouteToPlace(p)
    setRouteToSuggestions([])
  }

  const t = {
    ru: {
      search: "Поиск адреса, места или события",
      buildRoute: "Построить маршрут",
      traffic: "Трафик",
      currentLocation: "Моё местоположение",
      searchResults: "Результаты поиска",
      distance: "Расстояние",
      duration: "Время в пути",
      km: "км",
      min: "мин",
      car: "Авто",
      walk: "Пешком",
      bus: "Автобус",
      methods: "Способы",
    },
    kz: {
      search: "Мекенжай, орын немесе оқиғаны іздеу",
      buildRoute: "Бағыт құру",
      traffic: "Қозғалыс",
      currentLocation: "Менің орным",
      searchResults: "Іздеу нәтижелері",
      distance: "Қашықтық",
      duration: "Жол уақыты",
      km: "км",
      min: "мин",
      car: "Көлік",
      walk: "Жаяу",
      bus: "Автобус",
      methods: "Тәсілдер",
    },
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
  useEffect(() => {
    const invalidate = () => {
      try { mapInstanceRef.current?.invalidateSize?.() } catch {}
    }
    const id = setTimeout(invalidate, 120)
    window.addEventListener('resize', invalidate)
    return () => { clearTimeout(id); window.removeEventListener('resize', invalidate) }
  }, [])

  useEffect(() => {
    try { setTimeout(() => mapInstanceRef.current?.invalidateSize?.(), 80) } catch {}
  }, [activeTab, showTraffic])
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const loadScript = (src: string): Promise<void> => new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve()
      const s = document.createElement("script")
      s.src = src
      s.async = true
      s.onload = () => resolve()
      s.onerror = reject
      document.head.appendChild(s)
    })

    const loadCss = (href: string): Promise<void> => new Promise((resolve) => {
      const existing = document.querySelector(`link[href="${href}"]`)
      if (existing) return resolve()
      const l = document.createElement("link")
      l.rel = "stylesheet"
      l.href = href
      l.onload = () => resolve()
      l.onerror = () => resolve()
      document.head.appendChild(l)
    })

    const initMap = async () => {
      try {
        await loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css")
        await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js")

        if (window.L && mapRef.current) {
          const container: any = mapRef.current
          if (container && container._leaflet_id) {
            const parent = container.parentNode
            if (parent) {
              const clone = container.cloneNode(false)
              parent.replaceChild(clone, container)
              ;(mapRef as any).current = clone
            }
          }
          const map = window.L.map(mapRef.current).setView([43.6515, 51.17], 13)
          tileLayerRef.current = window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
            updateWhenIdle: true,
          }).addTo(map)

          mapInstanceRef.current = map
          try { setTimeout(() => map.invalidateSize?.(), 120) } catch {}
          map.on("click", async (e: any) => {
            try {
              setIsLoading(true)
              const lang = (language === "kz" ? "kk" : "ru") as "ru" | "kk"
              const p = await reverseGeocode(e.latlng.lat, e.latlng.lng, lang)
              if (p) {
                handleSelectResult(p)
              } else {
                handleSelectResult({ name: "", address_name: "", point: { lat: e.latlng.lat, lon: e.latlng.lng } })
              }
            } catch {}
            finally { setIsLoading(false) }
          })
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const coordsLatLng: [number, number] = [position.coords.latitude, position.coords.longitude]
                setUserLocation([position.coords.longitude, position.coords.latitude])
                map.setView(coordsLatLng, 14)
                const marker = window.L.marker(coordsLatLng).addTo(map)
                markersRef.current.push(marker)
              },
              (error) => console.warn("Geolocation error:", error)
            )
          }
        }
      } catch (error) {
        console.error("Failed to initialize Leaflet map:", error)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        markersRef.current.forEach((m) => m?.remove && m.remove())
        markersRef.current = []
        mapInstanceRef.current.remove && mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsLoading(true)

    try {
      const location: [number, number] = userLocation ? [userLocation[1], userLocation[0]] : [43.6515, 51.17]
      const lang = language === "kz" ? "kk" : "ru"
      const results = await searchPlaces(searchQuery, location, lang as "ru" | "kk")
      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectResult = (result: any) => {
    setSelectedResult(result)
    setSearchResults([])
    setSearchQuery(result.name || result.full_name || result.address_name || "")

    if (mapInstanceRef.current && result.point) {
      const latlng: [number, number] = [result.point.lat, result.point.lon]
      mapInstanceRef.current.setView(latlng, 16)
      if (markersRef.current.length > 1) {
        markersRef.current.slice(1).forEach((m) => m?.remove && m.remove())
        markersRef.current = [markersRef.current[0]]
      }

      const marker = window.L.marker(latlng).addTo(mapInstanceRef.current)
      markersRef.current.push(marker)
    }
    setPlaceDetails(null)
    const lang = (language === "kz" ? "kk" : "ru") as "ru" | "kk"
    if (result.osm_id && result.osm_type) {
      getPlaceDetails(result.osm_type, result.osm_id, lang).then((d) => {
        if (d) setPlaceDetails(d)
      }).catch(() => {})
    }
  }

  const drawPolyline = (coords: [number, number][], color: string) => {
    if (!mapInstanceRef.current || !window.L) return null
    const line = window.L.polyline(coords, { color, weight: 5 })
    line.addTo(mapInstanceRef.current)
    mapInstanceRef.current.fitBounds(line.getBounds(), { padding: [60, 60] })
    return line
  }

  const clearRouteLayers = () => {
    Object.values(routeLayersRef.current).forEach((layer) => layer && layer.remove && layer.remove())
    routeLayersRef.current = { car: undefined, walk: undefined, bus: undefined }
  }

  const updateDisplayedRoute = (mode: "car" | "walk" | "bus") => {
    setSelectedMode(mode)
    clearRouteLayers()
    const r = routesByMode.find((x) => x.mode === mode)?.route
    if (r?.coordinates?.length) {
      const color = mode === "car" ? "#3B82F6" : mode === "walk" ? "#10B981" : "#F59E0B"
      const line = drawPolyline(r.coordinates as [number, number][], color)
      routeLayersRef.current[mode] = line
      setRouteInfo({ distanceKm: formatKm(r.distance), durationMin: formatMin(r.duration) })
      setCurrentSteps(r.steps || [])
    }
  }

  const buildAndShowAllModes = async (fromLatLng: [number, number], toLatLng: [number, number]) => {
    const res = await calculateAllModes(fromLatLng, toLatLng)
    setRoutesByMode(res)
    setSelectedMode("car")
    clearRouteLayers()
    const r = res.find((x) => x.mode === "car")?.route
    if (r?.coordinates?.length) {
      const line = drawPolyline(r.coordinates as [number, number][], "#3B82F6")
      routeLayersRef.current.car = line
      setRouteInfo({ distanceKm: formatKm(r.distance), durationMin: formatMin(r.duration) })
      setCurrentSteps(r.steps || [])
    }
  }

  const buildRoute = async () => {
    if (!userLocation || !selectedResult || !mapInstanceRef.current) return
    setIsLoading(true)
    try {
      await buildAndShowAllModes([userLocation[1], userLocation[0]], [selectedResult.point.lat, selectedResult.point.lon])
    } catch (error) {
      console.error("Route error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategorySearch = async (category: string) => {
    if (!mapInstanceRef.current) return
    const location = userLocation ? [userLocation[1], userLocation[0]] as [number, number] : [47.1056, 51.9142]
    setIsLoading(true)
    setSearchQuery(category)
    try {
      const lang = (language === "kz" ? "kk" : "ru") as "ru" | "kk"
      const results = await searchPlaces(category, [location[0], location[1]], lang, 20)
      setSearchResults(results)
      if (markersRef.current.length > 1) {
        markersRef.current.slice(1).forEach((m) => m?.remove && m.remove())
        markersRef.current = [markersRef.current[0]]
      }
      results.forEach((r) => {
        if (r.point) {
          const marker = window.L.marker([r.point.lat, r.point.lon]).addTo(mapInstanceRef.current)
          markersRef.current.push(marker)
        }
      })
    } catch (error) {
      console.error("Category search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLayerToggle = (layer: string, enabled: boolean) => {
    if (layer === "traffic") setShowTraffic(enabled)
  }

  const toggleTraffic = () => setShowTraffic(!showTraffic)
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current
    if (showTraffic) {
      if (!trafficTileRef.current) {
        try {
          trafficTileRef.current = window.L.tileLayer(
            "https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=8o13c5HDyKQ8CxPmoxM282Dtf1iR1lgG",
            {
              opacity: 0.85,
              maxZoom: 19,
              attribution: "Traffic © TomTom",
            },
          ).addTo(map)
        } catch (e) {
          console.error("Traffic overlay error:", e)
          setShowTraffic(false)
        }
      }
    } else {
      if (trafficTileRef.current) {
        try { map.removeLayer(trafficTileRef.current) } catch {}
        trafficTileRef.current = null
      }
    }
  }, [showTraffic])

  const centerOnUser = () => {
    if (userLocation && mapInstanceRef.current) {
      const latlng: [number, number] = [userLocation[1], userLocation[0]]
      mapInstanceRef.current.setView(latlng, 15)
    }
  }
  const details = placeDetails || selectedResult
  const tagChips: { label: string; value: string }[] = []
  try {
    const tags = details?.extratags || {}
    const addr = details?.address || {}
    const push = (label: string, v?: string) => { if (v) tagChips.push({ label, value: v }) }
    push(language === "kz" ? "Санаты" : "Категория", details?.category || details?.type)
    push(language === "kz" ? "Мекенжай" : "Адрес", details?.address_name || [addr.road, addr.house_number, addr.city || addr.town || addr.village].filter(Boolean).join(", "))
    push(language === "kz" ? "Жұмыс уақыты" : "Часы", tags.opening_hours)
    push(language === "kz" ? "Телефон" : "Телефон", tags.phone || tags.contact_phone)
    push(language === "kz" ? "Сайт" : "Сайт", tags.website || tags.contact_website)
    push(language === "kz" ? "Оператор" : "Оператор", tags.operator)
    push(language === "kz" ? "Бренд" : "Бренд", tags.brand)
    push(language === "kz" ? "Ас түрі" : "Кухня", tags.cuisine)
  } catch {}

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col md:h-screen">
      
      <div className="relative flex-1 bg-neutral-200">
        <div ref={mapRef} className="h-full w-full relative z-0" />
        

        
        <div className="absolute z-[1100] pointer-events-auto isolate md:left-3 md:top-3 md:bottom-3 md:w-96 left-0 right-0 bottom-16 top-auto w-full px-0 md:px-0">
          <div className="md:hidden w-full flex justify-center">
            <div className="mt-1 mb-1 h-1.5 w-12 rounded-full bg-neutral-300" />
          </div>
          <div className="h-[42vh] max-h-[70vh] md:h-full flex flex-col bg-white rounded-t-2xl md:rounded-2xl border border-neutral-200 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] md:shadow-sm overflow-hidden">
            
            <div className="flex">
              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-2.5 text-sm font-medium border-b ${activeTab === "search" ? "border-black text-black" : "border-transparent text-neutral-500"}`}
              >
                Поиск
              </button>
              <button
                onClick={() => setActiveTab("route")}
                className={`flex-1 py-2.5 text-sm font-medium border-b ${activeTab === "route" ? "border-black text-black" : "border-transparent text-neutral-500"}`}
              >
                Проезд
              </button>
            </div>

            
            <div className="p-3 md:p-4 flex-1 overflow-y-auto">
              {activeTab === "search" && (
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder={t[language].search}
                      className="h-10 w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  
                  {suggestions.length > 0 && (
                    <div className="mt-2 border border-neutral-200 rounded-xl divide-y max-h-64 overflow-y-auto">
                      {suggestions.map((s, i) => (
                        <button key={i} onClick={() => handleSuggestionClick(s)} className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-sm">
                          {s.name || s.full_name}
                        </button>
                      ))}
                    </div>
                  )}

                  
                  {searchResults.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {searchResults.map((result, index) => (
                        <button key={index} onClick={() => handleSelectResult(result)} className="w-full text-left px-3 py-2 rounded-lg border border-neutral-200 hover:border-black">
                          <div className="text-sm font-medium text-black">{result.name || result.full_name}</div>
                          <div className="text-xs text-neutral-600">{result.address_name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "route" && (
                <div className="space-y-2">
                  <div className="relative">
                    <input value={routeFrom} onChange={(e) => { setRouteFrom(e.target.value); setRouteFromPlace(null) }} placeholder="Откуда" className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm" />
                    {routeFromSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-11 z-20 bg-white border border-neutral-200 rounded-xl shadow-sm max-h-56 overflow-y-auto">
                        {routeFromSuggestions.map((s, i) => (
                          <button key={i} onClick={() => handleSelectRouteFrom(s)} className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-sm">
                            {s.name || s.full_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <input value={routeTo} onChange={(e) => { setRouteTo(e.target.value); setRouteToPlace(null) }} placeholder="Куда" className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm" />
                    <button
                      onClick={() => { const rf = routeFrom; const rt = routeTo; const rfp = routeFromPlace; const rtp = routeToPlace; setRouteFrom(rt); setRouteTo(rf); setRouteFromPlace(rtp); setRouteToPlace(rfp) }}
                      className="absolute -right-2 -top-2 bg-white border border-neutral-200 rounded-full h-8 w-8 flex items-center justify-center shadow"
                    >
                      <ArrowUpDown className="h-4 w-4 text-neutral-700" />
                    </button>
                    {routeToSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-11 z-20 bg-white border border-neutral-200 rounded-xl shadow-sm max-h-56 overflow-y-auto">
                        {routeToSuggestions.map((s, i) => (
                          <button key={i} onClick={() => handleSelectRouteTo(s)} className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-sm">
                            {s.name || s.full_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={buildRouteFromFields} className="w-full bg-black text-white rounded-xl py-2 text-sm font-semibold">{t[language].buildRoute}</button>
                  {routeInfo && (
                    <div className="text-xs text-neutral-700">{t[language].distance}: {routeInfo.distanceKm} {t[language].km}, {t[language].duration}: {routeInfo.durationMin} {t[language].min}</div>
                  )}
                </div>
              )}
            </div>

            
            <div className="p-3 border-t border-neutral-200 flex items-center justify-between">
              <button onClick={centerOnUser} className="h-9 px-3 rounded-lg border border-neutral-300 text-sm flex items-center gap-2">
                <Locate className="h-4 w-4" /> {t[language].currentLocation}
              </button>
              <button onClick={toggleTraffic} className={`h-9 px-3 rounded-lg text-sm ${showTraffic ? "bg-black text-white" : "border border-neutral-300"}`}>
                {t[language].traffic}
              </button>
            </div>
          </div>
        </div>

        
        <div className="absolute right-3 md:right-4 top-3 md:top-4 flex flex-col gap-2 z-[1100] isolate">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!mapInstanceRef.current) return
              const z = mapInstanceRef.current.getZoom ? mapInstanceRef.current.getZoom() : 13
              mapInstanceRef.current.setZoom && mapInstanceRef.current.setZoom(Math.min(20, z + 1))
            }}
            className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-white shadow-md hover:shadow-lg flex items-center justify-center transition-shadow"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5 text-neutral-700" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!mapInstanceRef.current) return
              const z = mapInstanceRef.current.getZoom ? mapInstanceRef.current.getZoom() : 13
              mapInstanceRef.current.setZoom && mapInstanceRef.current.setZoom(Math.max(1, z - 1))
            }}
            className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-white shadow-md hover:shadow-lg flex items-center justify-center transition-shadow"
          >
            <Minus className="h-4 w-4 md:h-5 md:w-5 text-neutral-700" />
          </motion.button>
        </div>

        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={centerOnUser}
          className="absolute right-3 md:right-4 top-24 md:top-28 h-9 w-9 md:h-10 md:w-10 rounded-xl bg-white shadow-md hover:shadow-lg flex items-center justify-center transition-shadow z-[1100] isolate"
        >
          <Locate className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
        </motion.button>

        
        <AnimatePresence>
          {selectedResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 md:bottom-4 left-3 right-3 md:left-auto md:right-4 md:w-96 z-[1100] isolate"
            >
              <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xl border border-neutral-100">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base text-black truncate">
                      {selectedResult.name || selectedResult.full_name}
                    </h3>
                    <p className="text-xs md:text-sm text-neutral-600 mt-1 line-clamp-2">
                      {selectedResult.address_name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedResult(null)
                      setRouteInfo(null)
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-neutral-100"
                  >
                    <X className="h-5 w-5 text-neutral-600" />
                  </button>
                </div>

                {routesByMode.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-neutral-500 mb-1">{t[language].methods}</div>
                    <div className="flex gap-2">
                      {(["car","walk","bus"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => updateDisplayedRoute(m)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs border ${selectedMode===m?"bg-black text-white border-black":"border-neutral-300"}`}
                        >
                          {m === "car" ? t[language].car : m === "walk" ? t[language].walk : t[language].bus}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {routeInfo && (
                  <div className="flex items-center gap-4 mb-3 text-xs md:text-sm text-neutral-600">
                    <div>
                      <span className="font-medium text-black">{routeInfo.distanceKm}</span> {t[language].km}
                    </div>
                    <div>
                      <span className="font-medium text-black">{routeInfo.durationMin}</span> {t[language].min}
                    </div>
                  </div>
                )}

                
                {routesByMode.length > 0 ? (
                  <div className="flex gap-2 mb-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDirections(!showDirections)}
                      className="flex-1 bg-black text-white rounded-xl py-2 text-sm font-semibold"
                    >
                      {showDirections ? (language === "kz" ? "Жабу" : "Скрыть") : (language === "kz" ? "В путь" : "В путь")}
                    </motion.button>
                  </div>
                ) : userLocation && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={buildRoute}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white rounded-xl py-2.5 md:py-3 font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm md:text-base"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 md:h-5 md:w-5" />
                        {t[language].buildRoute}
                      </>
                    )}
                  </motion.button>
                )}

                
                {showDirections && currentSteps && currentSteps.length > 0 && (
                  <div className="mt-2 max-h-60 overflow-y-auto border-t border-neutral-200 pt-2">
                    {currentSteps.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 py-1.5">
                        <div className="text-xs text-neutral-500 w-6 shrink-0">{i+1}.</div>
                        <div className="flex-1">
                          <div className="text-xs text-neutral-800">{s.maneuver?.instruction || s.name || ""}</div>
                          <div className="text-[11px] text-neutral-500">{s.distance > 1000 ? `${formatKm(s.distance)} км` : `${Math.round(s.distance)} м`} · {formatMin(s.duration)} мин</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                
                {(tagChips.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tagChips.slice(0, 8).map((tag, i) => (
                      <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                        <span className="font-medium">{tag.label}:</span> {tag.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        
        <MapSettingsPanel
          language={language}
          onCategorySelect={handleCategorySearch}
          onLayerToggle={handleLayerToggle}
        />
      </div>
    </div>
  )
}
