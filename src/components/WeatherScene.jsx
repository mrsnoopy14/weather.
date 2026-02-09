import { useEffect, useMemo, useRef } from 'react'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function windVector(deg, speed) {
  if (typeof deg !== 'number' || Number.isNaN(deg)) return { x: 0, y: 0 }
  const rad = (deg * Math.PI) / 180
  // Wind direction is where it comes FROM; for particle drift we want where it goes TO.
  // So we flip by 180deg.
  const toRad = rad + Math.PI
  return {
    x: Math.sin(toRad) * speed,
    y: Math.cos(toRad) * speed,
  }
}

function chooseMode({ weatherCode, precipitation, visibility }) {
  if (weatherCode === 45 || weatherCode === 48) return 'fog'

  // Snow codes
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'snow'

  // Rain / drizzle / showers
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return 'rain'

  // Thunder
  if ([95, 96, 99].includes(weatherCode)) return 'storm'

  // Heuristic: low visibility => fog
  if (typeof visibility === 'number' && visibility < 1200) return 'fog'

  // Some precipitation but unknown code
  if (typeof precipitation === 'number' && precipitation > 0.1) return 'rain'

  return 'clear'
}

export default function WeatherScene({ current }) {
  const canvasRef = useRef(null)

  const scene = useMemo(() => {
    const weatherCode = current?.weather_code
    const precipitation = current?.precipitation
    const visibility = current?.visibility

    const mode = chooseMode({ weatherCode, precipitation, visibility })

    const windSpeed = typeof current?.wind_speed_10m === 'number' ? current.wind_speed_10m : 0
    const windDir = typeof current?.wind_direction_10m === 'number' ? current.wind_direction_10m : 0

    // Intensity: 0..1
    const intensity = clamp((typeof precipitation === 'number' ? precipitation : 0) / 3, 0.15, 1)

    return { mode, windSpeed, windDir, intensity }
  }, [current])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let rafId = 0
    let running = true

    const particles = []

    const state = {
      w: 0,
      h: 0,
      dpr: 1,
      t: 0,
    }

    function resize() {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
      state.dpr = dpr
      const rect = canvas.getBoundingClientRect()
      state.w = Math.max(1, Math.floor(rect.width))
      state.h = Math.max(1, Math.floor(rect.height))
      canvas.width = Math.floor(state.w * dpr)
      canvas.height = Math.floor(state.h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function addParticle(mode) {
      // z: 0..1 where 0 is far, 1 is near
      const z = Math.random()
      const base = mode === 'rain' ? 160 : mode === 'snow' ? 60 : 30
      const speed = base * (0.25 + z)

      return {
        x: Math.random() * state.w,
        y: Math.random() * state.h,
        z,
        speed,
        seed: Math.random() * 1000,
      }
    }

    function targetCount(mode, intensity) {
      if (mode === 'snow') return Math.round(220 * intensity)
      if (mode === 'rain') return Math.round(260 * intensity)
      if (mode === 'storm') return Math.round(320 * intensity)
      if (mode === 'fog') return 80
      return 60
    }

    function clear(mode) {
      // Background: pseudo-3D sky gradient
      const { w, h } = state
      ctx.clearRect(0, 0, w, h)

      // Subtle vignette
      const g = ctx.createRadialGradient(w * 0.5, h * 0.15, 50, w * 0.5, h * 0.15, Math.max(w, h))
      if (mode === 'storm') {
        g.addColorStop(0, 'rgba(150, 170, 255, 0.08)')
        g.addColorStop(1, 'rgba(0, 0, 0, 0.0)')
      } else if (mode === 'fog') {
        g.addColorStop(0, 'rgba(200, 220, 255, 0.10)')
        g.addColorStop(1, 'rgba(0, 0, 0, 0.0)')
      } else {
        g.addColorStop(0, 'rgba(110, 231, 255, 0.10)')
        g.addColorStop(1, 'rgba(0, 0, 0, 0.0)')
      }
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }

    let last = performance.now()

    function frame(now) {
      if (!running) return
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      state.t += dt

      const mode = scene.mode
      const intensity = scene.intensity

      resize()
      clear(mode)

      const count = targetCount(mode, intensity)
      while (particles.length < count) particles.push(addParticle(mode))
      while (particles.length > count) particles.pop()

      const wind = windVector(scene.windDir, (scene.windSpeed / 3.6) * 18) // scaled px/s

      for (const p of particles) {
        const depth = 0.25 + p.z * 0.95

        // Drift differs per mode
        const driftX = wind.x * (0.15 + p.z) + Math.sin(state.t * 1.2 + p.seed) * (mode === 'snow' ? 14 : 2)
        const driftY = wind.y * 0.05

        p.x += driftX * dt
        p.y += (p.speed * depth + driftY) * dt

        if (p.y > state.h + 20) {
          p.y = -20
          p.x = Math.random() * state.w
        }
        if (p.x < -40) p.x = state.w + 40
        if (p.x > state.w + 40) p.x = -40

        if (mode === 'rain' || mode === 'storm') {
          const len = 14 + p.z * 22
          ctx.strokeStyle = mode === 'storm' ? 'rgba(160, 190, 255, 0.35)' : 'rgba(200, 230, 255, 0.25)'
          ctx.lineWidth = 1 + p.z * 0.8
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + driftX * 0.02, p.y + len)
          ctx.stroke()
        } else if (mode === 'snow') {
          const r = 0.8 + p.z * 2.2
          ctx.fillStyle = `rgba(255,255,255,${0.22 + p.z * 0.35})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // clear/fog: tiny floating dust
          const r = 0.6 + p.z * 1.4
          ctx.fillStyle = mode === 'fog' ? `rgba(230,245,255,${0.06 + p.z * 0.10})` : `rgba(255,255,255,${0.05 + p.z * 0.10})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (mode === 'fog') {
        // soft fog layers
        const { w, h } = state
        ctx.fillStyle = 'rgba(220, 235, 255, 0.06)'
        ctx.fillRect(0, h * 0.58, w, h * 0.42)
        ctx.fillStyle = 'rgba(220, 235, 255, 0.04)'
        ctx.fillRect(0, h * 0.40, w, h * 0.60)
      }

      if (mode === 'storm') {
        // occasional lightning flash
        const flash = Math.sin(state.t * 0.9) > 0.999 ? 0.12 : 0
        if (flash) {
          ctx.fillStyle = `rgba(180, 210, 255, ${flash})`
          ctx.fillRect(0, 0, state.w, state.h)
        }
      }

      rafId = requestAnimationFrame(frame)
    }

    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    resize()
    rafId = requestAnimationFrame(frame)

    return () => {
      running = false
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
    }
  }, [scene])

  const modeClass = `scene scene-${scene.mode}`

  return (
    <div className={modeClass} aria-hidden="true">
      <canvas ref={canvasRef} className="sceneCanvas" />
      <div className="sceneGlow" />
    </div>
  )
}
