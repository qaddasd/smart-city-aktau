/**
 * Enhanced TomTom Maps API Integration
 * Includes: Traffic, Routing, Geocoding, Search, and Tracking features
 */

const TOMTOM_API_VERSION = "1"
const TOMTOM_SEARCH_VERSION = "2"

export interface RouteOptions {
  vehicleType?: "car" | "truck" | "taxi" | "bus" | "van" | "motorcycle" | "bicycle" | "pedestrian"
  routeType?: "fastest" | "shortest" | "eco" | "thrilling"
  traffic?: boolean
  avoid?: ("tollRoads" | "motorways" | "ferries" | "unpavedRoads")[]
  travelMode?: "car" | "truck" | "taxi" | "bus" | "van" | "motorcycle" | "bicycle" | "pedestrian"
}

export interface EVRoutingOptions extends RouteOptions {
  vehicleEngineType: "electric"
  currentChargeInkWh: number
  maxChargeInkWh: number
  constantSpeedConsumptionInkWhPerHundredkm?: string
}

// Search API
export async function searchAddress(query: string, apiKey: string, lat?: number, lon?: number, language = "ru-RU") {
  const baseUrl = `https://api.tomtom.com/search/${TOMTOM_SEARCH_VERSION}/search/${encodeURIComponent(query)}.json`
  const params = new URLSearchParams({
    key: apiKey,
    limit: "10",
    language,
  })

  if (lat && lon) {
    params.append("lat", lat.toString())
    params.append("lon", lon.toString())
  }

  const response = await fetch(`${baseUrl}?${params}`)
  if (!response.ok) throw new Error("Search failed")
  return await response.json()
}

// EV Search API
export async function searchEVChargingStations(apiKey: string, lat: number, lon: number, radius = 5000) {
  const url = `https://api.tomtom.com/search/${TOMTOM_SEARCH_VERSION}/categorySearch/electric%20vehicle%20station.json?key=${apiKey}&lat=${lat}&lon=${lon}&radius=${radius}`
  const response = await fetch(url)
  if (!response.ok) throw new Error("EV search failed")
  return await response.json()
}

// Geocoding API
export async function geocode(address: string, apiKey: string, language = "ru-RU") {
  const url = `https://api.tomtom.com/search/${TOMTOM_SEARCH_VERSION}/geocode/${encodeURIComponent(address)}.json?key=${apiKey}&language=${language}`
  const response = await fetch(url)
  if (!response.ok) throw new Error("Geocoding failed")
  return await response.json()
}

// Reverse Geocoding API
export async function reverseGeocode(lat: number, lon: number, apiKey: string, language = "ru-RU") {
  const url = `https://api.tomtom.com/search/${TOMTOM_SEARCH_VERSION}/reverseGeocode/${lat},${lon}.json?key=${apiKey}&language=${language}`
  const response = await fetch(url)
  if (!response.ok) throw new Error("Reverse geocoding failed")
  const data = await response.json()
  return data.addresses[0]
}

// Routing API
export async function calculateRoute(
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number },
  apiKey: string,
  options: RouteOptions = {}
) {
  const {
    vehicleType = "car",
    routeType = "fastest",
    traffic = true,
    travelMode = "car",
  } = options

  const originStr = `${origin.lat},${origin.lon}`
  const destinationStr = `${destination.lat},${destination.lon}`

  const params = new URLSearchParams({
    key: apiKey,
    traffic: traffic.toString(),
    routeType,
    travelMode,
    vehicleEngineType: "combustion",
  })

  const url = `https://api.tomtom.com/routing/${TOMTOM_API_VERSION}/calculateRoute/${originStr}:${destinationStr}/json?${params}`

  const response = await fetch(url)
  if (!response.ok) throw new Error("Route calculation failed")
  return await response.json()
}

// Long Distance EV Routing API
export async function calculateEVRoute(
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number },
  apiKey: string,
  options: EVRoutingOptions
) {
  const originStr = `${origin.lat},${origin.lon}`
  const destinationStr = `${destination.lat},${destination.lon}`

  const params = new URLSearchParams({
    key: apiKey,
    vehicleEngineType: "electric",
    currentChargeInkWh: options.currentChargeInkWh.toString(),
    maxChargeInkWh: options.maxChargeInkWh.toString(),
  })

  if (options.constantSpeedConsumptionInkWhPerHundredkm) {
    params.append("constantSpeedConsumptionInkWhPerHundredkm", options.constantSpeedConsumptionInkWhPerHundredkm)
  }

  const url = `https://api.tomtom.com/routing/${TOMTOM_API_VERSION}/calculateRoute/${originStr}:${destinationStr}/json?${params}`

  const response = await fetch(url)
  if (!response.ok) throw new Error("EV route calculation failed")
  return await response.json()
}

// Matrix Routing API
export async function calculateMatrixRouting(
  origins: { lat: number; lon: number }[],
  destinations: { lat: number; lon: number }[],
  apiKey: string
) {
  const url = `https://api.tomtom.com/routing/${TOMTOM_API_VERSION}/matrix/sync/json?key=${apiKey}`

  const body = {
    origins: origins.map((o) => ({ point: { latitude: o.lat, longitude: o.lon } })),
    destinations: destinations.map((d) => ({ point: { latitude: d.lat, longitude: d.lon } })),
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) throw new Error("Matrix routing failed")
  return await response.json()
}

// Traffic Flow API
export async function getTrafficFlow(lat: number, lon: number, apiKey: string, zoom = 10) {
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/${zoom}/json?key=${apiKey}&point=${lat},${lon}`

  const response = await fetch(url)
  if (!response.ok) throw new Error("Traffic flow request failed")
  return await response.json()
}

// Traffic Incidents API
export async function getTrafficIncidents(
  bbox: { minLat: number; minLon: number; maxLat: number; maxLon: number },
  apiKey: string
) {
  const bboxStr = `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`
  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${bboxStr}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory}}}&language=ru-RU`

  const response = await fetch(url)
  if (!response.ok) throw new Error("Traffic incidents request failed")
  return await response.json()
}

// Traffic Stats API
export async function getTrafficStats(
  lat: number,
  lon: number,
  apiKey: string,
  unit = "KMPH"
) {
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${apiKey}&point=${lat},${lon}&unit=${unit}`

  const response = await fetch(url)
  if (!response.ok) throw new Error("Traffic stats request failed")
  return await response.json()
}

// Snap to Roads API
export async function snapToRoads(
  points: { lat: number; lon: number }[],
  apiKey: string
) {
  const url = `https://api.tomtom.com/routing/${TOMTOM_API_VERSION}/snapToRoads/json?key=${apiKey}`

  const body = {
    points: points.map((p) => ({ latitude: p.lat, longitude: p.lon })),
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) throw new Error("Snap to roads failed")
  return await response.json()
}

// Waypoint Optimization API
export async function optimizeWaypoints(
  waypoints: { lat: number; lon: number }[],
  apiKey: string
) {
  const waypointsStr = waypoints.map((w) => `${w.lat},${w.lon}`).join(":")
  const url = `https://api.tomtom.com/routing/${TOMTOM_API_VERSION}/calculateRoute/${waypointsStr}/json?key=${apiKey}&computeBestOrder=true`

  const response = await fetch(url)
  if (!response.ok) throw new Error("Waypoint optimization failed")
  return await response.json()
}

// Batch Search API (Async)
export async function batchSearch(queries: string[], apiKey: string) {
  const url = `https://api.tomtom.com/search/${TOMTOM_SEARCH_VERSION}/batch/sync.json?key=${apiKey}`

  const body = {
    batchItems: queries.map((query, index) => ({
      query: `/search/${encodeURIComponent(query)}.json?limit=1`,
    })),
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) throw new Error("Batch search failed")
  return await response.json()
}

// Helper function to get distance and duration from route
export function getRouteInfo(routeData: any) {
  if (!routeData.routes || !routeData.routes[0]) return null

  const route = routeData.routes[0]
  const summary = route.summary

  return {
    distance: summary.lengthInMeters,
    distanceKm: (summary.lengthInMeters / 1000).toFixed(2),
    duration: summary.travelTimeInSeconds,
    durationMin: Math.round(summary.travelTimeInSeconds / 60),
    trafficDelay: summary.trafficDelayInSeconds || 0,
    departureTime: summary.departureTime,
    arrivalTime: summary.arrivalTime,
  }
}

// Helper function to format coordinates for TomTom
export function formatCoordinates(lat: number, lon: number): string {
  return `${lat},${lon}`
}

// Helper to parse TomTom coordinates
export function parseCoordinates(coordStr: string): { lat: number; lon: number } {
  const [lat, lon] = coordStr.split(",").map(Number)
  return { lat, lon }
}
