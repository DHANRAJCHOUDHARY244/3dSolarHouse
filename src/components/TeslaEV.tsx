import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/** More realistic Tesla-style EV for the driveway */
export function TeslaEV({
  position,
  charging,
  nightCharge,
}: {
  position: [number, number, number]
  charging: boolean
  nightCharge: boolean
}) {
  const portMat = useRef<THREE.MeshStandardMaterial>(null)
  const paint = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f1f3f5',
        metalness: 0.92,
        roughness: 0.18,
      }),
    [],
  )
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#0a1018',
        metalness: 0.12,
        roughness: 0.03,
        transmission: 0.45,
        transparent: true,
        opacity: 0.78,
        reflectivity: 0.9,
      }),
    [],
  )
  const trim = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#111827', metalness: 0.7, roughness: 0.28 }),
    [],
  )
  const black = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.55, metalness: 0.2 }),
    [],
  )

  useFrame(({ clock }) => {
    if (portMat.current) {
      portMat.current.emissiveIntensity = charging
        ? 0.8 + Math.sin(clock.elapsedTime * 5) * 0.35
        : 0.04
    }
  })

  return (
    <group position={position} rotation={[0, -0.28, 0]} scale={1.22}>
      {/* Lower body / rocker */}
      <mesh castShadow receiveShadow position={[0, 0.28, 0]} material={black}>
        <boxGeometry args={[2.0, 0.22, 4.55]} />
      </mesh>
      {/* Main body */}
      <mesh castShadow receiveShadow position={[0, 0.52, 0]} material={paint}>
        <boxGeometry args={[2.02, 0.42, 4.55]} />
      </mesh>
      {/* Belt line carve */}
      <mesh castShadow position={[0, 0.78, -0.05]} material={paint}>
        <boxGeometry args={[1.98, 0.22, 4.05]} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow position={[0, 1.08, -0.15]} material={paint}>
        <boxGeometry args={[1.88, 0.48, 2.45]} />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[0, 1.38, -0.2]} material={paint}>
        <boxGeometry args={[1.68, 0.08, 2.0]} />
      </mesh>
      {/* Hood */}
      <mesh castShadow position={[0, 0.78, 1.55]} material={paint}>
        <boxGeometry args={[1.92, 0.14, 1.2]} />
      </mesh>
      {/* Trunk */}
      <mesh castShadow position={[0, 0.92, -1.78]} material={paint}>
        <boxGeometry args={[1.9, 0.42, 0.8]} />
      </mesh>
      {/* Front bumper */}
      <mesh castShadow position={[0, 0.32, 2.22]} material={paint}>
        <boxGeometry args={[1.95, 0.28, 0.28]} />
      </mesh>
      <mesh position={[0, 0.22, 2.28]} material={black}>
        <boxGeometry args={[1.7, 0.1, 0.12]} />
      </mesh>

      {/* Glass greenhouse */}
      <mesh position={[0, 1.15, 0.88]} material={glass}>
        <boxGeometry args={[1.78, 0.38, 0.05]} />
      </mesh>
      <mesh position={[0, 1.15, -1.25]} material={glass}>
        <boxGeometry args={[1.78, 0.38, 0.05]} />
      </mesh>
      <mesh position={[-0.96, 1.15, -0.15]} material={glass}>
        <boxGeometry args={[0.04, 0.38, 1.9]} />
      </mesh>
      <mesh position={[0.96, 1.15, -0.15]} material={glass}>
        <boxGeometry args={[0.04, 0.38, 1.9]} />
      </mesh>
      <mesh position={[0, 1.44, -0.18]} rotation={[-Math.PI / 2, 0, 0]} material={glass}>
        <planeGeometry args={[1.45, 1.7]} />
      </mesh>
      {/* A-pillar chrome strip */}
      <mesh position={[-0.9, 1.2, 0.55]} material={trim}>
        <boxGeometry args={[0.04, 0.42, 0.08]} />
      </mesh>
      <mesh position={[0.9, 1.2, 0.55]} material={trim}>
        <boxGeometry args={[0.04, 0.42, 0.08]} />
      </mesh>

      {/* Lights */}
      <mesh position={[0, 0.58, 2.32]}>
        <boxGeometry args={[1.65, 0.04, 0.03]} />
        <meshStandardMaterial color="#f8fafc" emissive="#e2e8f0" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.78, 0.58, 2.3]}>
        <boxGeometry args={[0.32, 0.12, 0.04]} />
        <meshStandardMaterial color="#fff" emissive="#fff8ef" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0.78, 0.58, 2.3]}>
        <boxGeometry args={[0.32, 0.12, 0.04]} />
        <meshStandardMaterial color="#fff" emissive="#fff8ef" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0, 0.76, -2.28]}>
        <boxGeometry args={[1.65, 0.05, 0.03]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.1} />
      </mesh>

      {/* Door handles */}
      {([-0.98, 0.98] as const).map((x) =>
        ([0.35, -0.55] as const).map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.72, z]} material={trim}>
            <boxGeometry args={[0.03, 0.04, 0.16]} />
          </mesh>
        )),
      )}

      {/* Mirrors */}
      <mesh castShadow position={[-1.12, 1.02, 0.55]} material={trim}>
        <boxGeometry args={[0.22, 0.1, 0.26]} />
      </mesh>
      <mesh castShadow position={[1.12, 1.02, 0.55]} material={trim}>
        <boxGeometry args={[0.22, 0.1, 0.26]} />
      </mesh>

      {/* Wheels with multi-spoke look */}
      {(
        [
          [-0.92, 0.34, 1.5],
          [0.92, 0.34, 1.5],
          [-0.92, 0.34, -1.4],
          [0.92, 0.34, -1.4],
        ] as [number, number, number][]
      ).map((p, i) => (
        <group key={i} position={p}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.28, 24]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.7} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.3, 20]} />
            <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.22} />
          </mesh>
          {[0, 1, 2, 3, 4].map((s) => (
            <mesh key={s} rotation={[0, (s * Math.PI * 2) / 5, Math.PI / 2]} position={[0, 0, 0]}>
              <boxGeometry args={[0.08, 0.04, 0.2]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.25} />
            </mesh>
          ))}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.32, 12]} />
            <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      ))}

      {/* Charge port */}
      <mesh position={[1.04, 0.74, -1.28]}>
        <boxGeometry args={[0.06, 0.22, 0.28]} />
        <meshStandardMaterial
          ref={portMat}
          color={charging ? '#22c55e' : '#1f2937'}
          emissive={charging ? (nightCharge ? '#60a5fa' : '#22c55e') : '#000'}
          emissiveIntensity={0.5}
        />
      </mesh>
      {charging && (
        <pointLight
          position={[1.2, 0.74, -1.28]}
          intensity={nightCharge ? 5.5 : 3.2}
          distance={4}
          color={nightCharge ? '#60a5fa' : '#4ade80'}
        />
      )}
    </group>
  )
}

export function WallCharger({
  position,
  active,
  nightCharge,
}: {
  position: [number, number, number]
  active: boolean
  nightCharge: boolean
}) {
  const led = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    if (led.current && active) {
      led.current.opacity = 0.7 + Math.sin(clock.elapsedTime * 4) * 0.3
    }
  })
  return (
    <group position={position}>
      <mesh castShadow position={[0, -0.45, 0]}>
        <boxGeometry args={[0.26, 1.0, 0.2]} />
        <meshStandardMaterial color="#111827" metalness={0.55} roughness={0.32} />
      </mesh>
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[0.4, 0.58, 0.2]} />
        <meshStandardMaterial color="#0b1220" metalness={0.6} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.22, 0.11]}>
        <circleGeometry args={[0.09, 16]} />
        <meshBasicMaterial
          ref={led}
          color={nightCharge ? '#60a5fa' : active ? '#22c55e' : '#64748b'}
          transparent
          opacity={1}
        />
      </mesh>
      <mesh position={[0.16, -0.1, 0.05]}>
        <torusGeometry args={[0.1, 0.025, 8, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.5} />
      </mesh>
      {active && (
        <pointLight
          position={[0.25, 0.2, 0.25]}
          intensity={nightCharge ? 4 : 2.5}
          distance={3.5}
          color={nightCharge ? '#60a5fa' : '#4ade80'}
        />
      )}
    </group>
  )
}
