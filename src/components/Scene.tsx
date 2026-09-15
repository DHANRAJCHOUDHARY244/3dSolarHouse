import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { SatelliteGround } from './SatelliteGround'
import { House } from './House'
import { MoonPathVisual, SolarLighting, SunPathVisual } from './solar/SunPathVisual'
import { EnergySystem } from './energy/EnergySystem'
import { useSolar } from '../state/SolarContext'

export function Scene() {
  const { isNight } = useSolar()

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [22, 14, 20], fov: 42, near: 0.1, far: 220 }}
      gl={{ antialias: true, toneMappingExposure: isNight ? 1.0 : 1.05 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={[isNight ? '#1a2436' : '#a8b8c6']} />
      <fog attach="fog" args={[isNight ? '#1a2436' : '#a8b8c6', 50, 100]} />

      <Suspense fallback={null}>
        <SolarLighting />
        <SatelliteGround />
        <House />
        <SunPathVisual />
        <MoonPathVisual />
        <EnergySystem />
      </Suspense>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.07}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={12}
        maxDistance={55}
        target={[8.5, 1.2, 9]}
      />
    </Canvas>
  )
}
