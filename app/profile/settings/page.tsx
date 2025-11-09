"use client"

import { useEffect, useState } from "react"
import { subscribePush } from "@/lib/pwa"

export default function ProfileSettingsPage() {
  const [lang, setLang] = useState<'ru'|'kz'>('ru')
  const [notif, setNotif] = useState<NotificationPermission>('default')
  
  useEffect(() => {
    try {
      const v = (localStorage.getItem('lang') as 'ru'|'kz'|null) || 'ru'
      setLang(v)
      setNotif(typeof Notification !== 'undefined' ? Notification.permission : 'default')
    } catch {}
  }, [])

  const saveLang = (v: 'ru'|'kz') => {
    setLang(v)
    try {
      localStorage.setItem('lang', v)
      window.dispatchEvent(new CustomEvent('lang-change', { detail: v }))
    } catch {}
  }

  const enablePush = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    try {
      const perm = await Notification.requestPermission()
      setNotif(perm)
      if (perm === 'granted') {
        const reg = await navigator.serviceWorker.register('/sw.js')
        await subscribePush(reg)
      }
    } catch {}
  }

  const t = {
    ru: {
      title: 'Настройки',
      language: 'Язык',
      notifications: 'Уведомления',
      pushNotif: 'Пуш-уведомления',
      enabled: 'Включены',
      enable: 'Включить',
    },
    kz: {
      title: 'Баптаулар',
      language: 'Тіл',
      notifications: 'Хабарландырулар',
      pushNotif: 'Push-хабарландырулар',
      enabled: 'Қосылған',
      enable: 'Қосу',
    },
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-neutral-50 md:h-screen">
      <div className="bg-white border-b border-neutral-200 px-4 py-4">
        <h1 className="text-lg font-semibold text-black">{t[lang].title}</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-xl mx-auto bg-white border border-neutral-200 rounded-2xl p-6 space-y-6">
          <div>
            <div className="text-sm font-medium text-black mb-2">{t[lang].language}</div>
            <div className="flex gap-2">
              <button onClick={() => saveLang('ru')} className={`px-4 py-2 rounded-xl text-sm ${lang==='ru'? 'bg-black text-white':'border border-neutral-300'}`}>RU</button>
              <button onClick={() => saveLang('kz')} className={`px-4 py-2 rounded-xl text-sm ${lang==='kz'? 'bg-black text-white':'border border-neutral-300'}`}>KZ</button>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-black mb-2">{t[lang].notifications}</div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-700">{t[lang].pushNotif}</div>
              <button onClick={enablePush} className="px-4 py-2 rounded-xl text-sm bg-black text-white">{notif==='granted' ? t[lang].enabled : t[lang].enable}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
