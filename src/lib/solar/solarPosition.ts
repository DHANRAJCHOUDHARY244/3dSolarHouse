import * as SunCalc from 'suncalc'
import { SITE, dateWithHours, hoursFromDate } from '../site'
import {
  SUN_PATH_RADIUS,
  type DayTimes,
  type MoonPosition,
  type SolarPosition,
  type SunPathSample,
} from './types'
import { azimuthToCompassDeg, radToDeg, solarToDirection, solarToWorldPosition } from './worldCoords'

export function calculateSolarPosition(
  date: Date,
  lat = SITE.lat,
  lon = SITE.lon,
  radius = SUN_PATH_RADIUS,
  origin: [number, number, number] = [0, 0, 0],
): SolarPosition {
  const pos = SunCalc.getPosition(date, lat, lon)
  const direction = solarToDirection(pos.azimuth, pos.altitude)
  const position = solarToWorldPosition(pos.azimuth, pos.altitude, radius, origin)
  return {
    azimuth: pos.azimuth,
    altitude: pos.altitude,
    azimuthDegNorth: azimuthToCompassDeg(pos.azimuth),
    altitudeDeg: radToDeg(pos.altitude),
    direction,
    position,
    visible: pos.altitude > -0.015,
  }
}

export function calculateSunAzimuth(date: Date, lat = SITE.lat, lon = SITE.lon) {
  return calculateSolarPosition(date, lat, lon).azimuthDegNorth
}

export function calculateSolarAltitude(date: Date, lat = SITE.lat, lon = SITE.lon) {
  return calculateSolarPosition(date, lat, lon).altitudeDeg
}

export function calculateSunVector(date: Date, lat = SITE.lat, lon = SITE.lon) {
  return calculateSolarPosition(date, lat, lon).direction
}

export function getDayTimes(date: Date, lat = SITE.lat, lon = SITE.lon): DayTimes {
  const times = SunCalc.getTimes(date, lat, lon)
  const sunrise = times.sunrise
  const sunset = times.sunset
  const solarNoon = times.solarNoon
  return {
    sunrise,
    sunset,
    solarNoon,
    sunriseHours: sunrise ? hoursFromDate(sunrise) : 6,
    sunsetHours: sunset ? hoursFromDate(sunset) : 18,
    solarNoonHours: solarNoon ? hoursFromDate(solarNoon) : 12,
  }
}

export function calculateSunrise(date: Date, lat = SITE.lat, lon = SITE.lon) {
  return getDayTimes(date, lat, lon).sunrise
}

export function calculateSunset(date: Date, lat = SITE.lat, lon = SITE.lon) {
  return getDayTimes(date, lat, lon).sunset
}

/** Sample sun positions from sunrise→sunset for the selected date (real astronomy). */
export function generateSunPath(
  date: Date,
  lat = SITE.lat,
  lon = SITE.lon,
  radius = SUN_PATH_RADIUS,
  steps = 72,
  origin: [number, number, number] = [0, 0, 0],
): SunPathSample[] {
  const { sunriseHours, sunsetHours } = getDayTimes(date, lat, lon)
  const samples: SunPathSample[] = []
  const span = Math.max(0.05, sunsetHours - sunriseHours)
  for (let i = 0; i <= steps; i++) {
    const hours = sunriseHours + (span * i) / steps
    const d = dateWithHours(date, hours)
    const solar = calculateSolarPosition(d, lat, lon, radius, origin)
    if (solar.altitude > -0.05) {
      samples.push({
        hours,
        position: solar.position,
        altitude: solar.altitude,
        azimuth: solar.azimuth,
      })
    }
  }
  return samples
}

/** Whole-hour markers that fall between sunrise and sunset. */
export function generateHourMarkers(
  date: Date,
  lat = SITE.lat,
  lon = SITE.lon,
  radius = SUN_PATH_RADIUS,
  origin: [number, number, number] = [0, 0, 0],
) {
  const { sunriseHours, sunsetHours } = getDayTimes(date, lat, lon)
  const markers: { hour: number; position: [number, number, number]; hours: number }[] = []
  for (let h = Math.ceil(sunriseHours); h <= Math.floor(sunsetHours); h++) {
    const solar = calculateSolarPosition(dateWithHours(date, h), lat, lon, radius, origin)
    if (solar.altitude > 0.02) {
      markers.push({ hour: h, position: solar.position, hours: h })
    }
  }
  return markers
}

export function calculateMoonPosition(
  date: Date,
  lat = SITE.lat,
  lon = SITE.lon,
  radius = SUN_PATH_RADIUS * 0.92,
  origin: [number, number, number] = [0, 0, 0],
): MoonPosition {
  const pos = SunCalc.getMoonPosition(date, lat, lon)
  const illum = SunCalc.getMoonIllumination(date)
  const position = solarToWorldPosition(pos.azimuth, pos.altitude, radius, origin)
  return {
    altitude: pos.altitude,
    azimuth: pos.azimuth,
    altitudeDeg: radToDeg(pos.altitude),
    position,
    visible: pos.altitude > 0.02,
    illumination: illum.fraction,
  }
}

/** Real moon trajectory samples across 24h (above-horizon points). */
export function generateMoonPath(
  date: Date,
  lat = SITE.lat,
  lon = SITE.lon,
  radius = SUN_PATH_RADIUS * 0.92,
  steps = 96,
  origin: [number, number, number] = [0, 0, 0],
) {
  const samples: { hours: number; position: [number, number, number]; altitude: number }[] = []
  for (let i = 0; i <= steps; i++) {
    const hours = (24 * i) / steps
    const moon = calculateMoonPosition(dateWithHours(date, hours), lat, lon, radius, origin)
    if (moon.altitude > -0.02) {
      samples.push({ hours, position: moon.position, altitude: moon.altitude })
    }
  }
  return samples
}

export {
  calculateSolarPosition as getSolarPosition,
  generateSunPath as getSunPath,
}
