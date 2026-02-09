export function formatTemp(valueC) {
  if (typeof valueC !== 'number' || Number.isNaN(valueC)) return '—'
  return `${Math.round(valueC)}°C`
}

export function formatPrecip(valueMm) {
  if (typeof valueMm !== 'number' || Number.isNaN(valueMm)) return '—'
  return `${valueMm.toFixed(1)} mm`
}

export function formatVisibility(meters) {
  if (typeof meters !== 'number' || Number.isNaN(meters)) return '—'
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

export function toCompass(deg) {
  if (typeof deg !== 'number' || Number.isNaN(deg)) return '—'
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const i = Math.round(((deg % 360) / 22.5)) % 16
  return dirs[i]
}
