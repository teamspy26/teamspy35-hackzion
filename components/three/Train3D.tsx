'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  position?: [number, number, number]
  scale?: number
  rotationOffset?: number
}

export default function Train3D({ position = [0, 0, 0], scale = 1, rotationOffset = 0 }: Props) {
  const wheelsRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (wheelsRef.current) {
      wheelsRef.current.children.forEach(w => { w.rotation.x -= 0.05 })
    }
  })

  const yellow = '#EAB308'
  const dark = '#111111'
  const darkGray = '#222222'
  const silver = '#AAAAAA'
  const windowBlue = '#88CCFF'
  const red = '#CC3333'

  return (
    <group position={position} scale={scale} rotation={[0, rotationOffset, 0]}>

      {/* === LOCOMOTIVE === */}
      {/* Main loco body */}
      <mesh position={[-3.5, 0.5, 0]} castShadow>
        <boxGeometry args={[3.2, 1.5, 1.5]} />
        <meshStandardMaterial color={dark} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Loco nose (tapered front) */}
      <mesh position={[-5.2, 0.5, 0]}>
        <boxGeometry args={[0.5, 1.4, 1.4]} />
        <meshStandardMaterial color={yellow} metalness={0.2} roughness={0.5} />
      </mesh>
      {/* Nose bullet shape */}
      <mesh position={[-5.52, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <coneGeometry args={[0.7, 0.5, 12]} />
        <meshStandardMaterial color={yellow} metalness={0.2} roughness={0.4} />
      </mesh>
      {/* Loco yellow stripe */}
      <mesh position={[-3.5, 0.95, 0.76]}>
        <boxGeometry args={[3.0, 0.16, 0.02]} />
        <meshStandardMaterial color={yellow} metalness={0.1} roughness={0.4} />
      </mesh>
      <mesh position={[-3.5, 0.95, -0.76]}>
        <boxGeometry args={[3.0, 0.16, 0.02]} />
        <meshStandardMaterial color={yellow} metalness={0.1} roughness={0.4} />
      </mesh>
      {/* Loco cab section */}
      <mesh position={[-2.0, 1.35, 0]}>
        <boxGeometry args={[1.2, 0.55, 1.4]} />
        <meshStandardMaterial color={darkGray} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Cab windows */}
      <mesh position={[-1.37, 1.38, 0.71]}>
        <boxGeometry args={[0.8, 0.38, 0.04]} />
        <meshStandardMaterial color={windowBlue} transparent opacity={0.7} roughness={0.1} />
      </mesh>
      <mesh position={[-1.37, 1.38, -0.71]}>
        <boxGeometry args={[0.8, 0.38, 0.04]} />
        <meshStandardMaterial color={windowBlue} transparent opacity={0.7} roughness={0.1} />
      </mesh>
      {/* Headlights */}
      <mesh position={[-5.5, 0.75, 0.4]}>
        <boxGeometry args={[0.04, 0.22, 0.28]} />
        <meshStandardMaterial color='#FFFFAA' emissive='#FFFF44' emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[-5.5, 0.75, -0.4]}>
        <boxGeometry args={[0.04, 0.22, 0.28]} />
        <meshStandardMaterial color='#FFFFAA' emissive='#FFFF44' emissiveIntensity={1.2} />
      </mesh>
      {/* Number plate */}
      <mesh position={[-5.5, 0.3, 0]}>
        <boxGeometry args={[0.04, 0.3, 0.5]} />
        <meshStandardMaterial color={yellow} metalness={0.2} roughness={0.4} />
      </mesh>
      {/* Pantograph (current collector) */}
      <mesh position={[-3.2, 2.12, 0]}>
        <boxGeometry args={[1.6, 0.06, 0.06]} />
        <meshStandardMaterial color={silver} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-3.0, 1.78, 0.3]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.8, 0.06, 0.06]} />
        <meshStandardMaterial color={silver} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-3.0, 1.78, -0.3]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.8, 0.06, 0.06]} />
        <meshStandardMaterial color={silver} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* === CAR 1 (yellow) === */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[3.5, 1.4, 1.5]} />
        <meshStandardMaterial color={yellow} metalness={0.1} roughness={0.5} />
      </mesh>
      {/* Car1 roof */}
      <mesh position={[0, 1.24, 0]}>
        <boxGeometry args={[3.5, 0.1, 1.42]} />
        <meshStandardMaterial color='#C89A00' metalness={0.2} roughness={0.5} />
      </mesh>
      {/* Car1 stripe */}
      <mesh position={[0, 0.62, 0.76]}>
        <boxGeometry args={[3.3, 0.12, 0.02]} />
        <meshStandardMaterial color={dark} metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Car1 windows */}
      {[-1.1, -0.3, 0.5, 1.2].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.62, 0.77]}>
            <boxGeometry args={[0.5, 0.38, 0.04]} />
            <meshStandardMaterial color={windowBlue} transparent opacity={0.7} roughness={0.1} />
          </mesh>
          <mesh position={[x, 0.62, -0.77]}>
            <boxGeometry args={[0.5, 0.38, 0.04]} />
            <meshStandardMaterial color={windowBlue} transparent opacity={0.7} roughness={0.1} />
          </mesh>
        </group>
      ))}
      {/* Car1 doors */}
      <mesh position={[-1.6, 0.5, 0.77]}>
        <boxGeometry args={[0.5, 1.1, 0.04]} />
        <meshStandardMaterial color='#C89A00' metalness={0.2} roughness={0.4} />
      </mesh>

      {/* === CAR 2 (dark) === */}
      <mesh position={[3.8, 0.5, 0]} castShadow>
        <boxGeometry args={[3.5, 1.4, 1.5]} />
        <meshStandardMaterial color={darkGray} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Car2 roof */}
      <mesh position={[3.8, 1.24, 0]}>
        <boxGeometry args={[3.5, 0.1, 1.42]} />
        <meshStandardMaterial color='#1a1a1a' metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Car2 stripe */}
      <mesh position={[3.8, 0.62, 0.76]}>
        <boxGeometry args={[3.3, 0.12, 0.02]} />
        <meshStandardMaterial color={yellow} metalness={0.1} roughness={0.4} />
      </mesh>
      <mesh position={[3.8, 0.62, -0.76]}>
        <boxGeometry args={[3.3, 0.12, 0.02]} />
        <meshStandardMaterial color={yellow} metalness={0.1} roughness={0.4} />
      </mesh>
      {/* Car2 windows */}
      {[2.6, 3.4, 4.2, 5.0].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.62, 0.77]}>
            <boxGeometry args={[0.5, 0.38, 0.04]} />
            <meshStandardMaterial color={windowBlue} transparent opacity={0.7} roughness={0.1} />
          </mesh>
          <mesh position={[x, 0.62, -0.77]}>
            <boxGeometry args={[0.5, 0.38, 0.04]} />
            <meshStandardMaterial color={windowBlue} transparent opacity={0.7} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* === COUPLINGS between cars === */}
      {[[-1.9, 0], [1.9, 0], [1.95, 3.8], [5.65, 3.8]].map(([x, base], i) => (
        <mesh key={i} position={[x, -0.1, 0]}>
          <boxGeometry args={[0.2, 0.15, 0.25]} />
          <meshStandardMaterial color={silver} metalness={0.7} roughness={0.2} />
        </mesh>
      ))}

      {/* === RAIL TRACK === */}
      {/* Rails */}
      {[-0.65, 0.65].map((z, i) => (
        <mesh key={i} position={[0.5, -0.78, z]}>
          <boxGeometry args={[15, 0.06, 0.1]} />
          <meshStandardMaterial color={silver} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Sleepers/ties */}
      {[-5, -3.5, -2, -0.5, 1, 2.5, 4, 5.5].map((x, i) => (
        <mesh key={i} position={[x, -0.82, 0]}>
          <boxGeometry args={[0.2, 0.06, 1.8]} />
          <meshStandardMaterial color='#3a2a1a' roughness={0.9} />
        </mesh>
      ))}

      {/* === WHEELS === */}
      <group ref={wheelsRef}>
        {/* Loco wheels */}
        {[-0.75, 0.75].map((z, i) =>
          [[-4.8, -0.5], [-4.0, -0.5], [-3.2, -0.5], [-2.4, -0.5]].map(([x, y], j) => (
            <mesh key={`lw${i}${j}`} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.38, 0.38, 0.18, 14]} />
              <meshStandardMaterial color='#1a1a1a' metalness={0.3} roughness={0.7} />
            </mesh>
          ))
        )}
        {/* Car1 wheels */}
        {[-0.75, 0.75].map((z, i) =>
          [[-1.5, -0.5], [1.5, -0.5]].map(([x, y], j) => (
            <mesh key={`c1w${i}${j}`} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 0.18, 14]} />
              <meshStandardMaterial color='#1a1a1a' metalness={0.3} roughness={0.7} />
            </mesh>
          ))
        )}
        {/* Car2 wheels */}
        {[-0.75, 0.75].map((z, i) =>
          [[2.3, -0.5], [5.3, -0.5]].map(([x, y], j) => (
            <mesh key={`c2w${i}${j}`} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 0.18, 14]} />
              <meshStandardMaterial color='#1a1a1a' metalness={0.3} roughness={0.7} />
            </mesh>
          ))
        )}
      </group>
    </group>
  )
}
