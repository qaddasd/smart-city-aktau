import { NextResponse } from "next/server"

const TOMTOM_KEY = process.env.TOMTOM_API_KEY || "8o13c5HDyKQ8CxPmoxM282Dtf1iR1lgG"

async function fetchFlow(lat: number, lon: number, abortSignal: AbortSignal) {
  const zoom = 12
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative/${zoom}/json?point=${lat},${lon}&unit=KMPH&key=${TOMTOM_KEY}`
  const res = await fetch(url, { signal: abortSignal, cache: "no-store" })
  if (!res.ok) throw new Error(`flow ${res.status}`)
  return res.json() as Promise<any>
}

function gridPoints(bbox: [number, number, number, number], steps = 7) {
  const [minLat, minLon, maxLat, maxLon] = bbox
  const pts: { lat: number; lon: number }[] = []
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < steps; j++) {
      const lat = minLat + (i + 0.5) * ((maxLat - minLat) / steps)
      const lon = minLon + (j + 0.5) * ((maxLon - minLon) / steps)
      pts.push({ lat, lon })
    }
  }
  return pts
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const bboxParam = searchParams.get("bbox")
    const defaultBbox: [number, number, number, number] = [43.56, 51.05, 43.74, 51.27]
    const bbox = bboxParam
      ? (bboxParam.split(",").map(Number) as [number, number, number, number])
      : defaultBbox
    const steps = Math.max(3, Math.min(12, Number(searchParams.get("steps")) || 7))

    const pts = gridPoints(bbox, steps)

    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 8000)

    const results: any[] = []
    const concurrency = 6
    let index = 0
    async function runOne() {
      while (index < pts.length) {
        const i = index++
        const p = pts[i]
        try {
          const data = await fetchFlow(p.lat, p.lon, ac.signal)
          const flow = (data && (data.flowSegmentData || data)) || {}
          const cs = Number(flow.currentSpeed) || 0
          const fs = Number(flow.freeFlowSpeed) || 0
          const conf = Number(flow.confidence) || 0
          const ratio = fs > 0 ? Math.min(1, Math.max(0, cs / fs)) : 1
          const congestion = 1 - ratio
          results.push({ lat: p.lat, lon: p.lon, currentSpeed: cs, freeFlowSpeed: fs, confidence: conf, congestion })
        } catch (e) {
        }
      }
    }
    const workers = Array.from({ length: concurrency }, () => runOne())
    await Promise.all(workers)

    clearTimeout(timer)

    const n = results.length || 1
    const avgCs = results.reduce((s, r) => s + r.currentSpeed, 0) / n
    const avgFs = results.reduce((s, r) => s + r.freeFlowSpeed, 0) / n
    const weighted = results
      .filter((r) => r.freeFlowSpeed > 0)
      .reduce(
        (acc, r) => {
          const w = Math.max(1, r.freeFlowSpeed) * (isFinite(r.confidence) ? Math.min(1, Math.max(0.1, r.confidence)) : 1)
          const ratio = Math.max(0, Math.min(1, r.currentSpeed / r.freeFlowSpeed))
          acc.sum += ratio * w
          acc.wsum += w
          return acc
        },
        { sum: 0, wsum: 0 },
      )
    const weightedRatio = weighted.wsum > 0 ? weighted.sum / weighted.wsum : (avgFs > 0 ? avgCs / avgFs : 1)
    const congestionPct = Math.max(0, Math.min(1, 1 - weightedRatio))

    const topHotspots = results
      .filter((r) => r.freeFlowSpeed > 0)
      .sort((a, b) => b.congestion - a.congestion)
      .slice(0, 8)

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      bbox,
      steps,
      points: results,
      metrics: {
        segments: results.length,
        avgCurrentSpeed: Math.round(avgCs),
        avgFreeFlowSpeed: Math.round(avgFs),
        speedDropPct: Math.max(0, 1 - (avgFs > 0 ? avgCs / avgFs : 1)),
        segmentsUsed: results.length,
        weightSum: Math.round(weighted.wsum),
        method: "weighted_freeflow_confidence",
        congestionPct,
        topHotspots,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "traffic summary failed" }, { status: 500 })
  }
}
