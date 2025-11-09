import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ news: data || [] })
  } catch (e) {
    return NextResponse.json({ news: [] })
  }
}
