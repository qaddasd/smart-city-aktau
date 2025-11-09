import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

const ADMIN_EMAIL = "ch.qynon@gmail.com"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const body = await req.json()
    const id: string | undefined = body?.id
    const title: string | undefined = body?.title
    const { data: admin } = await supabase.from('users').select('id, push_endpoint, push_p256dh, push_auth').eq('email', ADMIN_EMAIL).single()
    try {
      const webpush = (await import('web-push')).default
      const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      const priv = process.env.VAPID_PRIVATE_KEY
      if (pub && priv && admin?.push_endpoint && admin?.push_p256dh && admin?.push_auth) {
        webpush.setVapidDetails(`mailto:${ADMIN_EMAIL}`, pub, priv)
        const subscription = { endpoint: admin.push_endpoint, keys: { p256dh: admin.push_p256dh, auth: admin.push_auth } }
        const payload = JSON.stringify({ title: 'Новая жалоба', body: title || 'Новая жалоба', url: id ? `/submissions/${id}` : '/admin/feedback' })
        await webpush.sendNotification(subscription as any, payload)
      }
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
