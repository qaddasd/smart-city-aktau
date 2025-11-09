export async function getWeatherAlerts(lat: number, lon: number, apiKey: string) {
  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${apiKey}`

  const response = await fetch(url)
  const data = await response.json()

  return data.alerts || []
}

export async function getCurrentWeather(lat: number, lon: number, apiKey: string) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`

  const response = await fetch(url)
  const data = await response.json()

  return data
}
