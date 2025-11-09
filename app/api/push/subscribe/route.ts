import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const body = await req.json()
    const endpoint: string | undefined = body?.endpoint
    const keys = body?.keys || {}
    if (!endpoint) return NextResponse.json({ error: "bad_request" }, { status: 400 })

    const updates: any = {
      push_endpoint: endpoint,
      push_p256dh: keys.p256dh || null,
      push_auth: keys.auth || null,
    }

    await supabase.from("users").update(updates).eq("id", user.id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
