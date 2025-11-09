"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Settings, X, Coffee, ShoppingBag, Car, MapPin, Building2, Utensils, ShoppingCart, Wrench, Banknote, Fuel } from "lucide-react"
import { useState } from "react"
import { POPULAR_CATEGORIES } from "@/lib/2gis"

interface MapSettingsPanelProps {
  language: "ru" | "kz"
  onCategorySelect: (category: string) => void
  onLayerToggle: (layer: string, enabled: boolean) => void
}

export default function MapSettingsPanel({
  language,
  onCategorySelect,
  onLayerToggle,
}: MapSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [layers, setLayers] = useState({
    traffic: true,
    publicTransport: false,
    parking: false,
    gasStations: false,
    hospitals: false,
    pharmacies: false,
    restaurants: false,
    cafes: false,
    shops: false,
    banks: false,
    hotels: false,
  })

  const t = {
    ru: {
      title: "Настройки карты",
      layers: "Слои на карте",
      categories: "Категории мест",
      traffic: "Трафик",
      publicTransport: "Общественный транспорт",
      parking: "Парковки",
      gasStations: "АЗС",
      hospitals: "Больницы",
      pharmacies: "Аптеки",
      restaurants: "Рестораны",
      cafes: "Кафе",
      shops: "Магазины",
      banks: "Банки",
      hotels: "Отели",
      quickSearch: "Быстрый поиск",
    },
    kz: {
      title: "Карта баптаулары",
      layers: "Карта қабаттары",
      categories: "Орындар санаттары",
      traffic: "Қозғалыс",
      publicTransport: "Қоғамдық көлік",
      parking: "Тұрақтар",
      gasStations: "ЖҚС",
      hospitals: "Аурухана",
      pharmacies: "Дәріханалар",
      restaurants: "Мейрамханалар",
      cafes: "Кафелер",
      shops: "Дүкендер",
      banks: "Банктер",
      hotels: "Қонақ үйлер",
      quickSearch: "Жылдам іздеу",
    },
  }

  const handleLayerToggle = (layer: keyof typeof layers) => {
    const newValue = !layers[layer]
    setLayers(prev => ({ ...prev, [layer]: newValue }))
    onLayerToggle(layer, newValue)
  }

  const categories = POPULAR_CATEGORIES[language === "kz" ? "kk" : "ru"]

  return (
    <>
      {/* Settings Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-3 md:right-4 bottom-24 md:bottom-20 z-[1200] h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center border border-neutral-200 hover:border-neutral-300 transition-colors"
      >
        <Settings className={`h-5 w-5 text-neutral-700 transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </motion.button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[1200]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white shadow-2xl z-[1210] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 md:px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg md:text-xl font-bold text-black">{t[language].title}</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-neutral-100"
                >
                  <X className="h-5 w-5 text-neutral-600" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-4 md:p-6 space-y-6">
                {/* Layers Section */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-3">
                    {t[language].layers}
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(layers).map(([key, value]) => (
                      <motion.label
                        key={key}
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => handleLayerToggle(key as keyof typeof layers)}
                          className="h-5 w-5 rounded border-neutral-300 text-black focus:ring-2 focus:ring-black cursor-pointer"
                        />
                        <span className="text-sm text-neutral-800">
                          {t[language][key as keyof typeof t.ru]}
                        </span>
                      </motion.label>
                    ))}
                  </div>
                </div>

                {/* Quick Search Categories */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-3">
                    {t[language].quickSearch}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => {
                      const Icon = ((): any => {
                        const id = category.id
                        if (id === "restaurants") return Utensils
                        if (id === "cafes") return Coffee
                        if (id === "pharmacies") return ShoppingBag // fallback to bag icon
                        if (id === "hospitals") return Building2
                        if (id === "gas_stations") return Fuel
                        if (id === "banks") return Banknote
                        if (id === "atm") return Banknote
                        if (id === "hotels") return Building2
                        if (id === "shops") return ShoppingBag
                        if (id === "supermarkets") return ShoppingCart
                        if (id === "parking") return Car
                        if (id === "car_service") return Wrench
                        return MapPin
                      })()
                      return (
                        <motion.button
                          key={category.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onCategorySelect(category.name)
                            setIsOpen(false)
                          }}
                          className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 hover:border-black hover:bg-neutral-50 transition-colors text-left"
                        >
                          <Icon className="h-4 w-4 text-black" />
                          <span className="text-xs font-medium text-neutral-900 leading-tight">
                            {category.name}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {language === "ru"
                      ? "Выберите категории для отображения на карте. Включите или выключите слои для удобного просмотра."
                      : "Картада көрсету үшін санаттарды таңдаңыз. Ыңғайлы қарау үшін қабаттарды қосыңыз немесе өшіріңіз."}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
