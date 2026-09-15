import { useMemo, type CSSProperties } from 'react'
import { Html } from '@react-three/drei'
import { useSolar } from '../../state/SolarContext'
import { formatClock } from '../../lib/site'
import {
  buildSharedEllipse,
  createGlowEllipseGeometry,
  moonOnSharedEllipse,
  sunOnSharedEllipse,
} from '../../lib/solar/ellipticalPath'

function SharedEllipseRibbon({ isNight }: { isNight: boolean }) {
  const { selectedDate } = useSolar()
  const ellipse = useMemo(() => buildSharedEllipse(selectedDate), [selectedDate])
  const geos = useMemo(
    () => createGlowEllipseGeometry(ellipse.points, 0.34),
    [ellipse.points],
  )

  if (!geos) return null

  const core = isNight ? '#c8d8ff' : '#ffe566'
  const glow = isNight ? '#5a7fd4' : '#ffb040'

  return (
    <group>
      <mesh geometry={geos.glow}>
        <meshBasicMaterial color={glow} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh geometry={geos.core}>
        <meshBasicMaterial color={core} transparent opacity={0.95} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function SunPathVisual() {
  const { selectedDate, selectedHours, day, isNight } = useSolar()

  const sunPos = useMemo(
    () => sunOnSharedEllipse(selectedHours, selectedDate).toArray() as [number, number, number],
    [selectedHours, selectedDate],
  )

  const markers = useMemo(() => {
    const list: { hour: number; position: [number, number, number] }[] = []
    for (let h = Math.ceil(day.sunriseHours); h <= Math.floor(day.sunsetHours); h++) {
      list.push({
        hour: h,
        position: sunOnSharedEllipse(h, selectedDate).toArray() as [number, number, number],
      })
    }
    return list
  }, [selectedDate, day.sunriseHours, day.sunsetHours])

  return (
    <group name="sharedEllipse">
      {/* One ellipse for sun + moon */}
      <SharedEllipseRibbon isNight={isNight} />

      {!isNight &&
        markers.map((m) => (
          <group key={m.hour} position={m.position}>
            <mesh>
              <sphereGeometry args={[0.35, 14, 14]} />
              <meshBasicMaterial color="#ffe9a0" />
            </mesh>
            <Html center distanceFactor={55} style={{ pointerEvents: 'none' }}>
              <div style={hourStyle}>{m.hour}</div>
            </Html>
          </group>
        ))}

      {/* Day: sun on the shared path */}
      {!isNight && (
        <group position={sunPos}>
          <mesh>
            <sphereGeometry args={[1.05, 32, 32]} />
            <meshBasicMaterial color="#ff8c14" />
          </mesh>
          <mesh>
            <sphereGeometry args={[1.65, 24, 24]} />
            <meshBasicMaterial color="#ffd060" transparent opacity={0.4} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[2.4, 20, 20]} />
            <meshBasicMaterial color="#ffb030" transparent opacity={0.12} depthWrite={false} />
          </mesh>
          <Html center distanceFactor={50} style={{ pointerEvents: 'none' }}>
            <div style={chip}>☀ {formatClock(selectedHours)}</div>
          </Html>
        </group>
      )}
    </group>
  )
}

export function MoonPathVisual() {
  const { selectedDate, selectedHours, isNight } = useSolar()

  const moonPos = useMemo(
    () => moonOnSharedEllipse(selectedHours, selectedDate).toArray() as [number, number, number],
    [selectedHours, selectedDate],
  )

  if (!isNight) return null

  return (
    <group name="moonOnSharedPath">
      <group position={moonPos}>
        <mesh>
          <sphereGeometry args={[0.95, 28, 28]} />
          <meshBasicMaterial color="#eef3ff" />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.5, 20, 20]} />
          <meshBasicMaterial color="#a8c0ff" transparent opacity={0.32} depthWrite={false} />
        </mesh>
        <pointLight intensity={6} distance={30} decay={2} color="#b8c8e8" />
        <Html center distanceFactor={50} style={{ pointerEvents: 'none' }}>
          <div style={{ ...chip, background: 'rgba(25,40,70,0.7)' }}>☾ {formatClock(selectedHours)}</div>
        </Html>
      </group>
    </group>
  )
}

const hourStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  fontWeight: 600,
  color: '#fff4c8',
  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
  transform: 'translateY(-10px)',
}

const chip: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  fontWeight: 600,
  color: '#fff',
  background: 'rgba(0,0,0,0.4)',
  padding: '2px 5px',
  borderRadius: 4,
  transform: 'translateY(20px)',
  whiteSpace: 'nowrap',
}

export function SolarLighting() {
  const { isNight, selectedDate, selectedHours, solar } = useSolar()

  const lightPos = useMemo(() => {
    if (isNight) {
      return moonOnSharedEllipse(selectedHours, selectedDate).toArray() as [number, number, number]
    }
    return sunOnSharedEllipse(selectedHours, selectedDate).toArray() as [number, number, number]
  }, [isNight, selectedHours, selectedDate])

  const intensity = isNight ? 0.25 : Math.min(1.5, 0.7 + Math.max(0, solar.altitudeDeg) * 0.02)
  const color = isNight ? '#9aaccc' : '#fff2dc'

  return (
    <>
      <ambientLight intensity={isNight ? 0.32 : 0.52} color={isNight ? '#2a3548' : '#d8e0ea'} />
      <hemisphereLight
        args={isNight ? ['#3a4a62', '#1a2030', 0.4] : ['#e8eef4', '#6a7a58', 0.48]}
      />
      <directionalLight
        castShadow={!isNight}
        position={lightPos}
        intensity={intensity}
        color={color}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={2}
        shadow-camera-far={70}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-bias={-0.0003}
      />
    </>
  )
}
