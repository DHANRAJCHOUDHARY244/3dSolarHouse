import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSolar } from '../state/SolarContext'
import { TeslaEV, WallCharger } from './TeslaEV'

function Glass({
  args,
  position,
  rotation = [0, 0, 0],
  nightGlow = false,
}: {
  args: [number, number, number]
  position: [number, number, number]
  rotation?: [number, number, number]
  nightGlow?: boolean
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <boxGeometry args={args} />
      <meshPhysicalMaterial
        color={nightGlow ? '#ffe8c4' : '#8ec6dc'}
        metalness={0.1}
        roughness={nightGlow ? 0.22 : 0.06}
        transmission={nightGlow ? 0.12 : 0.62}
        thickness={0.4}
        transparent
        opacity={nightGlow ? 0.94 : 0.78}
        emissive={nightGlow ? '#ffc078' : '#000000'}
        emissiveIntensity={nightGlow ? 0.6 : 0}
      />
    </mesh>
  )
}

/** Single ~residential PV module with cells, frame, glass, junction box */
function SolarModule({
  position,
  rotation = [0, 0, 0] as [number, number, number],
  width = 1.65,
  height = 1.0,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  width?: number
  height?: number
}) {
  const cols = 6
  const rows = 10
  const inset = 0.06
  const cellW = (width - inset * 2) / cols
  const cellH = (height - inset * 2) / rows
  const gap = 0.012

  return (
    <group position={position} rotation={rotation}>
      {/* Aluminum frame */}
      <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
        <boxGeometry args={[width, 0.04, height]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.85} roughness={0.28} />
      </mesh>
      {/* Backsheet */}
      <mesh position={[0, 0.035, 0]}>
        <boxGeometry args={[width - 0.04, 0.012, height - 0.04]} />
        <meshStandardMaterial color="#0a1018" roughness={0.7} />
      </mesh>
      {/* Blue cells grid */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const x = -width / 2 + inset + cellW * (c + 0.5)
          const z = -height / 2 + inset + cellH * (r + 0.5)
          return (
            <mesh
              key={`${r}-${c}`}
              position={[x, 0.048, z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[cellW - gap, cellH - gap]} />
              <meshStandardMaterial
                color="#1a4a8a"
                metalness={0.75}
                roughness={0.18}
                emissive="#0a2040"
                emissiveIntensity={0.2}
              />
            </mesh>
          )
        }),
      )}
      {/* Horizontal busbars */}
      {[0.22, 0, -0.22].map((z, i) => (
        <mesh key={i} position={[0, 0.052, z * height]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width - inset * 2.2, 0.008]} />
          <meshStandardMaterial color="#c0c8d0" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {/* Tempered glass cover */}
      <mesh position={[0, 0.058, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width - 0.05, height - 0.05]} />
        <meshPhysicalMaterial
          color="#a8c4e0"
          metalness={0.1}
          roughness={0.05}
          transmission={0.55}
          thickness={0.05}
          transparent
          opacity={0.35}
          reflectivity={0.8}
        />
      </mesh>
      {/* Junction box underside edge */}
      <mesh position={[0, -0.01, height * 0.35]} castShadow>
        <boxGeometry args={[0.22, 0.06, 0.16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
    </group>
  )
}

/** Roof array: mounting rails + grid of realistic modules */
function SolarPanel({
  position,
  size,
  rot = [-0.12, 0, 0] as [number, number, number],
}: {
  position: [number, number, number]
  size: [number, number]
  rot?: [number, number, number]
}) {
  const modW = 1.65
  const modH = 1.0
  const gapX = 0.06
  const gapZ = 0.06
  const cols = Math.max(1, Math.floor((size[0] + gapX) / (modW + gapX)))
  const rows = Math.max(1, Math.floor((size[1] + gapZ) / (modH + gapZ)))
  const totalW = cols * modW + (cols - 1) * gapX
  const totalH = rows * modH + (rows - 1) * gapZ

  const modules: { x: number; z: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      modules.push({
        x: -totalW / 2 + modW / 2 + c * (modW + gapX),
        z: -totalH / 2 + modH / 2 + r * (modH + gapZ),
      })
    }
  }

  return (
    <group position={position} rotation={rot}>
      {/* Anodized mounting rails */}
      {[-totalH * 0.28, totalH * 0.28].map((z, i) => (
        <mesh key={`rail-${i}`} castShadow position={[0, -0.04, z]}>
          <boxGeometry args={[totalW + 0.15, 0.05, 0.08]} />
          <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Mid supports */}
      {modules
        .filter((_, i) => i % cols === 0)
        .map((m, i) => (
          <mesh key={`leg-${i}`} castShadow position={[0, -0.08, m.z]}>
            <boxGeometry args={[totalW * 0.9, 0.04, 0.05]} />
            <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
      {modules.map((m, i) => (
        <SolarModule key={i} position={[m.x, 0, m.z]} width={modW} height={modH} />
      ))}
      {/* DC string cable along rail */}
      <mesh position={[totalW * 0.42, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, totalH * 0.85, 6]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[totalW * 0.42, -0.02, totalH * 0.4]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.4} />
      </mesh>
    </group>
  )
}

function AirCon({
  position,
  rotation = [0, 0, 0] as [number, number, number],
  running = false,
  scale = 1.35,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  running?: boolean
  scale?: number
}) {
  const fan = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (fan.current && running) fan.current.rotation.z += dt * 9
  })

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Cabinet shell */}
      <mesh castShadow>
        <boxGeometry args={[1.4, 1.1, 0.58]} />
        <meshStandardMaterial color="#dfe6ee" metalness={0.55} roughness={0.28} />
      </mesh>
      {/* Top grille lip */}
      <mesh position={[0, 0.56, 0]} castShadow>
        <boxGeometry args={[1.42, 0.06, 0.6]} />
        <meshStandardMaterial color="#c5ced8" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Side louvers */}
      {[-0.72, 0.72].map((x) =>
        [-0.28, -0.08, 0.12, 0.32].map((y, i) => (
          <mesh key={`${x}-${i}`} position={[x, y, 0]}>
            <boxGeometry args={[0.04, 0.04, 0.48]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.45} roughness={0.4} />
          </mesh>
        )),
      )}
      {/* Front intake panel */}
      <mesh position={[0, 0, 0.3]}>
        <boxGeometry args={[1.18, 0.88, 0.04]} />
        <meshStandardMaterial color="#0b1220" metalness={0.4} roughness={0.45} />
      </mesh>
      {/* Horizontal intake fins */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[0, -0.32 + i * 0.08, 0.325]}>
          <boxGeometry args={[1.05, 0.012, 0.02]} />
          <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.35} />
        </mesh>
      ))}
      {/* Fan assembly */}
      <group position={[0, 0.02, 0.34]} ref={fan}>
        <mesh>
          <torusGeometry args={[0.3, 0.035, 10, 28]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]} position={[0.14, 0, 0]}>
            <boxGeometry args={[0.22, 0.06, 0.015]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.55} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* Brand badge */}
      <mesh position={[0, 0.42, 0.305]}>
        <planeGeometry args={[0.5, 0.1]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Feet */}
      {[-0.48, 0.48].map((x) => (
        <mesh key={x} position={[x, -0.64, 0]} castShadow>
          <boxGeometry args={[0.12, 0.2, 0.42]} />
          <meshStandardMaterial color="#475569" metalness={0.55} />
        </mesh>
      ))}
      {/* Insulated refrigerant lines */}
      <mesh position={[0.72, -0.12, -0.05]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.055, 0.055, 0.75, 10]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
      </mesh>
      <mesh position={[0.78, -0.3, 0.02]} rotation={[0, 0, 0.55]}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 10]} />
        <meshStandardMaterial color="#334155" roughness={0.65} />
      </mesh>
      {running && (
        <pointLight position={[0, 0.1, 0.55]} intensity={1.6} distance={3.5} color="#93c5fd" />
      )}
    </group>
  )
}

function Conduit({ points, radius = 0.05 }: { points: THREE.Vector3[]; radius?: number }) {
  const geo = useMemo(() => {
    if (points.length < 2) return null
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, radius, 6, false)
  }, [points, radius])
  if (!geo) return null
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.35} />
    </mesh>
  )
}

/** Australian native–feeling canopy tree */
function GumTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.12, 0.22, 2.3, 10]} />
        <meshStandardMaterial color="#8a7a62" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.1, 2.35, 0.05]} rotation={[0.2, 0.4, 0.15]}>
        <cylinderGeometry args={[0.05, 0.09, 1.1, 8]} />
        <meshStandardMaterial color="#7a6a54" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[-0.25, 2.5, -0.1]} rotation={[-0.25, -0.3, -0.2]}>
        <cylinderGeometry args={[0.04, 0.08, 0.95, 8]} />
        <meshStandardMaterial color="#7a6a54" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.2, 2.85, 0.05]}>
        <sphereGeometry args={[1.05, 14, 14]} />
        <meshStandardMaterial color="#4a6b38" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.55, 3.05, 0.35]}>
        <sphereGeometry args={[0.72, 12, 12]} />
        <meshStandardMaterial color="#5a7a42" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.6, 3.2, -0.35]}>
        <sphereGeometry args={[0.62, 12, 12]} />
        <meshStandardMaterial color="#3f6230" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.1, 3.45, -0.4]}>
        <sphereGeometry args={[0.5, 10, 10]} />
        <meshStandardMaterial color="#55753c" roughness={0.9} />
      </mesh>
    </group>
  )
}

function NeighborHouse({
  position,
  rotationY = 0,
  wall = '#f2ebe1',
  timber = '#7a5a3a',
  scale = 0.8,
}: {
  position: [number, number, number]
  rotationY?: number
  wall?: string
  timber?: string
  scale?: number
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 1.25, 0]}>
        <boxGeometry args={[8, 2.5, 6]} />
        <meshStandardMaterial color={wall} roughness={0.78} />
      </mesh>
      <mesh castShadow position={[0, 2.7, 0]}>
        <boxGeometry args={[8.6, 0.18, 6.5]} />
        <meshStandardMaterial color="#ebe4da" roughness={0.7} />
      </mesh>
      {/* Skillion eave */}
      <mesh castShadow position={[0, 2.95, 1.2]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[8.8, 0.1, 3.2]} />
        <meshStandardMaterial color="#3a4048" metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh castShadow position={[-3.2, 1.2, 0.8]}>
        <boxGeometry args={[1.4, 2.3, 4]} />
        <meshStandardMaterial color={timber} roughness={0.7} />
      </mesh>
      <mesh position={[0.5, 1.35, 3.05]}>
        <boxGeometry args={[3.2, 1.8, 0.08]} />
        <meshStandardMaterial color="#1a2838" metalness={0.25} roughness={0.2} />
      </mesh>
      <AirCon position={[4.2, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} />
      <SolarPanel position={[-1.5, 2.88, -0.8]} size={[2.8, 2]} />
      <SolarPanel position={[1.6, 2.88, -0.8]} size={[2.8, 2]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1]} receiveShadow>
        <planeGeometry args={[11, 9]} />
        <meshStandardMaterial color="#c2b396" roughness={1} />
      </mesh>
    </group>
  )
}

/** Animated charge cable wall → Tesla port */
function ChargeCable({
  from,
  to,
  active,
  nightCharge,
}: {
  from: [number, number, number]
  to: [number, number, number]
  active: boolean
  nightCharge: boolean
}) {
  const beads = useRef<THREE.Group>(null)
  const a = useMemo(() => new THREE.Vector3(...from), [from])
  const b = useMemo(() => new THREE.Vector3(...to), [to])
  const curve = useMemo(() => {
    const mid = a.clone().lerp(b, 0.5)
    mid.y -= 0.45
    return new THREE.CatmullRomCurve3([a, mid, b])
  }, [a, b])
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 32, 0.045, 8, false), [curve])
  const color = nightCharge ? '#60a5fa' : '#22c55e'

  useFrame(({ clock }) => {
    if (!beads.current || !active) return
    const t = clock.elapsedTime
    beads.current.children.forEach((c, i) => {
      const u = (t * 0.4 + i / beads.current!.children.length) % 1
      c.position.copy(curve.getPointAt(u))
    })
  })

  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial
          color="#111827"
          emissive={color}
          emissiveIntensity={active ? 0.55 : 0.05}
          metalness={0.3}
          roughness={0.45}
        />
      </mesh>
      <group ref={beads} visible={active}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function House() {
  const { isNight, powerMode } = useSolar()
  const night = isNight && powerMode === 'battery'
  const acOn = !isNight || powerMode === 'battery'
  const evCharging = powerMode === 'solar' || powerMode === 'battery'
  const nightCharge = isNight && powerMode === 'battery'

  // Australian coastal–luxury palette
  const render = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f7f3ec', roughness: 0.78, metalness: 0.02 }),
    [],
  )
  const limestone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#d9d0c2', roughness: 0.92, metalness: 0.02 }),
    [],
  )
  const blackbutt = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8b6a45', roughness: 0.65, metalness: 0.04 }),
    [],
  )
  const colorbond = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3a4048', roughness: 0.4, metalness: 0.45 }),
    [],
  )
  const charcoal = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2c323a', roughness: 0.4, metalness: 0.3 }),
    [],
  )
  const poolWater = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#2ca0bd',
        metalness: 0.12,
        roughness: 0.04,
        transmission: 0.45,
        transparent: true,
        opacity: 0.9,
      }),
    [],
  )

  const conduits = useMemo(
    () => [
      // Solar DC down to switchboard — neat wall chase
      [
        new THREE.Vector3(0.8, 5.55, -0.3),
        new THREE.Vector3(5.2, 5.4, 0.5),
        new THREE.Vector3(6.4, 4.2, 2.0),
        new THREE.Vector3(6.45, 2.2, 3.8),
        new THREE.Vector3(5.9, 1.5, 4.5),
      ],
      // Front AC bank → switchboard
      [
        new THREE.Vector3(-3.2, 1.35, 4.7),
        new THREE.Vector3(-1.0, 1.15, 4.7),
        new THREE.Vector3(2.0, 1.15, 4.7),
        new THREE.Vector3(5.5, 1.25, 4.55),
      ],
      // Garage AC → EV charger → switchboard
      [
        new THREE.Vector3(9.4, 1.8, 4.6),
        new THREE.Vector3(9.4, 1.4, 5.2),
        new THREE.Vector3(9.0, 1.2, 6.0),
        new THREE.Vector3(7.2, 1.15, 6.4),
        new THREE.Vector3(5.9, 1.25, 5.0),
      ],
      // Pool pump → switchboard
      [
        new THREE.Vector3(1.2, 0.55, 9.6),
        new THREE.Vector3(1.2, 0.7, 7.5),
        new THREE.Vector3(3.5, 0.9, 5.5),
        new THREE.Vector3(5.6, 1.2, 4.7),
      ],
    ],
    [],
  )

  return (
    <group>
      {/* Landscaped site — pale Australian sandstone hardscape */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 1]} receiveShadow>
        <planeGeometry args={[28, 22]} />
        <meshStandardMaterial color="#cbbba0" roughness={0.96} />
      </mesh>
      {/* Native lawn strips */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7, 0.02, 0]} receiveShadow>
        <planeGeometry args={[6, 14]} />
        <meshStandardMaterial color="#6e8a4e" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -6]} receiveShadow>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color="#6a864a" roughness={1} />
      </mesh>

      {/* Exposed aggregate driveway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.2, 0.025, 5.5]} receiveShadow>
        <planeGeometry args={[6, 12]} />
        <meshStandardMaterial color="#8a8680" roughness={0.9} />
      </mesh>

      {/* ——— MAIN PAVILION (coastal contemporary) ——— */}
      <mesh castShadow receiveShadow position={[0, 1.65, 0]} material={render}>
        <boxGeometry args={[13.5, 3.3, 8.8]} />
      </mesh>

      {/* Upper storey with deep Colorbond eave */}
      <mesh castShadow receiveShadow position={[0.8, 4.25, -0.6]} material={render}>
        <boxGeometry args={[10, 2.2, 7]} />
      </mesh>
      <mesh castShadow position={[0.8, 5.5, 0.4]} rotation={[0.06, 0, 0]} material={colorbond}>
        <boxGeometry args={[11.2, 0.14, 5.5]} />
      </mesh>
      <mesh castShadow position={[0.8, 5.45, -2.8]} material={colorbond}>
        <boxGeometry args={[11.2, 0.14, 3.2]} />
      </mesh>

      {/* Blackbutt timber feature wing */}
      <mesh castShadow receiveShadow position={[-6.4, 1.55, 1.6]} material={blackbutt}>
        <boxGeometry args={[4.6, 3.1, 6]} />
      </mesh>
      <mesh castShadow position={[-6.4, 3.25, 1.6]} material={colorbond}>
        <boxGeometry args={[5.0, 0.16, 6.4]} />
      </mesh>

      {/* Limestone garage pavilion */}
      <mesh castShadow receiveShadow position={[8.0, 1.2, 2.0]} material={limestone}>
        <boxGeometry args={[4.6, 2.4, 5.6]} />
      </mesh>
      <mesh castShadow position={[8.0, 2.5, 2.0]} material={colorbond}>
        <boxGeometry args={[4.9, 0.14, 5.9]} />
      </mesh>

      {/* Main roof slab + parapet */}
      <mesh castShadow receiveShadow position={[0, 3.4, 0]} material={render}>
        <boxGeometry args={[13.9, 0.22, 9.2]} />
      </mesh>
      {[
        [0, 3.62, -4.5, 13.9, 0.35, 0.14],
        [0, 3.62, 4.5, 13.9, 0.35, 0.14],
        [-6.85, 3.62, 0, 0.14, 0.35, 9.0],
        [6.85, 3.62, 0, 0.14, 0.35, 9.0],
      ].map((v, i) => (
        <mesh key={i} castShadow position={[v[0], v[1], v[2]]} material={charcoal}>
          <boxGeometry args={[v[3], v[4], v[5]]} />
        </mesh>
      ))}

      {/* ——— ALFRESCO / VERANDAH (classic Aussie outdoor living) ——— */}
      <mesh castShadow position={[1.5, 3.15, 5.6]} material={colorbond}>
        <boxGeometry args={[9.5, 0.12, 3.2]} />
      </mesh>
      {/* Slim steel posts */}
      {[
        [-2.8, 1.55, 6.8],
        [0.2, 1.55, 6.8],
        [3.2, 1.55, 6.8],
        [5.6, 1.55, 6.8],
      ].map((p, i) => (
        <mesh key={i} castShadow position={p as [number, number, number]} material={charcoal}>
          <cylinderGeometry args={[0.07, 0.07, 3.1, 10]} />
        </mesh>
      ))}
      {/* Deck boards */}
      <mesh receiveShadow position={[1.5, 0.12, 5.7]} material={blackbutt}>
        <boxGeometry args={[9.5, 0.14, 3.0]} />
      </mesh>

      {/* Outdoor kitchen / BBQ island */}
      <group position={[-1.8, 0.55, 6.5]}>
        <mesh castShadow material={limestone}>
          <boxGeometry args={[2.4, 0.95, 0.85]} />
        </mesh>
        <mesh position={[0.5, 0.55, 0]} material={charcoal}>
          <boxGeometry args={[0.9, 0.12, 0.7]} />
        </mesh>
        <mesh position={[-0.6, 0.2, 0.45]}>
          <boxGeometry args={[0.7, 0.08, 0.02]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} />
        </mesh>
      </group>

      {/* Infinity edge pool — clear tiled basin */}
      <group position={[3.8, 0, 8.6]}>
        <mesh castShadow receiveShadow position={[0, -0.35, 0]} material={limestone}>
          <boxGeometry args={[9.2, 0.7, 4.4]} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={poolWater}>
          <planeGeometry args={[8.4, 3.6]} />
        </mesh>
        {/* Water volume tint */}
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[8.2, 0.4, 3.4]} />
          <meshPhysicalMaterial
            color="#1a8aab"
            transparent
            opacity={0.45}
            roughness={0.1}
            transmission={0.3}
          />
        </mesh>
        {/* Tile coping edge */}
        {[
          [0, 0.08, 1.95, 9.0, 0.12, 0.35],
          [0, 0.08, -1.95, 9.0, 0.12, 0.35],
          [4.4, 0.08, 0, 0.35, 0.12, 4.0],
          [-4.4, 0.08, 0, 0.35, 0.12, 4.0],
        ].map((v, i) => (
          <mesh key={i} position={[v[0], v[1], v[2]]} material={limestone}>
            <boxGeometry args={[v[3], v[4], v[5]]} />
          </mesh>
        ))}
        {/* Spa */}
        <mesh castShadow position={[3.6, 0.25, -0.9]} material={limestone}>
          <cylinderGeometry args={[1.05, 1.1, 0.5, 24]} />
        </mesh>
        <mesh position={[3.6, 0.48, -0.9]} rotation={[-Math.PI / 2, 0, 0]} material={poolWater}>
          <circleGeometry args={[0.85, 24]} />
        </mesh>
        {/* Pool pump / filter */}
        <group position={[-3.2, 0.4, 1.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.35, 0.38, 0.7, 14]} />
            <meshStandardMaterial color="#2563eb" metalness={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0.45, 0, 0]}>
            <boxGeometry args={[0.5, 0.35, 0.35]} />
            <meshStandardMaterial color="#1e293b" metalness={0.4} />
          </mesh>
        </group>
      </group>

      {/* Floor-to-ceiling stacking glass (north-facing living) */}
      <Glass args={[4.0, 2.6, 0.1]} position={[-2.4, 1.7, 4.45]} nightGlow={night} />
      <Glass args={[4.0, 2.6, 0.1]} position={[2.0, 1.7, 4.45]} nightGlow={night} />
      <Glass args={[3.2, 1.7, 0.1]} position={[0.8, 4.3, 2.95]} nightGlow={night} />
      <Glass args={[2.4, 1.7, 0.1]} position={[-2.4, 4.3, 2.95]} nightGlow={night} />
      <Glass args={[0.1, 2.4, 3.2]} position={[6.8, 1.7, -0.2]} nightGlow={night} />
      <Glass args={[2.6, 2.0, 0.1]} position={[-6.4, 1.6, 4.65]} nightGlow={night} />

      {/* Frameless glass balustrade on upper terrace */}
      <mesh position={[0.8, 4.0, 3.2]}>
        <boxGeometry args={[7, 0.9, 0.06]} />
        <meshPhysicalMaterial color="#cfe4f0" transparent opacity={0.35} transmission={0.5} roughness={0.05} />
      </mesh>
      <mesh castShadow position={[0.8, 3.55, 2.9]} material={render}>
        <boxGeometry args={[7.2, 0.12, 1.5]} />
      </mesh>

      {/* Front pivot door — blackbutt */}
      <mesh castShadow position={[0.2, 1.4, 4.5]} material={blackbutt}>
        <boxGeometry args={[1.35, 2.6, 0.14]} />
      </mesh>
      <mesh position={[0.55, 1.4, 4.58]}>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color="#c0c8d0" metalness={0.8} />
      </mesh>

      {/* Garage — door open (rolled up) so EV charging is visible */}
      <mesh castShadow position={[8.0, 2.35, 4.7]} material={colorbond}>
        <boxGeometry args={[3.6, 0.35, 0.14]} />
      </mesh>
      {/* Interior garage floor light */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.0, 0.04, 2.2]} receiveShadow>
        <planeGeometry args={[4.2, 5]} />
        <meshStandardMaterial color="#5c5c58" roughness={0.9} />
      </mesh>
      <pointLight position={[8, 2.2, 2.5]} intensity={night ? 8 : 3} distance={10} color="#fff4e0" />

      {/* Feature stone chimney */}
      <mesh castShadow position={[-2.8, 4.2, -3.2]} material={limestone}>
        <boxGeometry args={[1.1, 2.4, 1.0]} />
      </mesh>
      <mesh position={[-2.8, 5.5, -3.2]} material={charcoal}>
        <boxGeometry args={[1.25, 0.15, 1.15]} />
      </mesh>

      {/* Solar array */}
      <SolarPanel position={[-2.6, 3.6, -1.1]} size={[4.6, 3.2]} />
      <SolarPanel position={[2.4, 3.6, -1.1]} size={[4.6, 3.2]} />
      <SolarPanel position={[0.8, 5.65, -0.8]} size={[6.5, 3.8]} />
      <SolarPanel position={[-6.2, 3.42, 1.4]} size={[3.4, 3.6]} rot={[-0.1, 0.12, 0]} />

      {/* AC units — front façade + garage, large & camera-facing */}
      <AirCon position={[-3.5, 1.55, 4.72]} running={acOn} scale={1.4} />
      <AirCon position={[-5.0, 1.55, 4.72]} running={acOn} scale={1.4} />
      <AirCon position={[3.6, 1.55, 4.72]} running={acOn} scale={1.35} />
      <AirCon position={[9.5, 1.7, 4.55]} running={acOn} scale={1.3} />
      <AirCon position={[5.2, 3.85, -4.55]} rotation={[0, Math.PI, 0]} running={acOn} scale={1.25} />

      {/* Switchboard */}
      <group position={[5.8, 1.4, 4.45]}>
        <mesh castShadow material={charcoal}>
          <boxGeometry args={[0.85, 1.25, 0.32]} />
        </mesh>
        <mesh position={[0, 0.05, 0.17]}>
          <boxGeometry args={[0.7, 0.95, 0.02]} />
          <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.4} />
        </mesh>
        {[0.28, 0.08, -0.12, -0.32].map((y, i) => (
          <mesh key={i} position={[0, y, 0.185]}>
            <boxGeometry args={[0.55, 0.1, 0.02]} />
            <meshStandardMaterial
              color={i === 0 ? (night ? '#60a5fa' : '#4ade80') : '#1e293b'}
              emissive={i === 0 ? (night ? '#60a5fa' : '#4ade80') : '#000'}
              emissiveIntensity={i === 0 ? 0.6 : 0}
              metalness={0.3}
            />
          </mesh>
        ))}
        <mesh position={[0.28, 0.52, 0.17]}>
          <boxGeometry args={[0.12, 0.08, 0.04]} />
          <meshStandardMaterial color="#64748b" metalness={0.6} />
        </mesh>
      </group>

      {/* Neat conduit fittings */}
      {conduits.map((pts, i) => (
        <Conduit key={i} points={pts} radius={i === 0 ? 0.07 : 0.05} />
      ))}
      {/* Conduit saddle clips */}
      {[
        [-3.2, 1.15, 4.72],
        [-1.0, 1.15, 4.72],
        [2.0, 1.15, 4.72],
        [6.4, 3.0, 2.8],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.12, 0.08, 0.1]} />
          <meshStandardMaterial color="#334155" metalness={0.5} />
        </mesh>
      ))}

      {/* Tesla on open driveway — clear of battery pad */}
      <WallCharger position={[10.4, 1.15, 9.2]} active={evCharging} nightCharge={nightCharge} />
      <TeslaEV position={[8.6, 0, 10.8]} charging={evCharging} nightCharge={nightCharge} />
      <ChargeCable
        from={[10.55, 1.05, 9.25]}
        to={[9.95, 0.85, 9.55]}
        active={evCharging}
        nightCharge={nightCharge}
      />
      <Conduit
        points={[
          new THREE.Vector3(5.9, 1.4, 4.5),
          new THREE.Vector3(8.0, 1.35, 6.5),
          new THREE.Vector3(9.8, 1.3, 8.2),
          new THREE.Vector3(10.4, 1.2, 9.1),
        ]}
        radius={0.055}
      />
      {nightCharge && (
        <Conduit
          points={[
            new THREE.Vector3(4.5, 1.2, 10.5),
            new THREE.Vector3(7.2, 1.15, 10.3),
            new THREE.Vector3(9.5, 1.15, 9.6),
            new THREE.Vector3(10.3, 1.2, 9.25),
          ]}
          radius={0.06}
        />
      )}
      {/* Native planting */}
      <GumTree position={[-10.5, 0, 4]} scale={1.25} />
      <GumTree position={[-9.5, 0, -4]} scale={1.0} />
      <GumTree position={[12, 0, -3]} scale={1.15} />
      <GumTree position={[-4, 0, -8]} scale={0.85} />
      <GumTree position={[5, 0, -8.5]} scale={0.95} />

      {/* Soft landscaping mounds */}
      {[
        [-8.5, 0.25, 6, 1.8],
        [11, 0.2, 4, 1.4],
        [-5, 0.22, -5.5, 1.6],
      ].map((v, i) => (
        <mesh key={i} castShadow position={[v[0], v[1], v[2]]}>
          <sphereGeometry args={[v[3], 10, 8]} />
          <meshStandardMaterial color="#5a7540" roughness={0.95} />
        </mesh>
      ))}

      {/* Courtyard olive / topiary pots */}
      {[
        [-3.5, 0, 5.2],
        [5.5, 0, 5.2],
      ].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <mesh castShadow position={[0, 0.25, 0]} material={limestone}>
            <cylinderGeometry args={[0.35, 0.28, 0.5, 12]} />
          </mesh>
          <mesh castShadow position={[0, 0.85, 0]}>
            <sphereGeometry args={[0.45, 10, 10]} />
            <meshStandardMaterial color="#3d5c32" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Neighbourhood context */}
      <NeighborHouse position={[-20, 0, -2]} rotationY={0.12} wall="#f0e8dc" timber="#6e5338" scale={0.88} />
      <NeighborHouse position={[20, 0, 3]} rotationY={-0.4} wall="#ebe7e0" timber="#5c4a38" scale={0.78} />
      <NeighborHouse position={[-14, 0, 17]} rotationY={0.95} wall="#f5efe6" timber="#7a6248" scale={0.72} />
      <NeighborHouse position={[15, 0, -15]} rotationY={-0.15} wall="#e8ebe6" timber="#4a5548" scale={0.7} />

      <GumTree position={[-16, 0, 3]} scale={1.3} />
      <GumTree position={[17, 0, 9]} scale={1.05} />
      <GumTree position={[13, 0, -11]} scale={1.2} />
    </group>
  )
}
