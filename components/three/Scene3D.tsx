'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Stars, PerspectiveCamera, Environment } from '@react-three/drei'
import * as THREE from 'three'
import Truck3D from './Truck3D'
import Plane3D from './Plane3D'
import Train3D from './Train3D'

// Floating particles
function Particles() {
  const count = 80
  const mesh = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return arr
  }, [])

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.02
      mesh.current.rotation.x = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#EAB308" size={0.08} sizeAttenuation transparent opacity={0.6} />
    </points>
  )
}

// Ground grid
function Grid() {
  const grid = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (grid.current) {
      grid.current.position.z = (state.clock.elapsedTime * 1.5) % 4
    }
  })

  return (
    <group ref={grid} position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper args={[80, 40, '#EAB30820', '#EAB30810']} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  )
}

// Orbital ring decoration
function OrbitalRing({ radius, color, speed }: { radius: number; color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * speed
  })
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.02, 6, 80]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.25} />
    </mesh>
  )
}

// Scene content
function SceneContent() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle auto-rotate
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08
    }
  })

  return (
    <group ref={groupRef}>
      {/* === TRUCK — center-left, large === */}
      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.5}>
        <group position={[-2.5, -1.0, 0]} rotation={[0.12, 0.3, 0]}>
          <Truck3D scale={1.0} />
        </group>
      </Float>

      {/* === AIRPLANE — upper right, largest === */}
      <Float speed={0.8} rotationIntensity={0.06} floatIntensity={0.8}>
        <group position={[3, 3.5, -2]} rotation={[0.1, -0.5, 0.08]}>
          <Plane3D scale={1.2} />
        </group>
      </Float>

      {/* === TRAIN — lower front === */}
      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.4}>
        <group position={[-1, -4.5, 2]} rotation={[0, 0.2, 0]}>
          <Train3D scale={0.72} />
        </group>
      </Float>
    </group>
  )
}

export default function Scene3D() {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
    >
      <PerspectiveCamera makeDefault position={[0, 3, 16]} fov={50} />

      {/* Lighting */}
      <ambientLight intensity={0.35} />
      {/* Main key light — warm yellow-white */}
      <directionalLight
        position={[8, 10, 5]}
        intensity={2.0}
        color="#FFF8E8"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* Fill light — cool blue */}
      <directionalLight position={[-6, 4, -4]} intensity={0.6} color="#8888FF" />
      {/* Rim light from below — yellow accent */}
      <pointLight position={[0, -5, 6]} intensity={1.2} color="#EAB308" distance={20} />
      {/* Accent glow from right */}
      <pointLight position={[10, 2, 0]} intensity={0.8} color="#FFDD44" distance={25} />
      {/* Subtle blue from behind */}
      <pointLight position={[-5, 8, -8]} intensity={0.5} color="#4466FF" distance={30} />

      {/* Background stars */}
      <Stars radius={60} depth={30} count={800} factor={3} saturation={0} fade speed={0.5} />

      {/* Particles */}
      <Particles />

      {/* Orbital rings */}
      <OrbitalRing radius={9} color="#EAB308" speed={0.08} />
      <OrbitalRing radius={12} color="#4466FF" speed={-0.05} />
      <OrbitalRing radius={15} color="#EAB308" speed={0.03} />

      {/* Moving grid floor */}
      <Grid />

      {/* Main vehicles */}
      <SceneContent />
    </Canvas>
  )
}
