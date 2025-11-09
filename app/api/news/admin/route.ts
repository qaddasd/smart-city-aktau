import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const ADMIN_EMAIL = "ch.qynon@gmail.com"
export async function GET(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "forbidden" }, { status: 403 })

    const db: any = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase
    const { data, error } = await db.from('news').select('*').order('created_at', { ascending: false })
    if (error) throw error

    return NextResponse.json({ news: data || [] })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "forbidden" }, { status: 403 })

    const body = await req.json()
    const { title_ru, title_kz, description_ru, description_kz, category, priority, location, image_url, published } = body

    if (!title_ru || !title_kz || !description_ru || !description_kz) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    const db: any = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase
    const { data, error } = await db.from('news').insert({
      title_ru,
      title_kz,
      description_ru,
      description_kz,
      category: category || 'event',
      priority: priority || 'medium',
      location: location || null,
      image_url: image_url || null,
      published: published !== undefined ? published : true,
      created_by: user.id,
    }).select().single()

    if (error) throw error

    return NextResponse.json({ news: data })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
export async function PUT(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "forbidden" }, { status: 403 })

    const body = await req.json()
    const { id, title_ru, title_kz, description_ru, description_kz, category, priority, location, image_url, published } = body

    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

    const updates: any = { updated_at: new Date().toISOString() }
    if (title_ru !== undefined) updates.title_ru = title_ru
    if (title_kz !== undefined) updates.title_kz = title_kz
    if (description_ru !== undefined) updates.description_ru = description_ru
    if (description_kz !== undefined) updates.description_kz = description_kz
    if (category !== undefined) updates.category = category
    if (priority !== undefined) updates.priority = priority
    if (location !== undefined) updates.location = location
    if (image_url !== undefined) updates.image_url = image_url
    if (published !== undefined) updates.published = published

    const db: any = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase
    const { data, error } = await db.from('news').update(updates).eq('id', id).select().single()
    if (error) throw error

    return NextResponse.json({ news: data })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
export async function DELETE(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "forbidden" }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

    const db: any = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase
    const { error } = await db.from('news').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
