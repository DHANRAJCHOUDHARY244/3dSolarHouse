/**
 * Convert SunCalc azimuth/altitude → Three.js world vectors.
 *
 * SunCalc convention:
 *   azimuth = 0 south, +π/2 west, ±π north, −π/2 east (radians, from south clockwise)
 *   altitude = elevation above horizon (radians)
 *
 * Scene convention (see site.ts WORLD_AXES):
 *   +X = East, +Y = Up, +Z = South
 */
export function solarToDirection(azimuth: number, altitude: number): [number, number, number] {
  const cosAlt = Math.cos(altitude)
  const x = -Math.sin(azimuth) * cosAlt // East
  const y = Math.sin(altitude) // Up
  const z = Math.cos(azimuth) * cosAlt // South
  return [x, y, z]
}

export function solarToWorldPosition(
  azimuth: number,
  altitude: number,
  radius: number,
  origin: [number, number, number] = [0, 0, 0],
): [number, number, number] {
  const [dx, dy, dz] = solarToDirection(azimuth, altitude)
  return [origin[0] + dx * radius, origin[1] + dy * radius, origin[2] + dz * radius]
}

/** Convert SunCalc azimuth (from south) → compass degrees from north, clockwise 0–360 */
export function azimuthToCompassDeg(azimuthFromSouth: number): number {
  let deg = ((azimuthFromSouth * 180) / Math.PI + 180) % 360
  if (deg < 0) deg += 360
  return deg
}

export function radToDeg(rad: number) {
  return (rad * 180) / Math.PI
}
