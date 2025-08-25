import React, { useState, useEffect, useRef, useCallback } from 'react'

// 高性能拖拽组件 - 使用transform和requestAnimationFrame优化
const DraggableComponent = ({ children, initialPosition, onPositionChange, id }) => {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const elementRef = useRef(null)
  const animationRef = useRef(null)

  const handleMouseDown = useCallback((e) => {
    if (!elementRef.current) return
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    
    // 立即应用拖拽状态的视觉效果
    gsap.to(elementRef.current, {
      scale: 1.08,
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
      duration: 0.2,
      ease: "power2.out"
    })
    
    e.preventDefault()
  }, [position])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !elementRef.current) return
    
    // 使用requestAnimationFrame确保流畅性
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    animationRef.current = requestAnimationFrame(() => {
      const newPosition = {
        x: Math.max(0, e.clientX - dragStart.x),
        y: Math.max(0, e.clientY - dragStart.y)
      }
      
      // 使用GSAP的set方法进行高性能更新
      gsap.set(elementRef.current, {
        x: newPosition.x,
        y: newPosition.y
      })
      
      setPosition(newPosition)
      onPositionChange?.(id, newPosition)
    })
  }, [isDragging, dragStart, id, onPositionChange])

  const handleMouseUp = useCallback(() => {
    if (!elementRef.current) return
    
    setIsDragging(false)
    
    // 平滑恢复到正常状态
    gsap.to(elementRef.current, {
      scale: 1,
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
      duration: 0.3,
      ease: "back.out(1.2)"
    })
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // 初始化位置
  useEffect(() => {
    if (elementRef.current) {
      gsap.set(elementRef.current, {
        x: position.x,
        y: position.y
      })
    }
  }, [])

  return (
    <div
      ref={elementRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: isDragging ? 1000 : 1,
        willChange: 'transform',
        borderRadius: '12px',
        pointerEvents: 'auto' // 确保拖拽容器可以接收鼠标事件
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  )
}
import { gsap } from 'gsap'

// 处理步骤组件
const ProcessingStep = ({ 
  step, 
  isActive, 
  isCompleted, 
  data, 
  onStepClick,
  position 
}) => {
  const stepRef = useRef(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!stepRef.current) return

    if (isActive) {
      setIsProcessing(true)
      
      // 更流畅的激活动画
      gsap.timeline()
        .to(stepRef.current, {
          scale: 1.08,
          boxShadow: `0 12px 50px ${step.color}60`,
          duration: 0.5,
          ease: "back.out(1.2)"
        })
        .to(stepRef.current.querySelector('.step-icon'), {
          rotation: 360,
          scale: 1.1,
          duration: 0.8,
          ease: "power2.out"
        }, 0)
      
      // 处理完成动画 - 缩短时间
      setTimeout(() => {
        setIsProcessing(false)
        gsap.to(stepRef.current, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out"
        })
      }, 800)
    } else {
      gsap.timeline()
        .to(stepRef.current, {
          scale: 1,
          boxShadow: isCompleted ? `0 8px 25px ${step.color}40` : '0 6px 20px rgba(255,255,255,0.08)',
          duration: 0.4,
          ease: "power2.out"
        })
        .to(stepRef.current.querySelector('.step-icon'), {
          rotation: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        }, 0)
    }
  }, [isActive, isCompleted, step.color])

  return (
    <div 
      ref={stepRef}
      className={`processing-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: '200px',
        height: '150px',
        background: 'rgba(255,255,255,0.1)',
        border: `2px solid ${step.color}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: 'default',
        transition: 'all 0.3s ease',
        pointerEvents: 'none' // 禁用点击交互，只允许拖拽
      }}
    >
      <div className="step-header" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <div className="step-icon" style={{
          fontSize: '24px',
          color: step.color
        }}>
          {step.icon}
        </div>
        <h4 style={{
          margin: 0,
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {step.title}
        </h4>
      </div>
      
      <div className="step-content" style={{
        color: 'rgba(255,255,255,0.8)',
        fontSize: '11px',
        lineHeight: '1.3',
        marginBottom: '12px',
        whiteSpace: 'pre-line'
      }}>
        {step.description}
      </div>
      
      {/* 技术详情 */}
      {step.details && isActive && (
        <div className="step-details" style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          background: 'rgba(0,0,0,0.9)',
          border: `1px solid ${step.color}`,
          borderRadius: '8px',
          padding: '12px',
          fontSize: '10px',
          zIndex: 1000,
          marginTop: '8px'
        }}>
          {Object.entries(step.details).map(([key, value]) => (
            <div key={key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
              color: 'rgba(255,255,255,0.9)'
            }}>
              <span style={{ color: step.color }}>{key}:</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* 处理状态指示器 */}
      <div className="step-status" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isActive ? '#4caf50' : isCompleted ? step.color : 'rgba(255,255,255,0.3)'
        }} />
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>
          {isProcessing ? '处理中...' : isCompleted ? '已完成' : '等待中'}
        </span>
      </div>
      
      {/* 数据预览 */}
      {data && (
        <div className="data-preview" style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          width: '40px',
          height: '40px',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'white'
        }}>
          {data.preview}
        </div>
      )}
      
      {/* 处理进度条 */}
      {isProcessing && (
        <div className="processing-bar" style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '3px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '0 0 10px 10px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: step.color,
            animation: 'processing 2s ease-in-out infinite',
            borderRadius: '0 0 10px 10px'
          }} />
        </div>
      )}
    </div>
  )
}

// 数据流连接线组件 - 增加标签支持
const DataConnection = ({ from, to, isActive, data, connectionType = 'normal', label, description }) => {
  const connectionRef = useRef(null)
  const particleRef = useRef(null)

  useEffect(() => {
    if (!connectionRef.current) return

    if (isActive) {
      // 更流畅的连接线激活动画
      gsap.timeline()
        .to(connectionRef.current, {
          opacity: 1,
          strokeWidth: 4,
          duration: 0.4,
          ease: "power2.out"
        })
        .to(connectionRef.current, {
          strokeDasharray: "8,4",
          strokeDashoffset: -12,
          duration: 1.5,
          ease: "none",
          repeat: -1
        }, 0.2)
      
      // 改进的数据流粒子动画
      if (particleRef.current) {
        gsap.set(particleRef.current, { opacity: 1, scale: 1 })
        gsap.to(particleRef.current, {
          offsetDistance: '100%',
          duration: 1.8,
          ease: "power1.inOut",
          repeat: -1,
          repeatDelay: 0.3,
          onRepeat: () => {
            // 每次重复时添加闪烁效果
            gsap.to(particleRef.current, {
              scale: 1.3,
              duration: 0.1,
              yoyo: true,
              repeat: 1,
              ease: "power2.out"
            })
          }
        })
      }
    } else {
      // 平滑的去激活动画
      gsap.timeline()
        .to(connectionRef.current, {
          opacity: 0.4,
          strokeWidth: 2,
          duration: 0.3,
          ease: "power2.out"
        })
        .set(connectionRef.current, { strokeDasharray: "none" })
      
      if (particleRef.current) {
        gsap.to(particleRef.current, { 
          opacity: 0, 
          scale: 0.5,
          duration: 0.3 
        })
      }
    }
  }, [isActive])

  // 根据连接类型生成不同的路径
  const getPathString = () => {
    switch (connectionType) {
      case 'branch':
        return `M ${from.x + 100} ${from.y + 75} L ${to.x + 100} ${to.y + 75}`
      case 'merge':
        return `M ${from.x + 100} ${from.y + 75} L ${to.x} ${to.y + 75}`
      case 'internal':
        return `M ${from.x + 100} ${from.y + 75} Q ${(from.x + to.x) / 2 + 100} ${(from.y + to.y) / 2 + 30} ${to.x + 100} ${to.y + 75}`
      default:
        return `M ${from.x + 200} ${from.y + 75} L ${to.x} ${to.y + 75}`
    }
  }
  
  const pathString = getPathString()

  return (
    <svg 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      <defs>
        <linearGradient id={`gradient-${connectionType}-${Math.random()}`} x1="0%" y1="0%" x2="100%" y2="0%">
          {connectionType === 'branch' ? (
            <>
              <stop offset="0%" stopColor="#7c4dff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#9c27b0" stopOpacity="0.8" />
            </>
          ) : connectionType === 'merge' ? (
            <>
              <stop offset="0%" stopColor="#26c6da" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4caf50" stopOpacity="0.8" />
            </>
          ) : connectionType === 'internal' ? (
            <>
              <stop offset="0%" stopColor="#ff9800" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#26c6da" stopOpacity="0.6" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#7c4dff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#26c6da" stopOpacity="0.8" />
            </>
          )}
        </linearGradient>
      </defs>
      
      <path
        ref={connectionRef}
        d={pathString}
        stroke={`url(#gradient-${connectionType}-${Math.random()})`}
        strokeWidth={connectionType === 'normal' ? "4" : "3"}
        fill="none"
        strokeLinecap="round"
        opacity={isActive ? "0.9" : "0.6"}
        id={`path-${Math.random()}`}
        style={{
          filter: isActive ? 'drop-shadow(0 0 8px rgba(124, 77, 255, 0.6))' : 'none',
          transition: 'all 0.3s ease'
        }}
      />
      
      {/* 数据流粒子 */}
      {isActive && (
        <>
          <circle
            ref={particleRef}
            r="5"
            fill="#ffffff"
            style={{
              offsetPath: `path('${pathString}')`,
              offsetDistance: '0%',
              filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))'
            }}
          >
            <animate
              attributeName="r"
              values="4;7;4"
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;1;0.8"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
          {/* 添加拖尾效果 */}
          <circle
            r="3"
            fill={connectionType === 'branch' ? "#9c27b0" : connectionType === 'merge' ? "#4caf50" : "#7c4dff"}
            opacity="0.4"
            style={{
              offsetPath: `path('${pathString}')`,
              offsetDistance: '0%',
              animationDelay: '0.2s'
            }}
          >
            <animate
              attributeName="r"
              values="2;4;2"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}
      
      {/* 箭头 */}
      <defs>
        <marker
          id={`arrow-${Math.random()}`}
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path 
            d="M2,2 L2,10 L10,6 z" 
            fill={connectionType === 'branch' ? "#9c27b0" : connectionType === 'merge' ? "#4caf50" : "#26c6da"}
            style={{
              filter: isActive ? 'drop-shadow(0 0 4px rgba(38, 198, 218, 0.8))' : 'none'
            }}
          />
        </marker>
      </defs>
      
      <path
        d={pathString}
        stroke="transparent"
        strokeWidth="3"
        fill="none"
        markerEnd={`url(#arrow-${Math.random()})`}
        opacity={isActive ? "1" : "0.7"}
      />

      {/* 连接标签 - 参考RNN平台的标签样式 */}
      {label && (
        <text
          x={(from.x + to.x) / 2 + 100}
          y={(from.y + to.y) / 2 + 75}
          fill="white"
          fontSize="14"
          fontWeight="600"
          textAnchor="middle"
          style={{
            filter: 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.8))',
            fontFamily: 'monospace'
          }}
        >
          {label}
        </text>
      )}
    </svg>
  )
}

// 数据可视化组件
const DataVisualization = ({ stepId, data, isActive }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !data || !isActive) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 根据步骤类型绘制不同的数据可视化
    switch (stepId) {
      case 'input':
        drawInputImage(ctx, data)
        break
      case 'gan_analyze':
        drawGANAnalysis(ctx, data)
        break
      case 'gan_generate':
        drawGANGeneration(ctx, data)
        break
      case 'gan_refine':
        drawGANRefinement(ctx, data)
        break
      case 'output':
        drawOutputImage(ctx, data)
        break
    }
  }, [stepId, data, isActive])

  const drawInputImage = (ctx, data) => {
    // 绘制模糊的输入图像
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 120, 120)
    
    // 模拟模糊图像的像素结构
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const centerX = 60
        const centerY = 60
        const distance = Math.sqrt((i * 15 - centerX) ** 2 + (j * 15 - centerY) ** 2)
        let intensity = Math.max(0, 1 - distance / 50)
        
        // 添加模糊效果
        intensity += (Math.random() - 0.5) * 0.3
        intensity = Math.max(0, Math.min(1, intensity))
        
        ctx.fillStyle = `rgba(255,255,255,${intensity * 0.6})`
        ctx.fillRect(i * 15, j * 15, 12, 12)
      }
    }
    
    // 添加标签
    ctx.fillStyle = '#ff6b6b'
    ctx.font = '10px Arial'
    ctx.fillText('模糊图像', 5, 115)
  }

  const drawGANAnalysis = (ctx, data) => {
    // 绘制GAN分析过程
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, 120, 120)
    
    // 绘制分析网格
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const centerX = 60
        const centerY = 60
        const distance = Math.sqrt((i * 12 - centerX) ** 2 + (j * 12 - centerY) ** 2)
        let intensity = Math.max(0, 1 - distance / 45)
        
        // 分析效果
        intensity = Math.pow(intensity, 0.7)
        
        ctx.fillStyle = `rgba(124,77,255,${intensity * 0.8})`
        ctx.fillRect(i * 12, j * 12, 10, 10)
      }
    }
    
    // 添加分析标记
    ctx.strokeStyle = '#7c4dff'
    ctx.lineWidth = 2
    ctx.strokeRect(30, 30, 60, 60)
    
    ctx.fillStyle = '#7c4dff'
    ctx.font = '10px Arial'
    ctx.fillText('智能分析', 5, 115)
  }

  const drawGANGeneration = (ctx, data) => {
    // 绘制GAN生成过程
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 120, 120)
    
    // 绘制生成器和判别器
    const layers = [
      { nodes: 4, x: 15, color: '#ff6b6b' },  // 输入
      { nodes: 8, x: 35, color: '#9c27b0' },  // 生成器
      { nodes: 12, x: 55, color: '#9c27b0' }, // 生成器
      { nodes: 16, x: 75, color: '#26c6da' }, // 判别器
      { nodes: 8, x: 95, color: '#4caf50' }   // 输出
    ]
    
    layers.forEach((layer, layerIndex) => {
      const nodeSpacing = 80 / (layer.nodes + 1)
      for (let i = 0; i < layer.nodes; i++) {
        const y = 20 + (i + 1) * nodeSpacing
        
        ctx.beginPath()
        ctx.arc(layer.x, y, 3, 0, 2 * Math.PI)
        ctx.fillStyle = layer.color
        ctx.fill()
        
        // 连接到下一层
        if (layerIndex < layers.length - 1) {
          const nextLayer = layers[layerIndex + 1]
          const nextNodeSpacing = 80 / (nextLayer.nodes + 1)
          
          for (let j = 0; j < nextLayer.nodes; j++) {
            const nextY = 20 + (j + 1) * nextNodeSpacing
            ctx.beginPath()
            ctx.moveTo(layer.x + 3, y)
            ctx.lineTo(nextLayer.x - 3, nextY)
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    })
    
    ctx.fillStyle = '#9c27b0'
    ctx.font = '10px Arial'
    ctx.fillText('GAN生成', 5, 115)
  }

  const drawGANRefinement = (ctx, data) => {
    // 绘制GAN精细调整过程
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 120, 120)
    
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        const centerX = 60
        const centerY = 60
        const distance = Math.sqrt((i * 8 - centerX) ** 2 + (j * 8 - centerY) ** 2)
        let intensity = Math.max(0, 1 - distance / 40)
        
        // 精细调整效果
        const refinement = Math.sin(distance * 0.3) * 0.1
        intensity += refinement
        intensity = Math.max(0, Math.min(1, intensity))
        
        ctx.fillStyle = `rgba(38,198,218,${intensity * 0.9})`
        ctx.fillRect(i * 8, j * 8, 6, 6)
      }
    }
    
    // 添加精细调整标记
    ctx.strokeStyle = '#26c6da'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    ctx.strokeRect(20, 20, 80, 80)
    ctx.setLineDash([])
    
    ctx.fillStyle = '#26c6da'
    ctx.font = '10px Arial'
    ctx.fillText('精细调整', 5, 115)
  }

  const drawOutputImage = (ctx, data) => {
    // 绘制最终高清输出图像
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 120, 120)
    
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const centerX = 60
        const centerY = 60
        const distance = Math.sqrt((i * 6 - centerX) ** 2 + (j * 6 - centerY) ** 2)
        let intensity = Math.max(0, 1 - distance / 35)
        
        // 高清细节
        const detail = Math.sin(i * 0.5) * Math.cos(j * 0.5) * 0.1
        intensity += detail
        intensity = Math.max(0, Math.min(1, intensity))
        
        ctx.fillStyle = `rgba(76,175,80,${intensity})`
        ctx.fillRect(i * 6, j * 6, 4, 4)
      }
    }
    
    // 添加高清标记
    ctx.strokeStyle = '#4caf50'
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, 100, 100)
    
    // 质量标签
    ctx.fillStyle = '#4caf50'
    ctx.font = '9px Arial'
    ctx.fillText('高清图像', 5, 110)
    ctx.fillText('清晰度提升', 5, 120)
  }

  return (
    <div className="data-visualization" style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0,0,0,0.8)',
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid rgba(255,255,255,0.2)',
      opacity: isActive ? 1 : 0,
      transition: 'opacity 0.3s ease'
    }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        color: 'white', 
        fontSize: '14px',
        textAlign: 'center'
      }}>
        数据可视化
      </h4>
      <canvas 
        ref={canvasRef}
        width={120}
        height={120}
        style={{
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '4px'
        }}
      />
    </div>
  )
}

// 主要的处理流程管道组件
export default function ProcessingPipeline({ 
  isActive = false, 
  onStepComplete,
  inputData 
}) {
  const [currentStep, setCurrentStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [stepData, setStepData] = useState({})
  const [showDataViz, setShowDataViz] = useState(false)
  const [componentPositions, setComponentPositions] = useState({})
  const [isFlowActive, setIsFlowActive] = useState(false)
  const containerRef = useRef(null)

  // 处理步骤定义 - 简化命名，更易理解
  const processingSteps = [
    {
      id: 'input',
      title: '上传图片',
      description: '选择需要变清晰的图片\n支持常见格式',
      icon: '📷',
      color: '#2196F3',
      position: { x: 100, y: 200 },
      details: {
        inputSize: '任意尺寸',
        format: 'JPG/PNG/BMP',
        type: '图片输入',
        processing: '图像预处理'
      }
    },
    {
      id: 'gan_main',
      title: 'AI智能处理',
      description: '人工智能分析图像\n自动增强清晰度',
      icon: '🧠',
      color: '#F44336',
      position: { x: 450, y: 200 },
      details: {
        networks: '神经网络处理',
        processing: '智能增强',
        formula: 'AI算法优化',
        type: '核心处理'
      },
      hasBranches: true
    },
    {
      id: 'output',
      title: '获得高清图',
      description: '处理完成\n下载高清结果',
      icon: '✨',
      color: '#4CAF50',
      position: { x: 800, y: 200 },
      details: {
        outputSize: '高分辨率',
        quality: '超清画质',
        type: '结果输出',
        result: '可直接使用'
      }
    }
  ]

  // AI处理分支 - 简化说明
  const ganBranches = [
    {
      id: 'generator',
      title: '图像生成',
      description: '创建高清细节\n智能补充像素',
      icon: '🎨',
      color: '#FF5722',
      position: { x: 300, y: 80 },
      details: {
        function: '内容生成',
        input: '模糊图像',
        output: '清晰图像',
        formula: '智能创造'
      }
    },
    {
      id: 'discriminator',
      title: '质量检查',
      description: '验证图像质量\n确保真实效果',
      icon: '🔍',
      color: '#FF9800',
      position: { x: 600, y: 80 },
      details: {
        function: '质量验证',
        input: '生成图像',
        output: '质量评分',
        formula: '真实度检测'
      }
    },
    {
      id: 'optimizer',
      title: '效果优化',
      description: '持续改进\n达到最佳效果',
      icon: '⚡',
      color: '#9C27B0',
      position: { x: 450, y: 380 },
      details: {
        function: '效果调优',
        adversarial: '对抗训练',
        content: '内容保持',
        formula: '平衡优化'
      }
    }
  ]

  // 主流程连接关系 - 简化标签
  const connections = [
    { 
      from: processingSteps[0], 
      to: processingSteps[1], 
      label: '图像数据',
      description: '传输到AI处理'
    },
    { 
      from: processingSteps[1], 
      to: processingSteps[2], 
      label: '高清结果',
      description: '输出最终图像'
    }
  ]

  // AI处理分支连接
  const branchConnections = [
    // 主处理到图像生成
    { 
      from: processingSteps[1].position, 
      to: ganBranches[0].position, 
      type: 'branch',
      label: '原图',
      description: '输入原始图像'
    },
    // 图像生成到质量检查
    { 
      from: ganBranches[0].position, 
      to: ganBranches[1].position, 
      type: 'internal',
      label: '生成图',
      description: '检查生成质量'
    },
    // 质量检查到效果优化
    { 
      from: ganBranches[1].position, 
      to: ganBranches[2].position, 
      type: 'internal',
      label: '质量分',
      description: '优化建议'
    },
    // 效果优化回到主流程
    { 
      from: ganBranches[2].position, 
      to: processingSteps[2].position, 
      type: 'merge',
      label: '优化后',
      description: '最终结果'
    }
  ]

  // 自动流程控制 - 增强版本，防止崩溃
  useEffect(() => {
    let isMounted = true
    let timeoutIds = []
    
    // 安全的状态更新函数
    const safeSetState = (setter, value) => {
      if (isMounted) {
        try {
          setter(value)
        } catch (error) {
          console.warn('Safe state update failed:', error)
        }
      }
    }

    // 只有在手动点击开始演示时才启动动画
    if (!isFlowActive) {
      safeSetState(setCurrentStep, -1)
      safeSetState(setCompletedSteps, new Set())
      safeSetState(setStepData, {})
      return
    }

    let stepIndex = 0

    const processNextStep = () => {
      if (!isMounted || stepIndex >= processingSteps.length) {
        return
      }

      try {
        safeSetState(setCurrentStep, stepIndex)
        
        // 模拟处理时间 - 缩短为更流畅的体验
        const timeoutId = setTimeout(() => {
          if (!isMounted) return
          
          try {
            safeSetState(setCompletedSteps, prev => new Set([...prev, stepIndex]))
            
            // 生成步骤数据 - 添加边界检查
            if (stepIndex < processingSteps.length && processingSteps[stepIndex]) {
              safeSetState(setStepData, prev => ({
                ...prev,
                [processingSteps[stepIndex].id]: {
                  preview: `${stepIndex + 1}/${processingSteps.length}`,
                  processed: true,
                  timestamp: new Date().toLocaleTimeString()
                }
              }))
            }
            
            // 安全地调用回调函数
            if (onStepComplete && isMounted && stepIndex < processingSteps.length && processingSteps[stepIndex]) {
              try {
                onStepComplete(processingSteps[stepIndex].id, stepIndex)
              } catch (error) {
                console.warn('Error in onStepComplete callback:', error)
                // 即使回调失败，也继续流程
              }
            }
            
            stepIndex++
            if (stepIndex < processingSteps.length && isMounted) {
              const nextTimeoutId = setTimeout(() => {
                if (isMounted) {
                  processNextStep()
                }
              }, 300) // 更快的步骤间隔
              timeoutIds.push(nextTimeoutId)
            } else if (isMounted) {
              // 流程完成，安全地设置最终状态
              const finalTimeoutId = setTimeout(() => {
                if (isMounted) {
                  safeSetState(setCurrentStep, -1)
                }
              }, 600) // 更快的完成延迟
              timeoutIds.push(finalTimeoutId)
            }
          } catch (error) {
            console.error('Error in processNextStep:', error)
            // 发生错误时，安全地重置状态
            if (isMounted) {
              safeSetState(setCurrentStep, -1)
            }
          }
        }, 1200) // 缩短主处理时间
        
        timeoutIds.push(timeoutId)
      } catch (error) {
        console.error('Error starting processNextStep:', error)
        if (isMounted) {
          safeSetState(setCurrentStep, -1)
        }
      }
    }

    try {
      processNextStep()
    } catch (error) {
      console.error('Error in flow control:', error)
      if (isMounted) {
        safeSetState(setCurrentStep, -1)
      }
    }

    // 清理函数
    return () => {
      isMounted = false
      timeoutIds.forEach(id => {
        try {
          clearTimeout(id)
        } catch (error) {
          console.warn('Error clearing timeout:', error)
        }
      })
      timeoutIds = []
    }
  }, [isFlowActive, onStepComplete, processingSteps.length])

  // 处理组件位置变化
  const handlePositionChange = useCallback((componentId, newPosition) => {
    setComponentPositions(prev => ({
      ...prev,
      [componentId]: newPosition
    }))
  }, [])

  // 处理步骤点击
  const handleStepClick = useCallback((stepId) => {
    const stepIndex = processingSteps.findIndex(step => step.id === stepId)
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex)
      setShowDataViz(true)
      setTimeout(() => setShowDataViz(false), 3000)
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="processing-pipeline"
      style={{
        position: 'relative',
        width: '100%',
        minWidth: '1200px', // 调整为合适的宽度
        height: '550px', // 调整为合适的高度
        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,60,0.8) 100%)',
        borderRadius: '16px',
        padding: '20px',
        overflow: 'auto', // 允许滚动查看所有内容
        overflowY: 'hidden' // 只允许水平滚动
      }}
    >
      {/* 标题 */}
      <div className="pipeline-header" style={{
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h3 style={{
          margin: 0,
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          GAN图像增强处理流程
        </h3>
        <p style={{
          margin: '8px 0 0 0',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '14px'
        }}>
          {isFlowActive ? '正在演示AI图像增强处理流程...' : '拖拽组件调整布局，点击"开始演示"查看处理流程'}
        </p>
        <div style={{
          marginTop: '15px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '15px'
        }}>
          {/* 演示控制按钮 - 更突出的设计 */}
          <button
            onClick={() => setIsFlowActive(!isFlowActive)}
            style={{
              padding: '12px 24px',
              backgroundColor: isFlowActive ? '#F44336' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              minWidth: '120px',
              boxShadow: isFlowActive ? '0 4px 15px rgba(244, 67, 54, 0.4)' : '0 4px 15px rgba(76, 175, 80, 0.4)',
              transition: 'all 0.3s ease',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)'
            }}
          >
            {isFlowActive ? '⏸️ 停止演示' : '▶️ 开始演示'}
          </button>
          
          <div style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(79, 172, 254, 0.2)',
            borderRadius: '15px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '12px'
          }}>
            💡 组件可拖拽移动
          </div>
          
          <div style={{
            padding: '6px 12px',
            backgroundColor: isFlowActive ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '12px',
            fontFamily: 'monospace',
            border: isFlowActive ? '1px solid rgba(76, 175, 80, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {isFlowActive ? `演示中: ${currentStep + 1}/${processingSteps.length}` : '待机模式'}
          </div>
        </div>
      </div>

      {/* 主流程步骤 - 可拖拽 */}
      {processingSteps.map((step, index) => (
        <DraggableComponent
          key={step.id}
          id={step.id}
          initialPosition={componentPositions[step.id] || step.position}
          onPositionChange={handlePositionChange}
        >
          <ProcessingStep
            step={step}
            isActive={currentStep === index}
            isCompleted={completedSteps.has(index)}
            data={stepData[step.id]}
            onStepClick={handleStepClick}
            position={{ x: 0, y: 0 }} // 相对于拖拽容器的位置
          />
        </DraggableComponent>
      ))}

      {/* GAN分支步骤 - 可拖拽 */}
      {ganBranches.map((branch, index) => (
        <DraggableComponent
          key={branch.id}
          id={branch.id}
          initialPosition={componentPositions[branch.id] || branch.position}
          onPositionChange={handlePositionChange}
        >
          <ProcessingStep
            step={branch}
            isActive={currentStep === 1} // GAN主步骤激活时，分支也激活
            isCompleted={completedSteps.has(1)} // 跟随主GAN步骤的完成状态
            data={stepData[branch.id]}
            onStepClick={handleStepClick}
            position={{ x: 0, y: 0 }} // 相对于拖拽容器的位置
          />
        </DraggableComponent>
      ))}

      {/* 主流程连接线 - 带标签 */}
      {connections.map((conn, index) => (
        <DataConnection
          key={`${conn.from.id}-${conn.to.id}`}
          from={conn.from.position}
          to={conn.to.position}
          isActive={currentStep >= index && currentStep <= index + 1}
          data={stepData[conn.from.id]}
          label={conn.label}
          description={conn.description}
        />
      ))}

      {/* GAN分支连接线 - 带标签 */}
      {branchConnections.map((conn, index) => (
        <DataConnection
          key={`branch-${index}`}
          from={conn.from}
          to={conn.to}
          isActive={currentStep === 1} // GAN步骤激活时显示分支连接
          data={stepData['gan_main']}
          connectionType={conn.type}
          label={conn.label}
          description={conn.description}
        />
      ))}

      {/* 数据可视化覆盖层 */}
      {showDataViz && currentStep >= 0 && (
        <DataVisualization
          stepId={processingSteps[currentStep].id}
          data={stepData[processingSteps[currentStep].id]}
          isActive={showDataViz}
        />
      )}

      {/* 进度指示器 */}
      <div className="progress-indicator" style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        {processingSteps.map((step, index) => (
          <div
            key={step.id}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: completedSteps.has(index) ? step.color : 
                         currentStep === index ? '#ffffff' : 'rgba(255,255,255,0.3)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* 状态信息 */}
      <div className="status-info" style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.6)',
        padding: '8px 12px',
        borderRadius: '6px',
        color: 'white',
        fontSize: '12px'
      }}>
        {currentStep >= 0 ? (
          <span>正在处理: {processingSteps[currentStep].title}</span>
        ) : completedSteps.size === processingSteps.length ? (
          <span>✅ 处理完成</span>
        ) : (
          <span>⏸️ 等待开始</span>
        )}
      </div>
    </div>
  )
}

// CSS动画样式
const styles = `
@keyframes processing {
  0% { width: 0%; }
  50% { width: 100%; }
  100% { width: 0%; }
}

.processing-step:hover {
  transform: translateY(-2px);
}

.processing-step.active {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
`

// 注入样式
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
