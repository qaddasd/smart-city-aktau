"use client"

import { useEffect } from "react"
import { subscribePush } from "@/lib/pwa"

export function PWAClient() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js")
        // ask for notifications permission lazily
        if (Notification && Notification.permission === "default") {
          try { await Notification.requestPermission() } catch {}
        }
        // subscribe push if permission granted
        if (Notification.permission === "granted") {
          try { await subscribePush(reg) } catch {}
        }
      } catch (e) {
        // noop
      }
    }
    register()
  }, [])
  return null
}
