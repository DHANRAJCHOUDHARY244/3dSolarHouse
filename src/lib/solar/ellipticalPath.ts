import * as THREE from 'three'
import { dateWithHours, SITE } from '../site'
import { calculateSolarPosition, getDayTimes } from './solarPosition'

/** Shared sun + moon ellipse — compact so the full arc fits in view */
export const PATH_RADIUS = 13

/**
 * One elliptical arc around the house for both sun and moon.
 * Midday / midnight peak sits south (+Z) so the default camera sees it.
 */
export function buildSharedEllipse(
  date: Date,
  lat = SITE.lat,
  lon = SITE.lon,
  steps = 80,
) {
  const day = getDayTimes(date, lat, lon)
  const noon = calculateSolarPosition(dateWithHours(date, day.solarNoonHours), lat, lon)
  // Slight yaw from real noon, but keep arc facing the camera
  const yaw = Math.atan2(noon.direction[0], Math.max(0.2, noon.direction[2])) * 0.3

  const rx = PATH_RADIUS
  const ry = PATH_RADIUS * 0.62
  const rz = PATH_RADIUS * 0.48

  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const points: THREE.Vector3[] = []

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI
    const lx = rx * Math.cos(t)
    const ly = 3.5 + ry * Math.sin(t)
    const lz = rz * Math.sin(t)
    points.push(new THREE.Vector3(lx * cosY - lz * sinY, ly, lx * sinY + lz * cosY))
  }

  return { points, rx, ry, rz, yaw, day }
}

/** frac 0 = east end (sunrise), 0.5 = peak, 1 = west end (sunset) */
export function pointOnSharedEllipse(
  frac: number,
  rx: number,
  ry: number,
  rz: number,
  yaw: number,
) {
  const t = Math.PI * Math.min(1, Math.max(0, frac))
  const lx = rx * Math.cos(t)
  const ly = 3.5 + ry * Math.sin(t)
  const lz = rz * Math.sin(t)
  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  return new THREE.Vector3(lx * cosY - lz * sinY, ly, lx * sinY + lz * cosY)
}

/** Daytime: map clock hours sunrise→sunset onto the shared ellipse */
export function sunOnSharedEllipse(hours: number, date: Date, lat = SITE.lat, lon = SITE.lon) {
  const { day, rx, ry, rz, yaw } = buildSharedEllipse(date, lat, lon)
  const span = Math.max(0.05, day.sunsetHours - day.sunriseHours)
  const frac = (hours - day.sunriseHours) / span
  return pointOnSharedEllipse(frac, rx, ry, rz, yaw)
}

/**
 * Nighttime: continue on the SAME ellipse from sunset → next sunrise
 * (west end → peak → east end), so moon follows the familiar arc.
 */
export function moonOnSharedEllipse(hours: number, date: Date, lat = SITE.lat, lon = SITE.lon) {
  const { day, rx, ry, rz, yaw } = buildSharedEllipse(date, lat, lon)
  const start = day.sunsetHours
  const end = day.sunriseHours + 24
  let h = hours < day.sunriseHours ? hours + 24 : hours
  if (h < start) h = start
  // Reverse direction at night so it travels west→east on the same ribbon
  const frac = 1 - (h - start) / Math.max(0.05, end - start)
  return pointOnSharedEllipse(frac, rx, ry, rz, yaw)
}

export function createGlowEllipseGeometry(points: THREE.Vector3[], radius: number) {
  if (points.length < 3) return null
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.6)
  return {
    glow: new THREE.TubeGeometry(curve, 96, radius * 1.5, 18, false),
    core: new THREE.TubeGeometry(curve, 96, radius * 0.48, 14, false),
  }
}

// Back-compat aliases used by older imports
export const getSunEllipseForDate = buildSharedEllipse
export const getMoonEllipseForDate = buildSharedEllipse
export const sunOnEllipse = sunOnSharedEllipse
export const moonOnEllipse = moonOnSharedEllipse
