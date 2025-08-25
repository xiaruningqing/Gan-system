import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Text } from '@react-three/drei'

function Block({ position=[0,0,0], color='#7c4dff', label='Layer', size=[1.8, 0.8, 1.2] }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={size}/>
        <meshStandardMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <Text
        position={[0, size[1]/2 + 0.3, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  )
}

function Arrow({ start, end, color="#ffffff" }) {
  const direction = [end[0] - start[0], end[1] - start[1], end[2] - start[2]]
  const length = Math.sqrt(direction[0]**2 + direction[1]**2 + direction[2]**2)
  const midpoint = [(start[0] + end[0])/2, (start[1] + end[1])/2, (start[2] + end[2])/2]
  
  return (
    <group position={midpoint}>
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, length, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

function GanGraph() {
  return (
    <group>
      {/* Generator Path */}
      <Block position={[-3, 1, 0]} color="#7c4dff" label="Noise z" size={[1.4, 0.6, 1]} />
      <Block position={[-1, 1, 0]} color="#7c4dff" label="Generator" size={[1.8, 0.8, 1.2]} />
      <Block position={[1.5, 1, 0]} color="#26c6da" label="Fake Data" size={[1.6, 0.7, 1.1]} />
      <Block position={[3.5, 0, 0]} color="#ff7043" label="Discriminator" size={[1.8, 1.2, 1.2]} />

      {/* Real Data Path */}
      <Block position={[1.5, -1, 0]} color="#4caf50" label="Real Data" size={[1.6, 0.7, 1.1]} />

      {/* Arrows */}
      <Arrow start={[-2.2, 1, 0]} end={[-1.8, 1, 0]} color="#7c4dff" />
      <Arrow start={[-0.1, 1, 0]} end={[0.7, 1, 0]} color="#7c4dff" />
      <Arrow start={[2.3, 1, 0]} end={[2.7, 0.5, 0]} color="#26c6da" />
      <Arrow start={[2.3, -1, 0]} end={[2.7, -0.5, 0]} color="#4caf50" />
    </group>
  )
}

export default function Gan3dModel({ height=360 }) {
  return (
    <div style={{ height, width: '100%', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
      <Canvas camera={{ position: [6, 3, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#7c4dff" />
        <Suspense fallback={null}>
          <GanGraph />
        </Suspense>
        <OrbitControls 
          enablePan 
          enableRotate 
          enableZoom 
          maxDistance={15}
          minDistance={5}
        />
      </Canvas>
    </div>
  )
}

