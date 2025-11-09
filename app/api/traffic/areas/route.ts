import { NextResponse } from "next/server"

const TOMTOM_KEY = process.env.TOMTOM_API_KEY || "8o13c5HDyKQ8CxPmoxM282Dtf1iR1lgG"
async function fetchMicrodistrictCenters(bbox: [number, number, number, number], signal: AbortSignal) {
  const [south, west, north, east] = bbox
  const query = `
  [out:json][timeout:25];
  (
    nwr["name"~"микрорайон|мкр|микроаудан",i](${south},${west},${north},${east});
  );
  out center tags;
  `
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data: query }),
    signal,
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`overpass ${res.status}`)
  const json = await res.json()
  return (json.elements || []).map((el: any) => {
    const center = el.center || { lat: el.lat, lon: el.lon }
    return { name: el.tags?.name || "", lat: center?.lat, lon: center?.lon }
  }).filter((x: any) => x.name && typeof x.lat === 'number' && typeof x.lon === 'number')
}

async function fetchFlow(lat: number, lon: number, signal: AbortSignal) {
  const zoom = 12
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative/${zoom}/json?point=${lat},${lon}&unit=KMPH&key=${TOMTOM_KEY}`
  const res = await fetch(url, { signal, cache: "no-store" })
  if (!res.ok) throw new Error(`flow ${res.status}`)
  return res.json() as Promise<any>
}

function gridCenters(bbox: [number, number, number, number], rows = 3, cols = 4) {
  const [minLat, minLon, maxLat, maxLon] = bbox
  const res: { name: string; lat: number; lon: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lat = minLat + (r + 0.5) * ((maxLat - minLat) / rows)
      const lon = minLon + (c + 0.5) * ((maxLon - minLon) / cols)
      res.push({ name: `Сектор ${r + 1}-${c + 1}`, lat, lon })
    }
  }
  return res
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const bboxParam = searchParams.get("bbox")
    const defaultBbox: [number, number, number, number] = [43.56, 51.05, 43.74, 51.27]
    const bbox = bboxParam ? (bboxParam.split(",").map(Number) as [number, number, number, number]) : defaultBbox

    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 12000)

    let centers: { name: string; lat: number; lon: number }[] = []
    try {
      centers = await fetchMicrodistrictCenters(bbox, ac.signal)
    } catch {}
    if (!centers.length) centers = gridCenters(bbox, 3, 4)

    const results: any[] = []
    const concurrency = 6
    let idx = 0

    async function worker() {
      while (idx < centers.length) {
        const i = idx++
        const c = centers[i]
        const del = 0.003
        const samplePts = [
          [c.lat, c.lon],
          [c.lat + del, c.lon], [c.lat - del, c.lon], [c.lat, c.lon + del], [c.lat, c.lon - del],
          [c.lat + del, c.lon + del], [c.lat - del, c.lon - del], [c.lat + del, c.lon - del], [c.lat - del, c.lon + del],
        ]
        let sum = 0, count = 0
        for (const [lat, lon] of samplePts) {
          try {
            const data = await fetchFlow(lat, lon, ac.signal)
            const flow = data.flowSegmentData || data
            const cs = Number(flow.currentSpeed) || 0
            const fs = Number(flow.freeFlowSpeed) || 0
            if (fs > 0) { sum += Math.max(0, Math.min(1, 1 - (cs / fs))); count++ }
          } catch {}
        }
        const congestion = count ? (sum / count) : 0
        results.push({ name: c.name, lat: c.lat, lon: c.lon, congestion })
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()))

    clearTimeout(timer)

    results.sort((a, b) => b.congestion - a.congestion)

    return NextResponse.json({ areas: results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "traffic areas failed" }, { status: 500 })
  }
}
