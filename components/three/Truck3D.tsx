'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  position?: [number, number, number]
  scale?: number
  rotationOffset?: number
}

export default function Truck3D({ position = [0, 0, 0], scale = 1, rotationOffset = 0 }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const wheelsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (wheelsRef.current) {
      wheelsRef.current.children.forEach(w => { w.rotation.x -= 0.04 })
    }
  })

  const yellow = '#EAB308'
  const dark = '#111111'
  const darkGray = '#2a2a2a'
  const windowColor = '#88CCFF'
  const silver = '#888888'

  return (
    <group ref={groupRef} position={position} scale={scale} rotation={[0, rotationOffset, 0]}>
      {/* === TRAILER === */}
      {/* Main trailer body */}
      <mesh position={[1.2, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 1.8, 1.6]} />
        <meshStandardMaterial color={yellow} metalness={0.1} roughness={0.5} />
      </mesh>
      {/* Trailer roof ridge */}
      <mesh position={[1.2, 1.42, 0]}>
        <boxGeometry args={[3.8, 0.08, 1.4]} />
        <meshStandardMaterial color={dark} metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Trailer rear door */}
      <mesh position={[3.12, 0.5, 0]}>
        <boxGeometry args={[0.06, 1.7, 1.55]} />
        <meshStandardMaterial color={darkGray} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Trailer rear handles */}
      <mesh position={[3.14, 0.5, 0.5]}>
        <boxGeometry args={[0.06, 1.0, 0.06]} />
        <meshStandardMaterial color={silver} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[3.14, 0.5, -0.5]}>
        <boxGeometry args={[0.06, 1.0, 0.06]} />
        <meshStandardMaterial color={silver} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* LOGIFLOW logo panel on trailer */}
      <mesh position={[1.2, 0.5, 0.81]}>
        <boxGeometry args={[2.5, 0.6, 0.02]} />
        <meshStandardMaterial color={dark} metalness={0.2} roughness={0.6} />
      </mesh>

      {/* === CAB === */}
      {/* Cab body */}
      <mesh position={[-1.1, 0.3, 0]} castShadow>
        <boxGeometry args={[1.5, 1.4, 1.65]} />
        <meshStandardMaterial color={dark} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Cab roof */}
      <mesh position={[-0.85, 1.06, 0]}>
        <boxGeometry args={[1.05, 0.14, 1.5]} />
        <meshStandardMaterial color={darkGray} metalness={0.2} roughness={0.5} />
      </mesh>
      {/* Windshield */}
      <mesh position={[-1.86, 0.55, 0]}>
        <boxGeometry args={[0.04, 0.75, 1.4]} />
        <meshStandardMaterial color={windowColor} metalness={0.1} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      {/* Side windows */}
      <mesh position={[-1.1, 0.62, 0.84]}>
        <boxGeometry args={[0.9, 0.55, 0.04]} />
        <meshStandardMaterial color={windowColor} metalness={0.1} roughness={0.1} transparent opacity={0.6} />
      </mesh>
      <mesh position={[-1.1, 0.62, -0.84]}>
        <boxGeometry args={[0.9, 0.55, 0.04]} />
        <meshStandardMaterial color={windowColor} metalness={0.1} roughness={0.1} transparent opacity={0.6} />
      </mesh>
      {/* Headlights */}
      <mesh position={[-1.88, 0.1, 0.5]}>
        <boxGeometry args={[0.04, 0.2, 0.35]} />
        <meshStandardMaterial color='#FFFFAA' emissive='#FFFF44' emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-1.88, 0.1, -0.5]}>
        <boxGeometry args={[0.04, 0.2, 0.35]} />
        <meshStandardMaterial color='#FFFFAA' emissive='#FFFF44' emissiveIntensity={0.8} />
      </mesh>
      {/* Grille */}
      <mesh position={[-1.87, -0.2, 0]}>
        <boxGeometry args={[0.04, 0.5, 1.4]} />
        <meshStandardMaterial color={darkGray} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Bumper */}
      <mesh position={[-1.87, -0.52, 0]}>
        <boxGeometry args={[0.1, 0.12, 1.65]} />
        <meshStandardMaterial color={silver} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Exhaust stacks */}
      <mesh position={[-0.42, 1.55, 0.6]}>
        <cylinderGeometry args={[0.07, 0.07, 0.9, 8]} />
        <meshStandardMaterial color={silver} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.42, 1.55, -0.6]}>
        <cylinderGeometry args={[0.07, 0.07, 0.9, 8]} />
        <meshStandardMaterial color={silver} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Air deflector on cab roof */}
      <mesh position={[-0.38, 1.26, 0]}>
        <boxGeometry args={[0.9, 0.4, 1.5]} />
        <meshStandardMaterial color={yellow} metalness={0.1} roughness={0.5} />
      </mesh>

      {/* === UNDERCARRIAGE & CHASSIS === */}
      <mesh position={[0.6, -0.56, 0]}>
        <boxGeometry args={[5.6, 0.12, 0.8]} />
        <meshStandardMaterial color={darkGray} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Fifth wheel / coupling */}
      <mesh position={[-0.2, -0.44, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.1, 12]} />
        <meshStandardMaterial color={silver} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* === WHEELS === */}
      <group ref={wheelsRef}>
        {/* Front wheels */}
        {[0.65, -0.65].map((z, i) => (
          <mesh key={`fw${i}`} position={[-1.55, -0.56, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.22, 16]} />
            <meshStandardMaterial color='#1a1a1a' metalness={0.1} roughness={0.8} />
          </mesh>
        ))}
        {/* Rear drive axle wheels (dual) */}
        {[0.75, 0.52, -0.52, -0.75].map((z, i) => (
          <mesh key={`ra1${i}`} position={[0.6, -0.56, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.2, 16]} />
            <meshStandardMaterial color='#1a1a1a' metalness={0.1} roughness={0.8} />
          </mesh>
        ))}
        {[0.75, 0.52, -0.52, -0.75].map((z, i) => (
          <mesh key={`ra2${i}`} position={[1.4, -0.56, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.2, 16]} />
            <meshStandardMaterial color='#1a1a1a' metalness={0.1} roughness={0.8} />
          </mesh>
        ))}
        {/* Trailer rear axle wheels (dual) */}
        {[0.75, 0.52, -0.52, -0.75].map((z, i) => (
          <mesh key={`ta1${i}`} position={[2.4, -0.56, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.2, 16]} />
            <meshStandardMaterial color='#1a1a1a' metalness={0.1} roughness={0.8} />
          </mesh>
        ))}
        {/* Wheel caps */}
        {[[-1.55, -0.56, 0.77], [-1.55, -0.56, -0.77], [0.6, -0.56, 0.87], [0.6, -0.56, -0.87]].map((pos, i) => (
          <mesh key={`wc${i}`} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.04, 8]} />
            <meshStandardMaterial color={silver} metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
