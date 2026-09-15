export type SolarPosition = {
  /** Radians — SunCalc: from south, clockwise */
  azimuth: number
  /** Radians — elevation above horizon */
  altitude: number
  /** Degrees, 0–360 from north clockwise (compass) */
  azimuthDegNorth: number
  /** Degrees above horizon */
  altitudeDeg: number
  /** Unit direction in scene coords (+X east, +Y up, +Z south) */
  direction: [number, number, number]
  /** World position on sky sphere */
  position: [number, number, number]
  visible: boolean
}

export type DayTimes = {
  sunrise: Date | null
  sunset: Date | null
  solarNoon: Date | null
  sunriseHours: number
  sunsetHours: number
  solarNoonHours: number
}

export type SunPathSample = {
  hours: number
  position: [number, number, number]
  altitude: number
  azimuth: number
}

export type MoonPosition = {
  altitude: number
  azimuth: number
  altitudeDeg: number
  position: [number, number, number]
  visible: boolean
  illumination: number
}

export const SUN_PATH_RADIUS = 13
export const PLAYBACK_SPEEDS = [1, 2, 5, 10] as const
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number]
