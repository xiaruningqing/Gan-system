import React, { useState, useEffect, useCallback, useRef } from 'react'
import { gsap } from 'gsap'

// 步骤指示器组件
const StepIndicator = ({ step, currentStep, isCompleted, onClick, title, description }) => {
  const indicatorRef = useRef(null)

  useEffect(() => {
    if (!indicatorRef.current) return

    const indicator = indicatorRef.current
    
    if (step === currentStep) {
      gsap.to(indicator, {
        scale: 1.1,
        boxShadow: '0 0 20px rgba(124, 77, 255, 0.6)',
        duration: 0.3,
        ease: "power2.out"
      })
    } else {
      gsap.to(indicator, {
        scale: 1,
        boxShadow: isCompleted ? '0 0 10px rgba(76, 175, 80, 0.4)' : '0 0 5px rgba(255, 255, 255, 0.1)',
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }, [step, currentStep, isCompleted])

  return (
    <div 
      ref={indicatorRef}
      className={`step-indicator ${step === currentStep ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
      onClick={() => onClick(step)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '15px',
        margin: '0 10px',
        borderRadius: '12px',
        background: step === currentStep ? 'rgba(124, 77, 255, 0.2)' : 
                   isCompleted ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)',
        border: `2px solid ${step === currentStep ? '#7c4dff' : 
                            isCompleted ? '#4caf50' : 'rgba(255, 255, 255, 0.2)'}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        minWidth: '120px'
      }}
    >
      <div className="step-number" style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: step === currentStep ? '#7c4dff' : 
                   isCompleted ? '#4caf50' : 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '18px',
        marginBottom: '10px'
      }}>
        {isCompleted ? '✓' : step + 1}
      </div>
      <div className="step-title" style={{
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px',
        textAlign: 'center',
        marginBottom: '5px'
      }}>
        {title}
      </div>
      <div className="step-description" style={{
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '12px',
        textAlign: 'center',
        lineHeight: '1.4'
      }}>
        {description}
      </div>
    </div>
  )
}

// 进度条组件
const ProgressBar = ({ progress, isAnimating }) => {
  const progressRef = useRef(null)
  const fillRef = useRef(null)

  useEffect(() => {
    if (!fillRef.current) return

    gsap.to(fillRef.current, {
      width: `${progress}%`,
      duration: 0.5,
      ease: "power2.out"
    })
  }, [progress])

  useEffect(() => {
    if (!progressRef.current) return

    if (isAnimating) {
      gsap.to(progressRef.current, {
        boxShadow: '0 0 20px rgba(124, 77, 255, 0.6)',
        duration: 0.3
      })
    } else {
      gsap.to(progressRef.current, {
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
        duration: 0.3
      })
    }
  }, [isAnimating])

  return (
    <div 
      ref={progressRef}
      className="progress-bar-container"
      style={{
        width: '100%',
        height: '8px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        overflow: 'hidden',
        margin: '20px 0'
      }}
    >
      <div 
        ref={fillRef}
        className="progress-fill"
        style={{
          height: '100%',
          background: 'linear-gradient(90deg, #7c4dff, #26c6da)',
          borderRadius: '4px',
          width: '0%',
          transition: 'width 0.5s ease'
        }}
      />
    </div>
  )
}

// 控制按钮组件
const ControlButton = ({ onClick, disabled, variant, children, icon }) => {
  const buttonRef = useRef(null)

  const handleClick = () => {
    if (!disabled && onClick) {
      // 点击动画
      if (buttonRef.current) {
        gsap.to(buttonRef.current, {
          scale: 0.95,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut"
        })
      }
      onClick()
    }
  }

  const getButtonStyle = () => {
    const baseStyle = {
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '14px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      opacity: disabled ? 0.5 : 1
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #7c4dff, #536dfe)',
          boxShadow: '0 4px 15px rgba(124, 77, 255, 0.3)'
        }
      case 'secondary':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #26c6da, #00bcd4)',
          boxShadow: '0 4px 15px rgba(38, 198, 218, 0.3)'
        }
      case 'danger':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #f44336, #e91e63)',
          boxShadow: '0 4px 15px rgba(244, 67, 54, 0.3)'
        }
      case 'success':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
          boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
        }
      default:
        return {
          ...baseStyle,
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }
    }
  }

  return (
    <button
      ref={buttonRef}
      style={getButtonStyle()}
      onClick={handleClick}
      disabled={disabled}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  )
}

// 主要的流程控制器组件
export default function ProcessController({
  currentStep,
  isTraining,
  trainingData,
  onStepChange,
  onTrainingToggle,
  onReset,
  onSpeedChange,
  speed = 1
}) {
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [autoProgress, setAutoProgress] = useState(false)
  const controllerRef = useRef(null)

  // 步骤定义
  const steps = [
    {
      title: '噪声采样',
      description: '从随机分布采样噪声向量',
      icon: '🎲'
    },
    {
      title: '生成器处理',
      description: '将噪声转换为假图像',
      icon: '🎨'
    },
    {
      title: '判别器处理',
      description: '判别真假图像',
      icon: '🔍'
    },
    {
      title: '损失计算',
      description: '计算损失并更新参数',
      icon: '📊'
    }
  ]

  // 自动进度控制
  useEffect(() => {
    if (!autoProgress || !isTraining) return

    const interval = setInterval(() => {
      const nextStep = (currentStep + 1) % steps.length
      if (nextStep === 0) {
        setCompletedSteps(new Set([0, 1, 2, 3]))
      }
      // 使用回调函数通知父组件步骤变化
      if (onStepChange) {
        onStepChange(nextStep)
      }
    }, 2000 / speed)

    return () => clearInterval(interval)
  }, [autoProgress, isTraining, speed, steps.length, currentStep, onStepChange])

  // 标记完成的步骤
  useEffect(() => {
    if (currentStep > 0) {
      setCompletedSteps(prev => new Set([...prev, currentStep - 1]))
    }
  }, [currentStep])

  // 处理步骤点击
  const handleStepClick = useCallback((step) => {
    if (onStepChange) {
      onStepChange(step)
    }
  }, [onStepChange])

  // 处理训练切换
  const handleTrainingToggle = useCallback(() => {
    if (onTrainingToggle) {
      onTrainingToggle()
    }
  }, [onTrainingToggle])

  // 处理重置
  const handleReset = useCallback(() => {
    setCompletedSteps(new Set())
    setAutoProgress(false)
    if (onReset) {
      onReset()
    }
  }, [onReset])

  // 处理速度变化
  const handleSpeedChange = useCallback((newSpeed) => {
    if (onSpeedChange) {
      onSpeedChange(newSpeed)
    }
  }, [onSpeedChange])

  // 计算总进度
  const totalProgress = ((currentStep + 1) / steps.length) * 100

  return (
    <div 
      ref={controllerRef}
      className="process-controller"
      style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,60,0.8) 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}
    >
      {/* 标题和状态 */}
      <div className="controller-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            GAN 训练流程控制
          </h3>
          <p style={{ margin: '5px 0 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            控制和监控GAN训练的每个步骤
          </p>
        </div>
        <div className="status-indicator" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          background: isTraining ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 193, 7, 0.2)',
          borderRadius: '20px',
          border: `1px solid ${isTraining ? '#4caf50' : '#ffc107'}`
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isTraining ? '#4caf50' : '#ffc107'
          }} />
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {isTraining ? '训练中' : '已暂停'}
          </span>
        </div>
      </div>

      {/* 进度条 */}
      <ProgressBar progress={totalProgress} isAnimating={isTraining} />

      {/* 步骤指示器 */}
      <div className="steps-container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '24px',
        overflowX: 'auto',
        padding: '10px 0'
      }}>
        {steps.map((step, index) => (
          <StepIndicator
            key={index}
            step={index}
            currentStep={currentStep}
            isCompleted={completedSteps.has(index)}
            onClick={handleStepClick}
            title={step.title}
            description={step.description}
          />
        ))}
      </div>

      {/* 训练指标 */}
      {trainingData && (
        <div className="training-metrics" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px'
        }}>
          <div className="metric-item">
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>训练轮次</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c4dff' }}>
              {trainingData.currentEpoch || 0}
            </div>
          </div>
          <div className="metric-item">
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>生成器损失</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#26c6da' }}>
              {trainingData.generatorLoss || '0.000'}
            </div>
          </div>
          <div className="metric-item">
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>判别器损失</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffa726' }}>
              {trainingData.discriminatorLoss || '0.000'}
            </div>
          </div>
          <div className="metric-item">
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>训练进度</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4caf50' }}>
              {trainingData.trainingProgress ? `${trainingData.trainingProgress.toFixed(1)}%` : '0%'}
            </div>
          </div>
        </div>
      )}

      {/* 控制按钮 */}
      <div className="control-buttons" style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <ControlButton
          variant={isTraining ? 'danger' : 'primary'}
          onClick={handleTrainingToggle}
          icon={isTraining ? '⏸️' : '▶️'}
        >
          {isTraining ? '暂停训练' : '开始训练'}
        </ControlButton>

        <ControlButton
          variant="secondary"
          onClick={() => setAutoProgress(!autoProgress)}
          icon={autoProgress ? '🔄' : '⏭️'}
        >
          {autoProgress ? '关闭自动' : '自动进步'}
        </ControlButton>

        <ControlButton
          variant="default"
          onClick={handleReset}
          icon="🔄"
        >
          重置
        </ControlButton>

        {/* 速度控制 */}
        <div className="speed-control" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginLeft: 'auto'
        }}>
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>速度:</span>
          <select
            value={speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: 'white',
              padding: '6px 12px',
              fontSize: '14px'
            }}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      </div>

      {/* 当前步骤详情 */}
      <div className="current-step-details" style={{
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(124, 77, 255, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(124, 77, 255, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>{steps[currentStep].icon}</span>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
            当前步骤: {steps[currentStep].title}
          </h4>
        </div>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
          {steps[currentStep].description}
        </p>
      </div>
    </div>
  )
}
