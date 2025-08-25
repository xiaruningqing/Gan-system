import React, { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'

// 数据粒子组件
const DataParticle = ({ id, path, color, size = 8, speed = 1, delay = 0, onComplete }) => {
  const particleRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    if (!particleRef.current || !path || path.length < 2) return

    const particle = particleRef.current
    const timeline = gsap.timeline({ 
      delay,
      onComplete: () => onComplete && onComplete(id)
    })

    // 设置起始位置
    gsap.set(particle, {
      x: path[0].x,
      y: path[0].y,
      scale: 0,
      opacity: 0
    })

    // 入场动画
    timeline.to(particle, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: "back.out(1.7)"
    })

    // 沿路径移动
    for (let i = 1; i < path.length; i++) {
      timeline.to(particle, {
        x: path[i].x,
        y: path[i].y,
        duration: speed,
        ease: "power2.inOut"
      })
    }

    // 出场动画
    timeline.to(particle, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      ease: "back.in(1.7)"
    })

    animationRef.current = timeline

    return () => {
      if (animationRef.current) {
        animationRef.current.kill()
      }
    }
  }, [path, speed, delay, id, onComplete])

  return (
    <div
      ref={particleRef}
      className="data-particle"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    />
  )
}

// 数据流轨迹组件
const DataTrail = ({ path, color, isActive, width = 2 }) => {
  const trailRef = useRef(null)

  useEffect(() => {
    if (!trailRef.current || !path || path.length < 2) return

    const trail = trailRef.current
    
    if (isActive) {
      gsap.to(trail, {
        opacity: 0.8,
        duration: 0.5,
        ease: "power2.out"
      })
    } else {
      gsap.to(trail, {
        opacity: 0.2,
        duration: 0.5,
        ease: "power2.out"
      })
    }
  }, [isActive])

  if (!path || path.length < 2) return null

  // 创建SVG路径
  const pathString = path.reduce((acc, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }
    return `${acc} L ${point.x} ${point.y}`
  }, '')

  return (
    <svg 
      ref={trailRef}
      className="data-trail"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999
      }}
    >
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={pathString}
        stroke={`url(#gradient-${color.replace('#', '')})`}
        strokeWidth={width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// 数据节点组件
const DataNode = ({ id, position, type, label, isActive, data }) => {
  const nodeRef = useRef(null)

  useEffect(() => {
    if (!nodeRef.current) return

    const node = nodeRef.current
    
    if (isActive) {
      gsap.to(node, {
        scale: 1.1,
        boxShadow: '0 0 20px rgba(124, 77, 255, 0.6)',
        duration: 0.3,
        ease: "power2.out"
      })
    } else {
      gsap.to(node, {
        scale: 1,
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }, [isActive])

  const getNodeColor = () => {
    switch (type) {
      case 'noise': return '#ff6b6b'
      case 'generator': return '#7c4dff'
      case 'discriminator': return '#26c6da'
      case 'real-data': return '#4caf50'
      case 'output': return '#ffa726'
      default: return '#666'
    }
  }

  const getNodeIcon = () => {
    switch (type) {
      case 'noise': return '🎲'
      case 'generator': return '🎨'
      case 'discriminator': return '🔍'
      case 'real-data': return '📊'
      case 'output': return '🖼️'
      default: return '⚪'
    }
  }

  return (
    <div
      ref={nodeRef}
      className={`data-node ${type} ${isActive ? 'active' : ''}`}
      style={{
        position: 'absolute',
        left: position.x - 40,
        top: position.y - 40,
        width: 80,
        height: 80,
        borderRadius: '50%',
        backgroundColor: getNodeColor(),
        border: '3px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        zIndex: 1001
      }}
    >
      <div className="node-icon">{getNodeIcon()}</div>
      <div className="node-label" style={{ fontSize: '10px', marginTop: '2px' }}>
        {label}
      </div>
      {data && (
        <div className="node-data" style={{ 
          position: 'absolute', 
          bottom: '-30px', 
          fontSize: '8px',
          background: 'rgba(0,0,0,0.8)',
          padding: '2px 6px',
          borderRadius: '4px',
          whiteSpace: 'nowrap'
        }}>
          {data}
        </div>
      )}
    </div>
  )
}

// 主要的数据流动画组件
export default function DataFlowAnimation({ 
  currentStep, 
  isTraining, 
  trainingData,
  containerRef 
}) {
  const [particles, setParticles] = useState([])
  const [particleCounter, setParticleCounter] = useState(0)
  const animationContainerRef = useRef(null)

  // 定义数据流路径
  const flowPaths = {
    noiseToGenerator: [
      { x: 100, y: 200 },
      { x: 200, y: 180 },
      { x: 300, y: 160 }
    ],
    generatorToFake: [
      { x: 300, y: 160 },
      { x: 400, y: 140 },
      { x: 500, y: 120 }
    ],
    fakeToDiscriminator: [
      { x: 500, y: 120 },
      { x: 550, y: 200 },
      { x: 600, y: 280 }
    ],
    realToDiscriminator: [
      { x: 100, y: 400 },
      { x: 350, y: 350 },
      { x: 600, y: 280 }
    ],
    discriminatorToOutput: [
      { x: 600, y: 280 },
      { x: 700, y: 260 },
      { x: 800, y: 240 }
    ]
  }

  // 定义数据节点
  const dataNodes = [
    { id: 'noise', position: { x: 100, y: 200 }, type: 'noise', label: '噪声' },
    { id: 'generator', position: { x: 300, y: 160 }, type: 'generator', label: '生成器' },
    { id: 'fake-output', position: { x: 500, y: 120 }, type: 'output', label: '假图像' },
    { id: 'real-data', position: { x: 100, y: 400 }, type: 'real-data', label: '真实数据' },
    { id: 'discriminator', position: { x: 600, y: 280 }, type: 'discriminator', label: '判别器' },
    { id: 'decision', position: { x: 800, y: 240 }, type: 'output', label: '判别结果' }
  ]

  // 创建数据粒子
  const createParticle = (pathName, color, delay = 0) => {
    const id = `particle-${particleCounter}`
    setParticleCounter(prev => prev + 1)
    
    const newParticle = {
      id,
      path: flowPaths[pathName],
      color,
      delay,
      speed: 1 + Math.random() * 0.5
    }

    setParticles(prev => [...prev, newParticle])
    
    // 设置粒子完成后的清理
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id))
    }, (delay + newParticle.speed * (newParticle.path.length - 1) + 0.6) * 1000)
  }

  // 根据当前步骤触发数据流
  useEffect(() => {
    if (!isTraining) return

    const interval = setInterval(() => {
      switch (currentStep) {
        case 0: // 噪声采样
          createParticle('noiseToGenerator', '#ff6b6b', 0)
          break
        case 1: // 生成器处理
          createParticle('noiseToGenerator', '#ff6b6b', 0)
          createParticle('generatorToFake', '#7c4dff', 0.5)
          break
        case 2: // 判别器处理
          createParticle('fakeToDiscriminator', '#ffa726', 0)
          createParticle('realToDiscriminator', '#4caf50', 0.2)
          break
        case 3: // 输出结果
          createParticle('discriminatorToOutput', '#e91e63', 0)
          break
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [currentStep, isTraining, particleCounter])

  // 获取节点激活状态
  const getNodeActiveState = (nodeId) => {
    switch (currentStep) {
      case 0:
        return nodeId === 'noise'
      case 1:
        return ['noise', 'generator'].includes(nodeId)
      case 2:
        return ['generator', 'fake-output', 'real-data', 'discriminator'].includes(nodeId)
      case 3:
        return ['discriminator', 'decision'].includes(nodeId)
      default:
        return false
    }
  }

  // 获取路径激活状态
  const getPathActiveState = (pathName) => {
    switch (currentStep) {
      case 0:
        return pathName === 'noiseToGenerator'
      case 1:
        return ['noiseToGenerator', 'generatorToFake'].includes(pathName)
      case 2:
        return ['fakeToDiscriminator', 'realToDiscriminator'].includes(pathName)
      case 3:
        return pathName === 'discriminatorToOutput'
      default:
        return false
    }
  }

  return (
    <div 
      ref={animationContainerRef}
      className="data-flow-animation"
      style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,60,0.8) 100%)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      {/* 数据流轨迹 */}
      {Object.entries(flowPaths).map(([pathName, path]) => (
        <DataTrail
          key={pathName}
          path={path}
          color={
            pathName.includes('noise') ? '#ff6b6b' :
            pathName.includes('generator') ? '#7c4dff' :
            pathName.includes('fake') ? '#ffa726' :
            pathName.includes('real') ? '#4caf50' :
            '#e91e63'
          }
          isActive={getPathActiveState(pathName)}
          width={3}
        />
      ))}

      {/* 数据节点 */}
      {dataNodes.map(node => (
        <DataNode
          key={node.id}
          {...node}
          isActive={getNodeActiveState(node.id)}
          data={
            node.id === 'generator' && trainingData ? `Loss: ${trainingData.generatorLoss}` :
            node.id === 'discriminator' && trainingData ? `Loss: ${trainingData.discriminatorLoss}` :
            null
          }
        />
      ))}

      {/* 数据粒子 */}
      {particles.map(particle => (
        <DataParticle
          key={particle.id}
          {...particle}
          onComplete={(id) => {
            setParticles(prev => prev.filter(p => p.id !== id))
          }}
        />
      ))}

      {/* 状态指示器 */}
      <div className="flow-status" style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px 15px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px'
      }}>
        <div>当前步骤: {currentStep + 1}/4</div>
        <div>状态: {isTraining ? '🟢 训练中' : '⏸️ 暂停'}</div>
        {trainingData && (
          <div>轮次: {trainingData.currentEpoch || 0}</div>
        )}
      </div>

      {/* 图例 */}
      <div className="flow-legend" style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '12px'
      }}>
        <div style={{ marginBottom: '5px' }}>数据流图例:</div>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff6b6b' }}></div>
            <span>噪声</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#7c4dff' }}></div>
            <span>生成</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#4caf50' }}></div>
            <span>真实</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#e91e63' }}></div>
            <span>判别</span>
          </div>
        </div>
      </div>
    </div>
  )
}
