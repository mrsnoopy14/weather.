import { useMemo, useState } from 'react'
import { searchCity, getForecast } from './api/openMeteo.js'
import { formatPrecip, formatTemp, formatVisibility, toCompass } from './utils/format.js'
import { weatherCodeToText, isFogCode } from './utils/weatherCodes.js'

function LocationTitle({ place }) {
  if (!place) return null
  const parts = [place.name]
  if (place.admin1) parts.push(place.admin1)
  if (place.country) parts.push(place.country)
  return <div className="subtitle">{parts.join(', ')}</div>
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <div className="metricLabel">{label}</div>
      <div className="metricValue">{value}</div>
    </div>
  )
}

export default function App() {
  const [city, setCity] = useState('')
  const [place, setPlace] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const current = data?.current ?? null
  const daily = data?.daily ?? null

  const fogLikely = useMemo(() => {
    if (!current) return false
    const visibilityM = current.visibility
    return isFogCode(current.weather_code) || (typeof visibilityM === 'number' && visibilityM < 1000)
  }, [current])

  async function onSubmit(e) {
    e.preventDefault()
    const q = city.trim()
    if (!q) {
      setError('Type a city name first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const found = await searchCity(q)
      setPlace(found)
      const forecast = await getForecast({ latitude: found.latitude, longitude: found.longitude })
      setData(forecast)
    } catch (err) {
      setData(null)
      setPlace(null)
      setError(err?.message || 'Failed to load weather data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="header">
        <h1 className="h1">Simple Weather App</h1>
        <p className="muted">Search a city to get live temperature, wind, fog/visibility and precipitation.</p>
        {place ? <LocationTitle place={place} /> : null}
      </header>

      <section className="card">
          <form className="form" onSubmit={onSubmit}>
            <label className="label" htmlFor="city">City</label>
            <div className="row">
              <input
                id="city"
                className="input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Mumbai, London, New York"
                autoComplete="off"
              />
              <button className="button" type="submit" disabled={loading}>
                {loading ? 'Loading…' : 'Get Weather'}
              </button>
            </div>
          </form>

          {error ? <div className="error">{error}</div> : null}

          {current ? (
            <div className="grid">
              <Metric label="Temperature" value={formatTemp(current.temperature_2m)} />
              <Metric label="Feels Like" value={formatTemp(current.apparent_temperature)} />
              <Metric label="Condition" value={weatherCodeToText(current.weather_code) || `WMO ${current.weather_code}`} />
              <Metric label="Wind" value={`${Math.round(current.wind_speed_10m)} km/h (${toCompass(current.wind_direction_10m)})`} />
              <Metric label="Gusts" value={`${Math.round(current.wind_gusts_10m)} km/h`} />
              <Metric label="Visibility" value={`${formatVisibility(current.visibility)}${fogLikely ? ' • Fog likely' : ''}`} />
              <Metric label="Precipitation" value={formatPrecip(current.precipitation)} />
              <Metric label="Rain / Showers / Snow" value={`${formatPrecip(current.rain)} / ${formatPrecip(current.showers)} / ${formatPrecip(current.snowfall)}`} />

              <div className="meta">
                Updated: <span className="mono">{current.time}</span> ({data?.timezone})
              </div>
            </div>
          ) : (
            <div className="empty muted">Try searching: Delhi, Tokyo, Paris, Toronto…</div>
          )}
        </section>

      {daily ? (
        <section className="card">
          <h2 className="h2">7‑Day Forecast</h2>
          <div className="daily">
            {daily.time.map((t, i) => (
              <div className="day" key={t}>
                <div className="dayDate">{t}</div>
                <div className="dayMain">
                  <div className="dayTemp">
                    {formatTemp(daily.temperature_2m_max[i])} / {formatTemp(daily.temperature_2m_min[i])}
                  </div>
                  <div className="dayCond">{weatherCodeToText(daily.weather_code[i])}</div>
                </div>
                <div className="daySmall">Precip: {formatPrecip(daily.precipitation_sum[i])}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="footer muted">Data by Open‑Meteo (no API key).</footer>
    </div>
  )
}
