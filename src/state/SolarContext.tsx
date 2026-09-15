import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { SITE, dateWithHours, hoursFromDate, toDateInputValue } from '../lib/site'
import {
  PLAYBACK_SPEEDS,
  calculateMoonPosition,
  calculateSolarPosition,
  getDayTimes,
  type PlaybackSpeed,
} from '../lib/solar'

export type SolarState = {
  selectedDate: Date
  selectedHours: number
  latitude: number
  longitude: number
  timezone: string
  isPlaying: boolean
  playbackSpeed: PlaybackSpeed
  dateInput: string
  day: ReturnType<typeof getDayTimes>
  solar: ReturnType<typeof calculateSolarPosition>
  moon: ReturnType<typeof calculateMoonPosition>
  isNight: boolean
  /** 0–1 approximate battery state of charge */
  batterySoc: number
  /** Day: charging from panels; Night: discharging to house */
  powerMode: 'solar' | 'battery' | 'idle'
  setDateInput: (v: string) => void
  setHours: (h: number) => void
  setPlaying: (v: boolean) => void
  togglePlay: () => void
  resetToSunrise: () => void
  setPlaybackSpeed: (s: PlaybackSpeed) => void
  speeds: readonly PlaybackSpeed[]
}

const SolarCtx = createContext<SolarState | null>(null)

function initialDate() {
  // Equinox-ish default for a clear high arc; still real math for that date
  const d = new Date(2026, 8, 15) // 15 Sep 2026
  d.setHours(12, 30, 0, 0)
  return d
}

export function SolarProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedHours, setSelectedHours] = useState(() => hoursFromDate(initialDate()))
  const [isPlaying, setPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(5)
  const batteryRef = useRef(0.72)

  const day = useMemo(
    () => getDayTimes(selectedDate, SITE.lat, SITE.lon),
    [selectedDate],
  )

  const instant = useMemo(
    () => dateWithHours(selectedDate, selectedHours),
    [selectedDate, selectedHours],
  )

  const solar = useMemo(
    () => calculateSolarPosition(instant, SITE.lat, SITE.lon),
    [instant],
  )

  const moon = useMemo(
    () => calculateMoonPosition(instant, SITE.lat, SITE.lon),
    [instant],
  )

  const isNight = solar.altitude < 0

  const powerMode: SolarState['powerMode'] = isNight
    ? 'battery'
    : solar.altitudeDeg > 8
      ? 'solar'
      : 'idle'

  const [batterySoc, setBatterySoc] = useState(0.72)

  // Soft battery charge/discharge based on sun
  useEffect(() => {
    const id = window.setInterval(() => {
      setBatterySoc((soc) => {
        let next = soc
        if (powerMode === 'solar') next = Math.min(1, soc + 0.004)
        else if (powerMode === 'battery') next = Math.max(0.08, soc - 0.0035)
        batteryRef.current = next
        return next
      })
    }, 400)
    return () => clearInterval(id)
  }, [powerMode])

  const setHours = useCallback(
    (h: number) => {
      const lo = day.sunriseHours - 1.5
      const hi = day.sunsetHours + 2.5
      setSelectedHours(Math.min(hi, Math.max(lo, h)))
    },
    [day.sunriseHours, day.sunsetHours],
  )

  const setDateInput = useCallback(
    (value: string) => {
      const [y, m, d] = value.split('-').map(Number)
      if (!y || !m || !d) return
      const next = new Date(y, m - 1, d)
      next.setHours(12, 0, 0, 0)
      setSelectedDate(next)
      const times = getDayTimes(next, SITE.lat, SITE.lon)
      setSelectedHours(times.solarNoonHours)
    },
    [],
  )

  const resetToSunrise = useCallback(() => {
    setPlaying(false)
    setSelectedHours(day.sunriseHours)
  }, [day.sunriseHours])

  const togglePlay = useCallback(() => setPlaying((p) => !p), [])

  // Playback across full day including evening for night/battery demo
  useEffect(() => {
    if (!isPlaying) return
    let frame = 0
    let last = performance.now()
    const lo = day.sunriseHours - 1.2
    const hi = day.sunsetHours + 2.2
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      // speed: hours of day advanced per real second
      const rate = 0.12 * playbackSpeed
      setSelectedHours((h) => {
        const next = h + dt * rate
        return next > hi ? lo : next
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isPlaying, playbackSpeed, day.sunriseHours, day.sunsetHours])

  const value: SolarState = {
    selectedDate,
    selectedHours,
    latitude: SITE.lat,
    longitude: SITE.lon,
    timezone: SITE.timezone,
    isPlaying,
    playbackSpeed,
    dateInput: toDateInputValue(selectedDate),
    day,
    solar,
    moon,
    isNight,
    batterySoc,
    powerMode,
    setDateInput,
    setHours,
    setPlaying,
    togglePlay,
    resetToSunrise,
    setPlaybackSpeed,
    speeds: PLAYBACK_SPEEDS,
  }

  return <SolarCtx.Provider value={value}>{children}</SolarCtx.Provider>
}

export function useSolar() {
  const ctx = useContext(SolarCtx)
  if (!ctx) throw new Error('useSolar must be used within SolarProvider')
  return ctx
}
