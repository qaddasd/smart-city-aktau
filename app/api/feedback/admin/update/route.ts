import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const ADMIN_EMAIL = "ch.qynon@gmail.com"

async function ensureVapid() {
  const webpush = (await import('web-push')).default
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (pub && priv) {
    webpush.setVapidDetails(`mailto:${ADMIN_EMAIL}`, pub, priv)
    return webpush
  }
  return null
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "forbidden" }, { status: 403 })

    const body = await req.json()
    const id: string = body?.id
    const status: string = body?.status
    const admin_comment: string | null = body?.comment ?? null
    if (!id || !status) return NextResponse.json({ error: "bad_request" }, { status: 400 })
    const db: any = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase
    const { data: fb, error: fe } = await db.from('feedback').select('*').eq('id', id).single()
    if (fe || !fb) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    await db.from('feedback').update({ status, admin_comment }).eq('id', id)
    const { data: profile } = await db.from('users').select('push_endpoint, push_p256dh, push_auth').eq('id', fb.user_id).single()
    const webpush = await ensureVapid()
    const canPush = webpush && profile?.push_endpoint && profile?.push_p256dh && profile?.push_auth
    if (canPush) {
      const subscription = {
        endpoint: profile.push_endpoint,
        keys: { p256dh: profile.push_p256dh, auth: profile.push_auth },
      }
      const payload = JSON.stringify({
        title: 'Статус вашей жалобы обновлен',
        body: `${status}${admin_comment ? `: ${admin_comment}` : ''}`,
        url: `/submissions/${id}`,
      })
      try { await webpush!.sendNotification(subscription as any, payload) } catch {}
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
