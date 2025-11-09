"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase-client"
import { useToast } from "@/lib/toast"
import { Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"

export default function LoginPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient()
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push("/dashboard")
        router.refresh()
      }
    })()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createBrowserClient()

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      addToast({
        type: "error",
        title: "Ошибка входа",
        description: signInError.message,
      })
      setLoading(false)
      return
    }

    if (data.user) {
      addToast({
        type: "success",
        title: "Вход выполнен успешно!",
      })

      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 500)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen w-full flex items-center justify-center bg-[#F4F1FF]"
    >
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[28px] shadow-2xl border border-neutral-200/60 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-500">
        <div className="relative hidden lg:block lg:h-full">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `url('/as.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-500/30" />
          <div className="absolute top-6 left-6 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
            <span className="text-3xl">✱</span>
          </div>
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <p className="text-sm opacity-90 mb-2">Вы легко можете</p>
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight">Получить доступ к личному центру управления городом</h1>
          </div>
        </div>
        <div className="px-8 py-10 lg:px-12 bg-white">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mb-4">
              <span className="text-xl text-white">✱</span>
            </div>
            <h2 className="text-[28px] font-bold text-black">Войти в аккаунт</h2>
            <p className="mt-2 text-neutral-500">Получите доступ к вашим задачам и проектам в любое время</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                Ваш email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6D5BFE] focus:border-transparent transition-all duration-300 ease-out"
                placeholder="example@gmail.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 pr-12 text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6D5BFE] focus:border-transparent transition-all duration-300 ease-out"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#5D5AFB] to-[#6B3BFF] font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>

            <p className="text-center text-sm text-neutral-600 mt-6">
              Нет аккаунта?{" "}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                Зарегистрироваться
              </Link>
            </p>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
