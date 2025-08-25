import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line, Sphere } from '@react-three/drei'
import * as THREE from 'three'

// 神经元组件
function Neuron({ position, color, isActive, size = 0.1 }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current && isActive) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.2)
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial 
        color={color} 
        emissive={isActive ? color : '#000000'}
        emissiveIntensity={isActive ? 0.3 : 0}
        transparent
        opacity={isActive ? 1 : 0.7}
      />
    </mesh>
  )
}

// 连接线组件
function Connection({ start, end, isActive, color = '#ffffff' }) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end])

  return (
    <Line
      points={points}
      color={color}
      lineWidth={isActive ? 3 : 1}
      transparent
      opacity={isActive ? 0.8 : 0.3}
    />
  )
}

// 增强的数据流粒子
function DataParticle({ path, isActive, color, speed = 1, delay = 0, particleType = 'data' }) {
  const meshRef = useRef()
  const progressRef = useRef(0)
  const trailRef = useRef([])
  const [trailPoints, setTrailPoints] = useState([])

  useFrame((state, delta) => {
    if (meshRef.current && isActive && path.length >= 2) {
      progressRef.current += delta * speed
      if (progressRef.current > 1) {
        progressRef.current = 0
        trailRef.current = []
        setTrailPoints([])
      }

      const currentIndex = Math.floor(progressRef.current * (path.length - 1))
      const nextIndex = Math.min(currentIndex + 1, path.length - 1)
      const localProgress = (progressRef.current * (path.length - 1)) % 1

      const current = path[currentIndex]
      const next = path[nextIndex]
      
      const newPosition = new THREE.Vector3(...current).lerp(
        new THREE.Vector3(...next),
        localProgress
      )
      
      meshRef.current.position.copy(newPosition)
      
      // 添加脉冲效果
      const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.3
      meshRef.current.scale.setScalar(pulseScale)
      
      // 更新轨迹
      trailRef.current.push(newPosition.clone())
      if (trailRef.current.length > 10) {
        trailRef.current.shift()
      }
      setTrailPoints([...trailRef.current])
    }
  })

  if (!isActive) return null

  const getParticleSize = () => {
    switch (particleType) {
      case 'noise': return 0.04
      case 'data': return 0.05
      case 'signal': return 0.06
      default: return 0.05
    }
  }

  const getParticleGeometry = () => {
    switch (particleType) {
      case 'noise': return <octahedronGeometry args={[getParticleSize(), 0]} />
      case 'signal': return <tetrahedronGeometry args={[getParticleSize(), 0]} />
      default: return <sphereGeometry args={[getParticleSize(), 8, 8]} />
    }
  }

  return (
    <group>
      {/* 主粒子 */}
      <mesh ref={meshRef}>
        {getParticleGeometry()}
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.6}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* 粒子轨迹 */}
      {trailPoints.length > 1 && (
        <Line
          points={trailPoints}
          color={color}
          lineWidth={2}
          transparent
          opacity={0.4}
        />
      )}
      
      {/* 粒子光晕 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[getParticleSize() * 2, 8, 8]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  )
}

// 多粒子流组件
function ParticleStream({ path, isActive, color, particleCount = 3, speed = 1, particleType = 'data' }) {
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay: i * 0.3,
      speed: speed + (Math.random() - 0.5) * 0.2
    }))
  }, [particleCount, speed])

  if (!isActive) return null

  return (
    <group>
      {particles.map(particle => (
        <DataParticle
          key={particle.id}
          path={path}
          isActive={isActive}
          color={color}
          speed={particle.speed}
          delay={particle.delay}
          particleType={particleType}
        />
      ))}
    </group>
  )
}

// 网络层组件
function NetworkLayer({ neurons, position, label, color, isActive }) {
  return (
    <group position={position}>
      {neurons.map((neuron, index) => (
        <Neuron
          key={index}
          position={neuron.position}
          color={color}
          isActive={isActive}
          size={neuron.size || 0.1}
        />
      ))}
      <Text
        position={[0, -1.5, 0]}
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

// 主要的GAN网络3D组件
function GanNetwork3DScene({ currentStep, isTraining, metrics }) {
  // 定义网络结构
  const generatorLayers = useMemo(() => [
    {
      name: 'noise',
      neurons: Array.from({ length: 8 }, (_, i) => ({
        position: [0, (i - 3.5) * 0.3, 0],
        size: 0.08
      })),
      position: [-6, 0, 0],
      color: '#ff6b6b'
    },
    {
      name: 'hidden1',
      neurons: Array.from({ length: 12 }, (_, i) => ({
        position: [0, (i - 5.5) * 0.25, 0],
        size: 0.09
      })),
      position: [-4, 0, 0],
      color: '#7c4dff'
    },
    {
      name: 'hidden2',
      neurons: Array.from({ length: 16 }, (_, i) => ({
        position: [0, (i - 7.5) * 0.2, 0],
        size: 0.1
      })),
      position: [-2, 0, 0],
      color: '#7c4dff'
    },
    {
      name: 'output',
      neurons: Array.from({ length: 10 }, (_, i) => ({
        position: [0, (i - 4.5) * 0.3, 0],
        size: 0.11
      })),
      position: [0, 0, 0],
      color: '#ffa726'
    }
  ], [])

  const discriminatorLayers = useMemo(() => [
    {
      name: 'input',
      neurons: Array.from({ length: 10 }, (_, i) => ({
        position: [0, (i - 4.5) * 0.3, 0],
        size: 0.11
      })),
      position: [2, 0, 0],
      color: '#4caf50'
    },
    {
      name: 'hidden1',
      neurons: Array.from({ length: 8 }, (_, i) => ({
        position: [0, (i - 3.5) * 0.35, 0],
        size: 0.1
      })),
      position: [4, 0, 0],
      color: '#26c6da'
    },
    {
      name: 'hidden2',
      neurons: Array.from({ length: 4 }, (_, i) => ({
        position: [0, (i - 1.5) * 0.5, 0],
        size: 0.12
      })),
      position: [6, 0, 0],
      color: '#26c6da'
    },
    {
      name: 'output',
      neurons: [{
        position: [0, 0, 0],
        size: 0.15
      }],
      position: [8, 0, 0],
      color: '#e91e63'
    }
  ], [])

  // 生成连接线
  const connections = useMemo(() => {
    const conns = []
    
    // 生成器连接
    for (let i = 0; i < generatorLayers.length - 1; i++) {
      const currentLayer = generatorLayers[i]
      const nextLayer = generatorLayers[i + 1]
      
      currentLayer.neurons.forEach((neuron, ni) => {
        nextLayer.neurons.forEach((nextNeuron, nni) => {
          conns.push({
            start: [
              currentLayer.position[0] + neuron.position[0],
              currentLayer.position[1] + neuron.position[1],
              currentLayer.position[2] + neuron.position[2]
            ],
            end: [
              nextLayer.position[0] + nextNeuron.position[0],
              nextLayer.position[1] + nextNeuron.position[1],
              nextLayer.position[2] + nextNeuron.position[2]
            ],
            type: 'generator'
          })
        })
      })
    }

    // 判别器连接
    for (let i = 0; i < discriminatorLayers.length - 1; i++) {
      const currentLayer = discriminatorLayers[i]
      const nextLayer = discriminatorLayers[i + 1]
      
      currentLayer.neurons.forEach((neuron, ni) => {
        nextLayer.neurons.forEach((nextNeuron, nni) => {
          conns.push({
            start: [
              currentLayer.position[0] + neuron.position[0],
              currentLayer.position[1] + neuron.position[1],
              currentLayer.position[2] + neuron.position[2]
            ],
            end: [
              nextLayer.position[0] + nextNeuron.position[0],
              nextLayer.position[1] + nextNeuron.position[1],
              nextLayer.position[2] + nextNeuron.position[2]
            ],
            type: 'discriminator'
          })
        })
      })
    }

    return conns
  }, [generatorLayers, discriminatorLayers])

  // 数据流路径
  const dataFlowPaths = useMemo(() => ({
    generator: [
      [-6, 0, 0], [-4, 0, 0], [-2, 0, 0], [0, 0, 0]
    ],
    discriminator: [
      [2, 0, 0], [4, 0, 0], [6, 0, 0], [8, 0, 0]
    ],
    realData: [
      [2, 2, 0], [2, 0, 0]
    ]
  }), [])

  return (
    <group>
      {/* 生成器网络 */}
      {generatorLayers.map((layer, index) => (
        <NetworkLayer
          key={`gen-${index}`}
          neurons={layer.neurons}
          position={layer.position}
          label={layer.name}
          color={layer.color}
          isActive={currentStep === 1 || (isTraining && currentStep <= 1)}
        />
      ))}

      {/* 判别器网络 */}
      {discriminatorLayers.map((layer, index) => (
        <NetworkLayer
          key={`disc-${index}`}
          neurons={layer.neurons}
          position={layer.position}
          label={layer.name}
          color={layer.color}
          isActive={currentStep === 2 || (isTraining && currentStep >= 2)}
        />
      ))}

      {/* 连接线 */}
      {connections.map((conn, index) => (
        <Connection
          key={index}
          start={conn.start}
          end={conn.end}
          isActive={
            (conn.type === 'generator' && (currentStep === 1 || isTraining)) ||
            (conn.type === 'discriminator' && (currentStep === 2 || isTraining))
          }
          color={conn.type === 'generator' ? '#7c4dff' : '#26c6da'}
        />
      ))}

      {/* 增强的数据流粒子 */}
      <ParticleStream
        path={dataFlowPaths.generator}
        isActive={currentStep === 1 || isTraining}
        color="#7c4dff"
        speed={1.5}
        particleCount={4}
        particleType="data"
      />
      <ParticleStream
        path={dataFlowPaths.discriminator}
        isActive={currentStep === 2 || isTraining}
        color="#26c6da"
        speed={1.2}
        particleCount={3}
        particleType="signal"
      />
      <ParticleStream
        path={dataFlowPaths.realData}
        isActive={currentStep === 2 || isTraining}
        color="#4caf50"
        speed={1}
        particleCount={2}
        particleType="data"
      />
      
      {/* 噪声粒子流 */}
      <ParticleStream
        path={[[-6, 0, 0], [-4, 0, 0]]}
        isActive={currentStep === 0 || isTraining}
        color="#ff6b6b"
        speed={2}
        particleCount={5}
        particleType="noise"
      />

      {/* 真实数据输入 */}
      <mesh position={[2, 2, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial 
          color="#4caf50" 
          emissive={currentStep === 2 || isTraining ? "#4caf50" : "#000000"}
          emissiveIntensity={currentStep === 2 || isTraining ? 0.2 : 0}
        />
      </mesh>
      <Text
        position={[2, 2.5, 0]}
        fontSize={0.2}
        color="#4caf50"
        anchorX="center"
      >
        Real Data
      </Text>

      {/* 网络激活光效 */}
      {(currentStep === 1 || isTraining) && (
        <pointLight 
          position={[-2, 0, 2]} 
          intensity={0.8} 
          color="#7c4dff" 
          distance={8}
        />
      )}
      {(currentStep === 2 || isTraining) && (
        <pointLight 
          position={[6, 0, 2]} 
          intensity={0.8} 
          color="#26c6da" 
          distance={8}
        />
      )}
      
      {/* 数据传输光束 */}
      {(currentStep === 1 || isTraining) && (
        <mesh position={[-3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 4, 8]} />
          <meshBasicMaterial 
            color="#7c4dff" 
            transparent 
            opacity={0.3}
            emissive="#7c4dff"
            emissiveIntensity={0.2}
          />
        </mesh>
      )}
      
      {/* 损失函数可视化 */}
      <group position={[1, -3, 0]}>
        <Text
          position={[0, 0, 0]}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
        >
          Loss: G={metrics.generatorLoss.toFixed(2)} D={metrics.discriminatorLoss.toFixed(2)}
        </Text>
        
        {/* 损失变化指示器 */}
        <mesh position={[0, -0.5, 0]}>
          <planeGeometry args={[4, 0.1]} />
          <meshBasicMaterial 
            color={metrics.generatorLoss > metrics.discriminatorLoss ? "#ff6b6b" : "#4caf50"}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    </group>
  )
}

export default function GanNetwork3D({ currentStep, isTraining, metrics }) {
  return (
    <div style={{ width: '100%', height: '600px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#7c4dff" />
        <pointLight position={[10, -10, -5]} intensity={0.5} color="#26c6da" />
        
        <GanNetwork3DScene 
          currentStep={currentStep}
          isTraining={isTraining}
          metrics={metrics}
        />
        
        <OrbitControls 
          enablePan 
          enableRotate 
          enableZoom 
          maxDistance={25}
          minDistance={8}
        />
      </Canvas>
    </div>
  )
}






