const NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
const OSRM_BASE = "https://router.project-osrm.org"

export type Lang = "ru" | "kk"

export interface PlaceResult {
  name: string
  full_name?: string
  address_name?: string
  point: { lat: number; lon: number }
  osm_id?: number
  osm_type?: "node" | "way" | "relation"
  category?: string
  type?: string
  extratags?: Record<string, string>
  address?: Record<string, string>
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  lang: Lang = "ru"
): Promise<PlaceResult | null> {
  const fetchJSON = async (url: string, timeoutMs = 6000) => {
    const ctrl = new AbortController()
    const id = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } })
      if (!r.ok) return null
      return await r.json()
    } finally {
      clearTimeout(id)
    }
  }
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
    "accept-language": lang,
  })
  const url = `${NOMINATIM_BASE}/reverse?${params.toString()}`
  const d = await fetchJSON(url)
  if (!d) return null
  return {
    name: d.name || d.display_name || "",
    full_name: d.display_name,
    address_name: d.display_name,
    point: { lat: parseFloat(d.lat), lon: parseFloat(d.lon) },
    osm_id: d.osm_id,
    osm_type: d.osm_type,
    category: d.category,
    type: d.type,
    extratags: d.extratags,
    address: d.address,
  }
}

export async function searchPlaces(
  query: string,
  location?: [number, number],
  lang: Lang = "ru",
  limit: number = 10
): Promise<PlaceResult[]> {
  const fetchJSON = async (url: string, timeoutMs = 6000) => {
    const ctrl = new AbortController()
    const id = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } })
      if (!r.ok) return null
      return await r.json()
    } finally {
      clearTimeout(id)
    }
  }
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
    limit: String(limit),
    "accept-language": lang,
  })
  params.set("countrycodes", "kz")

  if (location) {
    const [lat, lon] = location
    const bbox = [lon - 0.15, lat + 0.15, lon + 0.15, lat - 0.15]
    params.set("viewbox", `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`)
    params.set("bounded", "1")
  }

  const url = `${NOMINATIM_BASE}/search?${params.toString()}`
  const data = await fetchJSON(url)
  return (data || []).map((d: any) => ({
    name: d.name || d.display_name || "",
    full_name: d.display_name,
    address_name: d.display_name,
    point: { lat: parseFloat(d.lat), lon: parseFloat(d.lon) },
    osm_id: d.osm_id,
    osm_type: d.osm_type,
    category: d.category,
    type: d.type,
    extratags: d.extratags,
    address: d.address,
  }))
}

export async function getSuggestions(query: string, location?: [number, number], lang: Lang = "ru"): Promise<PlaceResult[]> {
  return searchPlaces(query, location, lang, 5)
}

export async function geocode(query: string, lang: Lang = "ru"): Promise<PlaceResult | null> {
  const res = await searchPlaces(query, undefined, lang, 1)
  return res[0] || null
}

export async function getPlaceDetails(
  osm_type: "node" | "way" | "relation",
  osm_id: number,
  lang: Lang = "ru"
): Promise<PlaceResult | null> {
  const fetchJSON = async (url: string, timeoutMs = 6000) => {
    const ctrl = new AbortController()
    const id = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } })
      if (!r.ok) return null
      return await r.json()
    } finally {
      clearTimeout(id)
    }
  }
  const typeChar = osm_type === "node" ? "N" : osm_type === "way" ? "W" : "R"
  const params = new URLSearchParams({
    osm_ids: `${typeChar}${osm_id}`,
    format: "json",
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
    "accept-language": lang,
  })
  const url = `${NOMINATIM_BASE}/lookup?${params.toString()}`
  const data = await fetchJSON(url)
  const d = Array.isArray(data) ? data[0] : null
  if (!d) return null
  return {
    name: d.name || d.display_name || "",
    full_name: d.display_name,
    address_name: d.display_name,
    point: { lat: parseFloat(d.lat), lon: parseFloat(d.lon) },
    osm_id: d.osm_id,
    osm_type: d.osm_type,
    category: d.category,
    type: d.type,
    extratags: d.extratags,
    address: d.address,
  }
}

export interface RouteStep {
  name: string
  distance: number
  duration: number
  maneuver: { type?: string; modifier?: string; instruction?: string }
}

export interface RouteResult {
  distance: number
  duration: number
  coordinates: [number, number][] // [lat, lon]
  steps?: RouteStep[]
}

export async function routeOSRM(
  profile: "driving" | "foot",
  from: [number, number], // [lat, lon]
  to: [number, number], // [lat, lon]
): Promise<RouteResult | null> {
  const fetchJSON = async (url: string, timeoutMs = 8000) => {
    const ctrl = new AbortController()
    const id = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const r = await fetch(url, { signal: ctrl.signal })
      if (!r.ok) return null
      return await r.json()
    } finally {
      clearTimeout(id)
    }
  }
  const fromLonLat = `${from[1]},${from[0]}`
  const toLonLat = `${to[1]},${to[0]}`
  const url = `${OSRM_BASE}/route/v1/${profile}/${fromLonLat};${toLonLat}?overview=full&geometries=geojson&steps=true&annotations=false`
  const data = await fetchJSON(url)
  if (!data?.routes?.[0]?.geometry?.coordinates) return null
  const r = data.routes[0]
  const coords: [number, number][] = r.geometry.coordinates.map((c: number[]) => [c[1], c[0]])
  const steps: RouteStep[] | undefined = r.legs?.[0]?.steps?.map((s: any) => ({
    name: s.name,
    distance: s.distance,
    duration: s.duration,
    maneuver: { type: s.maneuver?.type, modifier: s.maneuver?.modifier, instruction: s.maneuver?.instruction },
  }))
  return { distance: r.distance, duration: r.duration, coordinates: coords, steps }
}

export async function calculateAllModes(
  from: [number, number],
  to: [number, number]
): Promise<{ mode: "car" | "walk" | "bus"; route: RouteResult | null }[]> {
  const [car, walk] = await Promise.all([
    routeOSRM("driving", from, to),
    routeOSRM("foot", from, to),
  ])
  const bus = car // approximate using driving profile
  return [
    { mode: "car", route: car },
    { mode: "walk", route: walk },
    { mode: "bus", route: bus },
  ]
}

export function formatKm(meters: number): string {
  return (meters / 1000).toFixed(1)
}

export function formatMin(seconds: number): number {
  return Math.round(seconds / 60)
}
