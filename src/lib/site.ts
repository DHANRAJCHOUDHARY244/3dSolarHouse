/** Shared site / project location — single source of truth. */
export const SITE = {
  lat: 17.4485,
  lon: 78.3908,
  elevationM: 505,
  /** Asia/Kolkata — used for display; Date objects use local browser TZ for demo */
  timezone: 'Asia/Kolkata',
  label: 'Residential plot · Hyderabad',
} as const

/**
 * Scene coordinate convention (documented for solar conversion):
 *   +X = East
 *   +Y = Up
 *   +Z = South
 *   −Z = North
 * Site / building origin is at world (0, 0, 0).
 */
export const WORLD_AXES = {
  east: '+X',
  up: '+Y',
  south: '+Z',
  north: '−Z',
} as const

export function formatClock(hours: number) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60) % 60
  const hh = ((h % 24) + 24) % 24
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function dateWithHours(base: Date, hours: number) {
  const d = new Date(base)
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  d.setHours(h, m, 0, 0)
  return d
}

export function hoursFromDate(d: Date) {
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600
}

export function toDateInputValue(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDateInput(value: string, keepTimeHours: number) {
  const [y, m, day] = value.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  return dateWithHours(d, keepTimeHours)
}
