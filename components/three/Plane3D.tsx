'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  position?: [number, number, number]
  scale?: number
  rotationOffset?: number
}

export default function Plane3D({ position = [0, 0, 0], scale = 1, rotationOffset = 0 }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const engine1Ref = useRef<THREE.Mesh>(null)
  const engine2Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (engine1Ref.current) engine1Ref.current.rotation.z += 0.12
    if (engine2Ref.current) engine2Ref.current.rotation.z += 0.12
  })

  const bodyWhite = '#F0F0F0'
  const yellow = '#EAB308'
  const dark = '#111111'
  const engineGray = '#666666'
  const windowBlue = '#88CCFF'
  const silver = '#AAAAAA'

  return (
    <group ref={groupRef} position={position} scale={scale} rotation={[0.08, rotationOffset, 0.05]}>
      {/* === FUSELAGE === */}
      {/* Main body */}
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.55, 5.5, 8, 16]} />
        <meshStandardMaterial color={bodyWhite} metalness={0.3} roughness={0.3} />
      </mesh>
      {/* Cockpit nose taper */}
      <mesh position={[-3.0, 0.1, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.55, 1.2, 12]} />
        <meshStandardMaterial color={bodyWhite} metalness={0.3} roughness={0.3} />
      </mesh>
      {/* Cockpit windows */}
      <mesh position={[-2.8, 0.4, 0.3]}>
        <boxGeometry args={[0.5, 0.3, 0.04]} />
        <meshStandardMaterial color={windowBlue} metalness={0.1} roughness={0.1} transparent opacity={0.8} />
      </mesh>
      <mesh position={[-2.8, 0.4, -0.3]}>
        <boxGeometry args={[0.5, 0.3, 0.04]} />
        <meshStandardMaterial color={windowBlue} metalness={0.1} roughness={0.1} transparent opacity={0.8} />
      </mesh>
      {/* Yellow stripe along fuselage */}
      <mesh position={[0, 0.15, 0.56]}>
        <boxGeometry args={[5.8, 0.12, 0.02]} />
        <meshStandardMaterial color={yellow} metalness={0.1} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.15, -0.56]}>
        <boxGeometry args={[5.8, 0.12, 0.02]} />
        <meshStandardMaterial color={yellow} metalness={0.1} roughness={0.4} />
      </mesh>
      {/* Passenger windows row */}
      {[-2.0, -1.0, 0, 1.0, 2.0, 2.8].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.2, 0.57]}>
            <boxGeometry args={[0.3, 0.28, 0.03]} />
            <meshStandardMaterial color={windowBlue} transparent opacity={0.7} roughness={0.1} />
          </mesh>
          <mesh position={[x, 0.2, -0.57]}>
            <boxGeometry args={[0.3, 0.28, 0.03]} />
            <meshStandardMaterial color={windowBlue} transparent opacity={0.7} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* === MAIN WINGS === */}
      {/* Left wing */}
      <mesh position={[-0.3, -0.1, 2.8]} rotation={[0, 0, -0.08]} castShadow>
        <boxGeometry args={[4.0, 0.12, 2.4]} />
        <meshStandardMaterial color={bodyWhite} metalness={0.3} roughness={0.3} />
      </mesh>
      {/* Right wing */}
      <mesh position={[-0.3, -0.1, -2.8]} rotation={[0, 0, 0.08]} castShadow>
        <boxGeometry args={[4.0, 0.12, 2.4]} />
        <meshStandardMaterial color={bodyWhite} metalness={0.3} roughness={0.3} />
      </mesh>
      {/* Wing tips (yellow) */}
      <mesh position={[-0.3, 0.25, 4.1]}>
        <boxGeometry args={[1.2, 0.5, 0.08]} />
        <meshStandardMaterial color={yellow} metalness={0.1} roughness={0.4} />
      </mesh>
      <mesh position={[-0.3, 0.25, -4.1]}>
        <boxGeometry args={[1.2, 0.5, 0.08]} />
        <meshStandardMaterial color={yellow} metalness={0.1} roughness={0.4} />
      </mesh>
      {/* Flap/aileron line on wing */}
      <mesh position={[-1.3, -0.04, 2.8]}>
        <boxGeometry args={[1.0, 0.04, 2.0]} />
        <meshStandardMaterial color={silver} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-1.3, -0.04, -2.8]}>
        <boxGeometry args={[1.0, 0.04, 2.0]} />
        <meshStandardMaterial color={silver} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* === ENGINES === */}
      {/* Engine housings */}
      {[1.5, -1.5].map((z, i) => (
        <group key={i}>
          {/* Pylon */}
          <mesh position={[-0.8, -0.4, z * 1.25]}>
            <boxGeometry args={[1.0, 0.2, 0.25]} />
            <meshStandardMaterial color={engineGray} metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Engine nacelle */}
          <mesh position={[-1.0, -0.55, z * 1.25]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.28, 1.2, 16]} />
            <meshStandardMaterial color={engineGray} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Engine inlet ring */}
          <mesh ref={i === 0 ? engine1Ref : engine2Ref} position={[-1.62, -0.55, z * 1.25]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.28, 0.04, 8, 16]} />
            <meshStandardMaterial color='#333333' metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Engine exhaust */}
          <mesh position={[-0.38, -0.55, z * 1.25]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.26, 0.1, 12]} />
            <meshStandardMaterial color='#222222' metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* === TAIL SECTION === */}
      {/* Vertical stabilizer */}
      <mesh position={[2.6, 1.0, 0]}>
        <boxGeometry args={[1.5, 1.6, 0.12]} />
        <meshStandardMaterial color={bodyWhite} metalness={0.3} roughness={0.3} />
      </mesh>
      {/* Tail fin top (yellow) */}
      <mesh position={[2.6, 1.85, 0]}>
        <boxGeometry args={[0.8, 0.14, 0.14]} />
        <meshStandardMaterial color={yellow} metalness={0.1} roughness={0.4} />
      </mesh>
      {/* Horizontal stabilizers */}
      <mesh position={[2.8, 0.2, 1.0]} rotation={[0, 0, 0.05]}>
        <boxGeometry args={[1.6, 0.1, 0.9]} />
        <meshStandardMaterial color={bodyWhite} metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh position={[2.8, 0.2, -1.0]} rotation={[0, 0, -0.05]}>
        <boxGeometry args={[1.6, 0.1, 0.9]} />
        <meshStandardMaterial color={bodyWhite} metalness={0.3} roughness={0.3} />
      </mesh>

      {/* Landing gear (retracted bumps) */}
      <mesh position={[-0.2, -0.6, 0]}>
        <boxGeometry args={[1.0, 0.15, 0.4]} />
        <meshStandardMaterial color={silver} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  )
}
