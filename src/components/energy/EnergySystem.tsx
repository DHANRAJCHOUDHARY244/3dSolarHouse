import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useSolar } from '../../state/SolarContext'

function makeSagCurve(a: THREE.Vector3, b: THREE.Vector3, sag: number, lift = 0) {
  const p1 = a.clone().lerp(b, 0.28)
  p1.y -= sag * 0.55
  p1.y += lift
  const p2 = a.clone().lerp(b, 0.72)
  p2.y -= sag * 0.55
  p2.y += lift
  const mid = a.clone().lerp(b, 0.5)
  mid.y -= sag
  mid.y += lift
  return new THREE.CatmullRomCurve3([a.clone(), p1, mid, p2, b.clone()])
}

/** Realistic dual-layer power cable with flowing energy beads */
function PowerCable({
  a,
  b,
  color,
  active,
  sag = 1.0,
  thick = 0.1,
  phase = 0,
  speed = 1,
  beadCount = 10,
}: {
  a: THREE.Vector3
  b: THREE.Vector3
  color: string
  active: boolean
  sag?: number
  thick?: number
  phase?: number
  speed?: number
  beadCount?: number
}) {
  const sheathMat = useRef<THREE.MeshStandardMaterial>(null)
  const coreMat = useRef<THREE.MeshStandardMaterial>(null)
  const beads = useRef<THREE.Group>(null)
  const sparks = useRef<THREE.Group>(null)

  const curve = useMemo(() => makeSagCurve(a, b, sag), [a, b, sag])
  const sheathGeo = useMemo(() => new THREE.TubeGeometry(curve, 48, thick, 10, false), [curve, thick])
  const coreGeo = useMemo(
    () => new THREE.TubeGeometry(curve, 48, thick * 0.38, 8, false),
    [curve, thick],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (sheathMat.current) {
      sheathMat.current.emissiveIntensity = active ? 0.18 + Math.sin(t * 3 + phase) * 0.08 : 0.02
    }
    if (coreMat.current) {
      coreMat.current.emissiveIntensity = active ? 0.9 + Math.sin(t * 6 + phase) * 0.45 : 0.05
    }
    if (beads.current) {
      beads.current.visible = active
      if (active) {
        const children = beads.current.children
        for (let i = 0; i < children.length; i++) {
          const u = (t * 0.28 * speed + phase * 0.07 + i / children.length) % 1
          const p = curve.getPointAt(u)
          const tan = curve.getTangentAt(u)
          children[i].position.copy(p)
          children[i].lookAt(p.clone().add(tan))
          const pulse = 0.7 + Math.sin(t * 10 + i) * 0.3
          children[i].scale.setScalar(pulse)
        }
      }
    }
    if (sparks.current && active) {
      sparks.current.children.forEach((c, i) => {
        const u = Math.min(0.98, Math.max(0.02, (Math.sin(t * 2 + i + phase) + 1) * 0.5))
        c.position.copy(curve.getPointAt(u))
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial
        if (m) m.opacity = 0.25 + Math.abs(Math.sin(t * 8 + i)) * 0.6
      })
    }
  })

  return (
    <group>
      <mesh geometry={sheathGeo} castShadow>
        <meshStandardMaterial
          ref={sheathMat}
          color="#1a1f28"
          emissive={color}
          emissiveIntensity={0.1}
          metalness={0.25}
          roughness={0.55}
        />
      </mesh>
      <mesh geometry={coreGeo}>
        <meshStandardMaterial
          ref={coreMat}
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.1}
          roughness={0.3}
          transparent
          opacity={active ? 0.95 : 0.25}
        />
      </mesh>

      <group ref={beads}>
        {Array.from({ length: beadCount }).map((_, i) => (
          <group key={i}>
            <mesh>
              <sphereGeometry args={[thick * 1.6, 10, 10]} />
              <meshBasicMaterial color={color} />
            </mesh>
            <mesh>
              <sphereGeometry args={[thick * 2.8, 8, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </group>

      <group ref={sparks}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshBasicMaterial color="#fff7d6" transparent opacity={0.4} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Insulator({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.08, 0.1, 0.18, 10]} />
        <meshStandardMaterial color="#e8eef5" metalness={0.1} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.06, 10]} />
        <meshStandardMaterial color="#d0d8e0" roughness={0.4} />
      </mesh>
    </group>
  )
}

function LightPole({
  position,
  height = 5.8,
  lit,
  armDir = 1,
}: {
  position: [number, number, number]
  height?: number
  lit: boolean
  armDir?: number
}) {
  const lampMat = useRef<THREE.MeshStandardMaterial>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!lit) {
      if (lampMat.current) lampMat.current.emissiveIntensity = 0.04
      return
    }
    const flicker = 1.05 + Math.sin(clock.elapsedTime * 7.3) * 0.08 + Math.sin(clock.elapsedTime * 13) * 0.04
    if (lampMat.current) lampMat.current.emissiveIntensity = flicker
    if (glowRef.current) glowRef.current.scale.setScalar(0.95 + Math.sin(clock.elapsedTime * 5) * 0.08)
  })

  return (
    <group position={position}>
      {/* Base */}
      <mesh castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.28, 0.34, 0.3, 12]} />
        <meshStandardMaterial color="#2c323a" metalness={0.5} roughness={0.45} />
      </mesh>
      {/* Pole */}
      <mesh castShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.14, height, 12]} />
        <meshStandardMaterial color="#3d4550" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Cross arm */}
      <mesh castShadow position={[armDir * 0.35, height - 0.35, 0]} rotation={[0, 0, -armDir * 0.4]}>
        <boxGeometry args={[1.4, 0.08, 0.08]} />
        <meshStandardMaterial color="#3d4550" metalness={0.55} roughness={0.4} />
      </mesh>
      <Insulator position={[armDir * 0.15, height - 0.15, 0.12]} />
      <Insulator position={[armDir * 0.45, height - 0.28, 0.12]} />
      <Insulator position={[armDir * 0.75, height - 0.42, 0.12]} />

      {/* Lamp head */}
      <mesh castShadow position={[armDir * 1.05, height - 0.7, 0]}>
        <boxGeometry args={[0.55, 0.18, 0.35]} />
        <meshStandardMaterial color="#2a3038" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[armDir * 1.05, height - 0.82, 0]} ref={glowRef}>
        <sphereGeometry args={[0.16, 14, 14]} />
        <meshStandardMaterial
          ref={lampMat}
          color="#fff6e0"
          emissive="#ffc878"
          emissiveIntensity={lit ? 1.2 : 0.04}
        />
      </mesh>
      {lit && (
        <pointLight
          position={[armDir * 1.05, height - 0.9, 0]}
          intensity={16}
          distance={20}
          decay={2}
          color="#ffd9a0"
        />
      )}
    </group>
  )
}

function JunctionBox({
  position,
  active,
  color,
}: {
  position: [number, number, number]
  active: boolean
  color: string
}) {
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (mat.current) {
      mat.current.emissiveIntensity = active ? 0.7 + Math.sin(clock.elapsedTime * 5) * 0.4 : 0.08
    }
  })
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.45, 0.55, 0.28]} />
        <meshStandardMaterial color="#2a323c" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.05, 0.15]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial ref={mat} color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

function AnimatedBattery({
  position,
  soc,
  charging,
  discharging,
}: {
  position: [number, number, number]
  soc: number
  charging: boolean
  discharging: boolean
}) {
  const ring = useRef<THREE.Mesh>(null)
  const cells = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (ring.current) {
      ring.current.rotation.y = clock.elapsedTime * 0.8
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.03
      ring.current.scale.set(s, 1, s)
    }
    if (cells.current) {
      cells.current.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial
        if (!m?.emissive) return
        const base = soc > i / 3 ? 0.45 : 0.05
        m.emissiveIntensity = base + (charging || discharging ? Math.sin(clock.elapsedTime * 4 + i) * 0.2 : 0)
      })
    }
  })

  return (
    <group position={position}>
      {/* Powerwall-style cabinet */}
      <mesh castShadow>
        <boxGeometry args={[2.55, 1.55, 0.55]} />
        <meshStandardMaterial color="#111827" metalness={0.55} roughness={0.32} />
      </mesh>
      {/* Front face bevel */}
      <mesh position={[0, 0, 0.29]} castShadow>
        <boxGeometry args={[2.4, 1.4, 0.04]} />
        <meshStandardMaterial color="#0b1220" metalness={0.45} roughness={0.4} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <boxGeometry args={[2.65, 0.1, 0.6]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.28} />
      </mesh>
      {/* Side vents */}
      {[-1.3, 1.3].map((x) =>
        [-0.4, -0.15, 0.1, 0.35].map((y, i) => (
          <mesh key={`${x}-${i}`} position={[x, y, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.35]} />
            <meshStandardMaterial color="#374151" metalness={0.4} />
          </mesh>
        )),
      )}
      {/* Wall bracket feet */}
      {[-1.0, 1.0].map((x) => (
        <mesh key={x} position={[x, -0.85, -0.05]} castShadow>
          <boxGeometry args={[0.25, 0.12, 0.35]} />
          <meshStandardMaterial color="#334155" metalness={0.5} />
        </mesh>
      ))}

      <group ref={cells}>
        {[-0.7, 0, 0.7].map((x, i) => (
          <mesh key={x} position={[x, 0.05, 0.32]}>
            <boxGeometry args={[0.5, 0.85, 0.04]} />
            <meshStandardMaterial
              color="#0f172a"
              emissive={soc > (i + 0.2) / 3 ? '#22c55e' : '#1e293b'}
              emissiveIntensity={soc > (i + 0.2) / 3 ? 0.55 : 0.05}
            />
          </mesh>
        ))}
      </group>

      {/* SOC LED strip */}
      <mesh position={[-(1 - soc) * 1.0, 0.62, 0.33]}>
        <boxGeometry args={[Math.max(0.1, soc * 2.05), 0.07, 0.03]} />
        <meshBasicMaterial
          color={soc > 0.35 ? '#22c55e' : soc > 0.15 ? '#eab308' : '#ef4444'}
        />
      </mesh>
      {/* Brand plate */}
      <mesh position={[0, -0.5, 0.32]}>
        <planeGeometry args={[0.7, 0.14]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.35} />
      </mesh>

      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
        <torusGeometry args={[1.45, 0.028, 10, 48]} />
        <meshBasicMaterial
          color={discharging ? '#60a5fa' : charging ? '#4ade80' : '#64748b'}
          transparent
          opacity={charging || discharging ? 0.65 : 0.15}
        />
      </mesh>

      <pointLight
        position={[0, 1.1, 0.9]}
        intensity={discharging ? 7 : charging ? 5 : 1.2}
        distance={12}
        color={discharging ? '#60a5fa' : '#4ade80'}
      />
    </group>
  )
}

function AnimatedInverter({
  position,
  charging,
  discharging,
}: {
  position: [number, number, number]
  charging: boolean
  discharging: boolean
}) {
  const screen = useRef<THREE.MeshBasicMaterial>(null)
  const fans = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (screen.current) {
      screen.current.color.set(charging ? '#4ade80' : discharging ? '#60a5fa' : '#475569')
    }
    if (fans.current && (charging || discharging)) {
      fans.current.rotation.z = clock.elapsedTime * 8
    }
  })

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.35, 1.85, 0.55]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.28} />
      </mesh>
      {/* Bezel */}
      <mesh position={[0, 0.2, 0.29]} castShadow>
        <boxGeometry args={[1.15, 1.5, 0.04]} />
        <meshStandardMaterial color="#0f172a" metalness={0.45} roughness={0.4} />
      </mesh>
      {/* LCD status */}
      <mesh position={[0, 0.45, 0.32]}>
        <planeGeometry args={[0.75, 0.42]} />
        <meshBasicMaterial ref={screen} color="#4ade80" />
      </mesh>
      {/* Soft keys */}
      {[-0.28, 0, 0.28].map((x) => (
        <mesh key={x} position={[x, 0.08, 0.32]}>
          <boxGeometry args={[0.14, 0.08, 0.02]} />
          <meshStandardMaterial color="#334155" metalness={0.4} />
        </mesh>
      ))}
      {/* Cooling fan */}
      <group ref={fans} position={[0, -0.5, 0.32]}>
        <mesh>
          <circleGeometry args={[0.2, 18]} />
          <meshStandardMaterial color="#0b1220" />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <boxGeometry args={[0.32, 0.04, 0.015]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.65} />
          </mesh>
        ))}
      </group>
      {/* Cable glands */}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, -0.95, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.12, 10]} />
          <meshStandardMaterial color="#111827" metalness={0.5} />
        </mesh>
      ))}
      {(charging || discharging) && (
        <pointLight
          position={[0, 0.4, 0.6]}
          intensity={3}
          distance={5}
          color={charging ? '#4ade80' : '#60a5fa'}
        />
      )}
    </group>
  )
}

export function EnergySystem() {
  const { powerMode, batterySoc, isNight } = useSolar()
  const charging = powerMode === 'solar'
  const discharging = powerMode === 'battery'
  const polesOn = isNight

  const panel = useMemo(() => new THREE.Vector3(1.0, 5.45, -0.5), [])
  const jBox = useMemo(() => new THREE.Vector3(4.2, 4.6, 1.2), [])
  const poleATop = useMemo(() => new THREE.Vector3(7.2, 5.4, 3.5), [])
  const poleBTop = useMemo(() => new THREE.Vector3(6.5, 5.4, 7.0), [])
  const invTop = useMemo(() => new THREE.Vector3(2.4, 2.15, 10.0), [])
  const batTop = useMemo(() => new THREE.Vector3(4.5, 1.75, 10.5), [])
  const house = useMemo(() => new THREE.Vector3(1.8, 2.3, 4.15), [])
  const poleCTop = useMemo(() => new THREE.Vector3(-6.5, 4.8, 5.5), [])
  const evCharger = useMemo(() => new THREE.Vector3(10.3, 1.2, 9.2), [])

  return (
    <group name="energySystem">
      {/* Equipment pad — left of driveway so Tesla stays clear */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.5, 0.02, 10.2]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#5e594f" roughness={0.95} />
      </mesh>
      <mesh position={[3.5, 0.08, 10.2]} castShadow>
        <boxGeometry args={[5.5, 0.12, 3.5]} />
        <meshStandardMaterial color="#6d675c" roughness={0.9} />
      </mesh>

      {/* Poles */}
      <LightPole position={[7.2, 0, 3.5]} lit={polesOn} armDir={1} />
      <LightPole position={[6.5, 0, 7.0]} lit={polesOn} armDir={-1} height={5.6} />
      <LightPole position={[-6.5, 0, 5.5]} lit={polesOn} armDir={1} height={5.2} />
      <LightPole position={[10.8, 0, -1.2]} lit={polesOn} armDir={-1} height={5.4} />

      <JunctionBox position={[4.2, 4.35, 1.2]} active={charging} color="#fbbf24" />
      <JunctionBox position={[6.8, 2.4, 7.4]} active={charging || discharging} color="#34d399" />

      {/* Triple overhead utility lines */}
      <PowerCable a={poleATop} b={poleBTop} color="#94a3b8" active={charging || discharging} sag={0.55} thick={0.045} phase={0} beadCount={6} speed={0.7} />
      <PowerCable
        a={new THREE.Vector3(7.2, 5.15, 3.35)}
        b={new THREE.Vector3(6.5, 5.15, 6.85)}
        color="#64748b"
        active={charging || discharging}
        sag={0.5}
        thick={0.04}
        phase={0.4}
        beadCount={5}
        speed={0.65}
      />
      <PowerCable a={poleATop} b={poleCTop} color="#788396" active={polesOn} sag={1.4} thick={0.05} phase={1.2} beadCount={8} speed={0.5} />

      {/* Solar harvest path */}
      <PowerCable a={panel} b={jBox} color="#fbbf24" active={charging} sag={0.35} thick={0.1} phase={0.2} beadCount={12} speed={1.35} />
      <PowerCable a={jBox} b={poleATop} color="#fbbf24" active={charging} sag={0.7} thick={0.1} phase={0.6} beadCount={12} speed={1.25} />
      <PowerCable a={poleBTop} b={invTop} color="#f59e0b" active={charging} sag={0.45} thick={0.11} phase={1} beadCount={11} speed={1.2} />

      {/* Storage loop */}
      <PowerCable
        a={invTop}
        b={batTop}
        color="#34d399"
        active={charging || discharging}
        sag={0.2}
        thick={0.12}
        phase={1.4}
        beadCount={9}
        speed={1.1}
      />

      {/* Night home supply */}
      <PowerCable
        a={batTop}
        b={house}
        color="#60a5fa"
        active={discharging}
        sag={0.85}
        thick={0.12}
        phase={2}
        beadCount={14}
        speed={1.4}
      />

      <AnimatedInverter position={[2.4, 0.95, 10.0]} charging={charging} discharging={discharging} />
      <AnimatedBattery
        position={[4.5, 0.85, 10.5]}
        soc={batterySoc}
        charging={charging}
        discharging={discharging}
      />

      {/* Battery → Tesla charger */}
      <PowerCable
        a={batTop}
        b={evCharger}
        color="#60a5fa"
        active={isNight && discharging}
        sag={0.55}
        thick={0.1}
        phase={2.5}
        beadCount={10}
        speed={1.35}
      />

      <group position={[5.8, 0.75, 9.2]}>
        {/* Pad-mount transformer */}
        <mesh castShadow>
          <boxGeometry args={[0.95, 1.15, 0.75]} />
          <meshStandardMaterial color="#5b4a2e" metalness={0.4} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow>
          <boxGeometry args={[1.0, 0.1, 0.8]} />
          <meshStandardMaterial color="#3f3424" metalness={0.35} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.15, 0.39]}>
          <boxGeometry args={[0.35, 0.45, 0.04]} />
          <meshStandardMaterial color="#1f2937" metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.18, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.65} />
        </mesh>
        {[-0.28, 0.28].map((x) => (
          <mesh key={x} position={[x, -0.65, 0]} castShadow>
            <boxGeometry args={[0.18, 0.12, 0.55]} />
            <meshStandardMaterial color="#374151" metalness={0.45} />
          </mesh>
        ))}
      </group>

      {isNight && discharging && (
        <>
          <pointLight position={[0, 2.5, 3.4]} intensity={14 + batterySoc * 12} distance={22} color="#ffd8a0" />
          <mesh position={[0.2, 1.55, 4.18]}>
            <boxGeometry args={[1.15, 2.0, 0.08]} />
            <meshStandardMaterial
              color="#1a1520"
              emissive="#ffb86a"
              emissiveIntensity={0.7 + batterySoc * 0.45}
            />
          </mesh>
          <mesh position={[-2.2, 1.55, 4.18]}>
            <boxGeometry args={[2.6, 1.9, 0.06]} />
            <meshStandardMaterial
              color="#101820"
              emissive="#7dd3fc"
              emissiveIntensity={0.3 + batterySoc * 0.35}
            />
          </mesh>
        </>
      )}
    </group>
  )
}
