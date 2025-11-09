export async function searchAddress(query: string, apiKey: string) {
  const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${apiKey}&limit=5`

  const response = await fetch(url)
  const data = await response.json()

  return data.results
}

export async function getTraffic(bbox: string, apiKey: string) {
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${apiKey}&point=47.1056,51.9142`

  const response = await fetch(url)
  const data = await response.json()

  return data
}

export async function reverseGeocode(lat: number, lon: number, apiKey: string) {
  const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${apiKey}`

  const response = await fetch(url)
  const data = await response.json()

  return data.addresses[0]
}
