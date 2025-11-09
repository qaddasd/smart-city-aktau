/**
 * 2GIS API Integration
 * API Key: ed25e23b-ad6a-4963-8747-9d114edee3a5
 * Documentation: https://docs.2gis.com
 */

const API_KEY = "ed25e23b-ad6a-4963-8747-9d114edee3a5"

// Base URLs
const CATALOG_API = "https://catalog.api.2gis.com"
const ROUTING_API = "https://routing.api.2gis.com"

// Types
export interface PlaceResult {
  id: string
  name?: string
  full_name?: string
  address_name?: string
  point?: {
    lat: number
    lon: number
  }
  rubrics?: Array<{ name: string }>
  contact_groups?: Array<{
    contacts: Array<{ type: string; value: string }>
  }>
}

export interface RoutePoint {
  lat: number
  lon: number
  type: "stop" | "walking"
}

export interface RouteResult {
  total_distance: number
  total_duration: number
  maneuvers: Array<{
    comment: string
    outcoming_path?: {
      distance: number
      duration: number
      geometry: Array<{
        selection: string
      }>
    }
  }>
}

export interface SuggestResult {
  id: string
  name: string
  full_name?: string
  type: string
  purpose_name?: string
  address_name?: string
}

export interface Category {
  id: string
  name: string
  alias?: string
  org_count?: number
}

export interface Region {
  id: string
  name: string
  code?: string
  type: string
}

export interface PublicTransportRoute {
  total_distance: number
  total_duration: number
  routes: Array<{
    type: string
    name: string
    color?: string
  }>
}

export interface DistanceMatrixResult {
  routes: Array<{
    distance: number
    duration: number
    from_point_index: number
    to_point_index: number
  }>
}

export interface IsochroneResult {
  geometry: {
    type: string
    coordinates: any
  }
  reachable_duration: number
}

/**
 * Search for places (organizations, buildings, POIs)
 * @param query - Search query
 * @param location - Optional location for nearby search [lon, lat]
 * @param language - Language for results (ru or kk)
 */
export async function searchPlaces(
  query: string,
  location?: [number, number],
  language: "ru" | "kk" = "ru"
): Promise<PlaceResult[]> {
  try {
    let url = `${CATALOG_API}/3.0/items?q=${encodeURIComponent(query)}&key=${API_KEY}&locale=${language === "kk" ? "kk_KZ" : "ru_RU"}`
      + `&fields=items.point,items.address_name,items.full_name,items.rubrics,items.contact_groups`
      + `&page_size=20&sort=distance`
      + `&type=branch,building,attraction,street`
    
    if (location) {
      url += `&location=${location[0]},${location[1]}`
    }

    const response = await fetch(url)
    const data = await response.json()
    
    return data.result?.items || []
  } catch (error) {
    console.error("2GIS Search error:", error)
    return []
  }
}

/**
 * Geocode - convert address to coordinates
 * @param address - Address string
 * @param language - Language for results
 */
export async function geocode(
  address: string,
  language: "ru" | "kk" = "ru"
): Promise<PlaceResult | null> {
  try {
    const url = `${CATALOG_API}/3.0/items?q=${encodeURIComponent(address)}&key=${API_KEY}&locale=${language === "kk" ? "kk_KZ" : "ru_RU"}&type=street,building,attraction`
      + `&fields=items.point,items.address_name,items.full_name`
    
    const response = await fetch(url)
    const data = await response.json()
    
    return data.result?.items?.[0] || null
  } catch (error) {
    console.error("2GIS Geocode error:", error)
    return null
  }
}

/**
 * Reverse geocode - convert coordinates to address
 * @param lat - Latitude
 * @param lon - Longitude
 * @param language - Language for results
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  language: "ru" | "kk" = "ru"
): Promise<PlaceResult | null> {
  try {
    const url = `${CATALOG_API}/3.0/items?lat=${lat}&lon=${lon}&key=${API_KEY}&locale=${language === "kk" ? "kk_KZ" : "ru_RU"}&type=building,street,attraction&radius=100`
      + `&fields=items.point,items.address_name,items.full_name`
    
    const response = await fetch(url)
    const data = await response.json()
    
    return data.result?.items?.[0] || null
  } catch (error) {
    console.error("2GIS Reverse Geocode error:", error)
    return null
  }
}

/**
 * Get total count of places for a query within an area
 */
export async function getPlacesCount(
  query: string,
  location: [number, number],
  radius: number = 3000,
  language: "ru" | "kk" = "ru"
): Promise<number> {
  try {
    const url = `${CATALOG_API}/3.0/items?q=${encodeURIComponent(query)}&location=${location[0]},${location[1]}&radius=${radius}`
      + `&key=${API_KEY}&locale=${language === "kk" ? "kk_KZ" : "ru_RU"}&page_size=1`
    const res = await fetch(url)
    const data = await res.json()
    return typeof data.result?.total === 'number' ? data.result.total : (data.result?.items?.length || 0)
  } catch (e) {
    console.error('2GIS getPlacesCount error:', e)
    return 0
  }
}

/**
 * Calculate route between two or more points
 * @param points - Array of route points
 * @param transport - Transport type (driving, walking, bicycle, etc.)
 * @param trafficMode - Traffic mode (jam = real-time, statprediction = statistical)
 */
export async function calculateRoute(
  points: RoutePoint[],
  transport: "driving" | "walking" | "bicycle" | "taxi" = "driving",
  trafficMode: "jam" | "statprediction" | "free_flow" = "jam"
): Promise<RouteResult[]> {
  try {
    const url = `${ROUTING_API}/routing/7.0.0/global?key=${API_KEY}`
    
    const body = {
      points: points.map(p => ({
        lat: p.lat,
        lon: p.lon,
        type: p.type || "stop"
      })),
      transport: transport,
      traffic_mode: trafficMode,
      route_mode: "fastest",
      output: "detailed"
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return data.result || []
  } catch (error) {
    console.error("2GIS Routing error:", error)
    return []
  }
}

/**
 * Calculate additional delay (minutes) due to traffic between two points
 */
export async function getTrafficDelayBetween(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): Promise<number> {
  try {
    const [routeJam, routeFree] = await Promise.all([
      calculateRoute(
        [
          { lat: from.lat, lon: from.lon, type: "stop" },
          { lat: to.lat, lon: to.lon, type: "stop" },
        ],
        "driving",
        "jam",
      ),
      calculateRoute(
        [
          { lat: from.lat, lon: from.lon, type: "stop" },
          { lat: to.lat, lon: to.lon, type: "stop" },
        ],
        "driving",
        "free_flow",
      ),
    ])
    const jam = routeJam?.[0]?.total_duration ?? 0
    const free = routeFree?.[0]?.total_duration ?? 0
    return Math.max(0, Math.round((jam - free) / 60))
  } catch (e) {
    console.error('2GIS getTrafficDelayBetween error:', e)
    return 0
  }
}

/**
 * Search for nearby places by category
 * @param category - Category name (cafe, restaurant, pharmacy, etc.)
 * @param location - Center point [lon, lat]
 * @param radius - Search radius in meters
 * @param language - Language for results
 */
export async function searchNearby(
  category: string,
  location: [number, number],
  radius: number = 1000,
  language: "ru" | "kk" = "ru"
): Promise<PlaceResult[]> {
  try {
    const url = `${CATALOG_API}/3.0/items?q=${encodeURIComponent(category)}&location=${location[0]},${location[1]}&radius=${radius}&key=${API_KEY}&locale=${language === "kk" ? "kk_KZ" : "ru_RU"}&sort_point=${location[0]},${location[1]}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    return data.result?.items || []
  } catch (error) {
    console.error("2GIS Nearby Search error:", error)
    return []
  }
}

/**
 * Get place details by ID
 * @param placeId - Place ID from 2GIS
 * @param language - Language for results
 */
export async function getPlaceDetails(
  placeId: string,
  language: "ru" | "kk" = "ru"
): Promise<PlaceResult | null> {
  try {
    const url = `${CATALOG_API}/3.0/items/byid?id=${placeId}&key=${API_KEY}&locale=${language === "kk" ? "kk_KZ" : "ru_RU"}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    return data.result?.items?.[0] || null
  } catch (error) {
    console.error("2GIS Place Details error:", error)
    return null
  }
}

/**
 * Get traffic information for a specific area
 * Note: 2GIS doesn't have a separate traffic API like TomTom
 * Traffic is integrated into routing results
 */
export async function getTrafficInfo(
  location: [number, number]
): Promise<{ hasTraffic: boolean; description: string }> {
  // For traffic visualization, we'll use the MapGL traffic layer
  // This is a placeholder that returns basic info
  return {
    hasTraffic: true,
    description: "Traffic data is displayed on the map"
  }
}

/**
 * Parse WKT LineString to coordinates array
 * Used for route geometry from 2GIS API
 */
export function parseLineString(wkt: string): [number, number][] {
  const match = wkt.match(/LINESTRING\(([^)]+)\)/)
  if (!match) return []
  
  const coords = match[1].split(", ").map(pair => {
    const [lon, lat] = pair.split(" ").map(Number)
    return [lon, lat] as [number, number]
  })
  
  return coords
}

/**
 * Format distance in meters to human-readable string
 */
export function formatDistance(meters: number, language: "ru" | "kk" = "ru"): string {
  if (meters < 1000) {
    return language === "ru" ? `${Math.round(meters)} м` : `${Math.round(meters)} м`
  }
  return language === "ru" ? `${(meters / 1000).toFixed(1)} км` : `${(meters / 1000).toFixed(1)} км`
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number, language: "ru" | "kk" = "ru"): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return language === "ru" 
      ? `${hours} ч ${minutes} мин`
      : `${hours} сағ ${minutes} мин`
  }
  return language === "ru" ? `${minutes} мин` : `${minutes} мин`
}

/**
 * Suggest API - Get search suggestions
 * @param query - Search query
 * @param location - Center point [lon, lat]
 * @param language - Language for results
 */
export async function getSuggestions(
  query: string,
  location?: [number, number],
  language: "ru" | "kk" = "ru"
): Promise<SuggestResult[]> {
  try {
    let url = `${CATALOG_API}/3.0/suggests?q=${encodeURIComponent(query)}&key=${API_KEY}&locale=${language === "kk" ? "kk_KZ" : "ru_RU"}`
    
    if (location) {
      url += `&location=${location[0]},${location[1]}`
    }

    const response = await fetch(url)
    const data = await response.json()
    
    return data.result?.items || []
  } catch (error) {
    console.error("2GIS Suggest error:", error)
    return []
  }
}

/**
 * Categories API - Get list of categories
 * @param language - Language for results
 */
export async function getCategories(language: "ru" | "kk" = "ru"): Promise<Category[]> {
  try {
    const url = `${CATALOG_API}/2.0/catalog/rubric/list?key=${API_KEY}&locale=${language === "kk" ? "kk_KZ" : "ru_RU"}&fields=items.org_count`
    
    const response = await fetch(url)
    const data = await response.json()
    
    return data.result?.items || []
  } catch (error) {
    console.error("2GIS Categories error:", error)
    return []
  }
}

/**
 * Search by category ID
 * @param categoryId - Category ID
 * @param location - Center point [lon, lat]
 * @param radius - Search radius in meters
 * @param language - Language for results
 */
export async function searchByCategory(
  categoryId: string,
  location: [number, number],
  radius: number = 1000,
  language: "ru" | "kk" = "ru"
): Promise<PlaceResult[]> {
  try {
    const url = `${CATALOG_API}/3.0/items?rubric_id=${categoryId}&location=${location[0]},${location[1]}&radius=${radius}&key=${API_KEY}&locale=${language === "kk" ? "kk_KZ" : "ru_RU"}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    return data.result?.items || []
  } catch (error) {
    console.error("2GIS Category Search error:", error)
    return []
  }
}

/**
 * Regions API - Get available regions
 * @param language - Language for results
 */
export async function getRegions(language: "ru" | "kk" = "ru"): Promise<Region[]> {
  try {
    const url = `${CATALOG_API}/2.0/region/list?key=${API_KEY}&locale=${language === "kk" ? "kk_KZ" : "ru_RU"}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    return data.result?.items || []
  } catch (error) {
    console.error("2GIS Regions error:", error)
    return []
  }
}

/**
 * Public Transport API - Calculate public transport route
 * @param points - Start and end points
 * @param language - Language for results
 */
export async function calculatePublicTransportRoute(
  points: [RoutePoint, RoutePoint],
  language: "ru" | "kk" = "ru"
): Promise<PublicTransportRoute | null> {
  try {
    const url = `${ROUTING_API}/public_transport/1.0?key=${API_KEY}`
    
    const body = {
      from: { lat: points[0].lat, lon: points[0].lon },
      to: { lat: points[1].lat, lon: points[1].lon },
      locale: language === "kk" ? "kk_KZ" : "ru_RU"
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return data.result?.[0] || null
  } catch (error) {
    console.error("2GIS Public Transport error:", error)
    return null
  }
}

/**
 * Distance Matrix API - Calculate distances between multiple points
 * @param sources - Source points
 * @param targets - Target points
 */
export async function calculateDistanceMatrix(
  sources: Array<{ lat: number; lon: number }>,
  targets: Array<{ lat: number; lon: number }>
): Promise<DistanceMatrixResult | null> {
  try {
    const url = `${ROUTING_API}/distance_matrix/1.0?key=${API_KEY}`
    
    const body = {
      sources: sources,
      targets: targets,
      transport: "car"
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("2GIS Distance Matrix error:", error)
    return null
  }
}

/**
 * TSP API - Solve Traveling Salesman Problem
 * @param points - Points to visit
 * @param startIndex - Index of starting point
 */
export async function solveTSP(
  points: Array<{ lat: number; lon: number }>,
  startIndex: number = 0
): Promise<RouteResult | null> {
  try {
    const url = `${ROUTING_API}/tsp/1.0?key=${API_KEY}`
    
    const body = {
      points: points,
      start_point_index: startIndex,
      transport: "car"
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return data.result?.[0] || null
  } catch (error) {
    console.error("2GIS TSP error:", error)
    return null
  }
}

/**
 * Isochrone API - Get reachable area within time
 * @param point - Starting point
 * @param duration - Duration in seconds
 * @param transport - Transport type
 */
export async function calculateIsochrone(
  point: { lat: number; lon: number },
  duration: number,
  transport: "car" | "pedestrian" | "public_transport" = "car"
): Promise<IsochroneResult | null> {
  try {
    const url = `${ROUTING_API}/isochrone/1.0?key=${API_KEY}`
    
    const body = {
      point: point,
      duration: duration,
      transport: transport
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return data.result?.[0] || null
  } catch (error) {
    console.error("2GIS Isochrone error:", error)
    return null
  }
}

/**
 * Map Matching API - Match GPS trace to roads
 * @param points - Array of GPS points with timestamps
 */
export async function matchToRoads(
  points: Array<{ lat: number; lon: number; timestamp?: number }>
): Promise<RouteResult | null> {
  try {
    const url = `${ROUTING_API}/map_matching/1.0?key=${API_KEY}`
    
    const body = {
      points: points,
      transport: "car"
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return data.result?.[0] || null
  } catch (error) {
    console.error("2GIS Map Matching error:", error)
    return null
  }
}

/**
 * Popular categories for quick access
 */
export const POPULAR_CATEGORIES = {
  ru: [
    { id: "restaurants", name: "Рестораны" },
    { id: "cafes", name: "Кафе" },
    { id: "pharmacies", name: "Аптеки" },
    { id: "hospitals", name: "Больницы" },
    { id: "gas_stations", name: "АЗС" },
    { id: "banks", name: "Банки" },
    { id: "atm", name: "Банкоматы" },
    { id: "hotels", name: "Отели" },
    { id: "shops", name: "Магазины" },
    { id: "supermarkets", name: "Супермаркеты" },
    { id: "parking", name: "Парковки" },
    { id: "car_service", name: "Автосервис" },
  ],
  kk: [
    { id: "restaurants", name: "Мейрамханалар" },
    { id: "cafes", name: "Кафелер" },
    { id: "pharmacies", name: "Дәріханалар" },
    { id: "hospitals", name: "Аурухана" },
    { id: "gas_stations", name: "ЖҚС" },
    { id: "banks", name: "Банктер" },
    { id: "atm", name: "Банкоматтар" },
    { id: "hotels", name: "Қонақ үйлер" },
    { id: "shops", name: "Дүкендер" },
    { id: "supermarkets", name: "Супермаркеттер" },
    { id: "parking", name: "Тұрақтар" },
    { id: "car_service", name: "Автосервис" },
  ]
}
