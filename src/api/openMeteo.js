const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'

export async function searchCity(name) {
  const url = new URL(GEO_BASE)
  url.searchParams.set('name', name)
  url.searchParams.set('count', '5')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const res = await fetch(url)
  if (!res.ok) throw new Error('City search failed.')

  const json = await res.json()
  const place = json?.results?.[0]
  if (!place) throw new Error('City not found. Try a more specific name.')

  return {
    name: place.name,
    admin1: place.admin1,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
  }
}

export async function getForecast({ latitude, longitude }) {
  const url = new URL(FORECAST_BASE)
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))

  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'apparent_temperature',
      'precipitation',
      'rain',
      'showers',
      'snowfall',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'visibility',
    ].join(','),
  )

  url.searchParams.set(
    'daily',
    ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'weather_code'].join(','),
  )

  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set('wind_speed_unit', 'kmh')
  url.searchParams.set('precipitation_unit', 'mm')

  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather request failed.')

  const json = await res.json()

  return {
    timezone: json.timezone,
    current: json.current,
    daily: json.daily,
    units: {
      current: json.current_units,
      daily: json.daily_units,
    },
  }
}
