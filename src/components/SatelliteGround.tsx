import { useMemo } from 'react'
import * as THREE from 'three'
import { createSatelliteTexture } from '../lib/satelliteTexture'

const GROUND_SIZE = 112

export function SatelliteGround() {
  const texture = useMemo(() => {
    const canvas = createSatelliteTexture(2048)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    tex.needsUpdate = true
    return tex
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial map={texture} roughness={0.95} metalness={0} />
    </mesh>
  )
}
