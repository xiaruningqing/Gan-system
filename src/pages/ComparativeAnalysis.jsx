import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './ComparativeAnalysis.css'
import exampleCTImage from '../assets/images/Covid (1000).png'
import ProcessingPipeline from '../components/ProcessingPipeline'
import ProcessFlowVisualization from '../components/ProcessFlowVisualization'
import DataFlowAnimation from '../components/DataFlowAnimation'
import ProcessController from '../components/ProcessController'
import ImageEnhancementFlow from '../components/ImageEnhancementFlow'
import ErrorBoundary from '../components/ErrorBoundary'

// 生成数字图案数据的辅助函数
const generateDigitPattern = (digit, quality) => {
  const patterns = {
    0: ["  ████████  ", " ██      ██ ", "██        ██", "██        ██", "██        ██", "██        ██", "██        ██", " ██      ██ ", "  ████████  "],
    1: ["    ██    ", "  ████    ", "    ██    ", "    ██    ", "    ██    ", "    ██    ", "    ██    ", "    ██    ", "  ██████  "],
    2: ["  ████████  ", " ██      ██ ", "          ██", "        ██  ", "      ██    ", "    ██      ", "  ██        ", " ██      ██ ", "████████████"],
    3: ["  ████████  ", " ██      ██ ", "          ██", "    ██████  ", "          ██", "          ██", "          ██", " ██      ██ ", "  ████████  "],
    4: ["██        ██", "██        ██", "██        ██", "██        ██", "████████████", "          ██", "          ██", "          ██", "          ██"],
    5: ["████████████", "██          ", "██          ", "██████████  ", "          ██", "          ██", "          ██", " ██      ██ ", "  ████████  "],
    6: ["  ████████  ", " ██      ██ ", "██          ", "██████████  ", "██        ██", "██        ██", "██        ██", " ██      ██ ", "  ████████  "],
    7: ["████████████", "          ██", "        ██  ", "      ██    ", "    ██      ", "  ██        ", "██          ", "██          ", "██          "],
    8: ["  ████████  ", " ██      ██ ", "██        ██", " ██      ██ ", "  ████████  ", " ██      ██ ", "██        ██", " ██      ██ ", "  ████████  "],
    9: ["  ████████  ", " ██      ██ ", "██        ██", "██        ██", " ██████████ ", "          ██", "          ██", " ██      ██ ", "  ████████  "]
  }

  let pattern = patterns[digit] || patterns[0]
  
  if (quality < 1) {
    pattern = pattern.map(row => {
      return row.split('').map(char => {
        if (char === '█' && Math.random() > quality) {
          return Math.random() > 0.5 ? '▓' : ' '
        }
        if (char === ' ' && Math.random() > quality * 0.8) {
          return Math.random() > 0.7 ? '▓' : '█'
        }
        return char
      }).join('')
    })
  }
  
  return pattern
}



export default function GanApplications() {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedApplication, setSelectedApplication] = useState('medical')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUsingExample, setIsUsingExample] = useState(false)
  

  
  // GAN流程可视化状态
  const [showGanFlow, setShowGanFlow] = useState(true)
  const [showDataFlow, setShowDataFlow] = useState(true)
  const [isGanFullscreen, setIsGanFullscreen] = useState(false)
  const [ganFlowStep, setGanFlowStep] = useState(0)
  const [isGanFlowActive, setIsGanFlowActive] = useState(false)
  const [ganProcessingData, setGanProcessingData] = useState(null)
  const [showGanConfirmDialog, setShowGanConfirmDialog] = useState(false)
  

  
  // GAN训练动画函数
  const startGanTrainingAnimation = () => {
    const steps = [0, 1, 2, 3, 4]
    let currentStepIndex = 0
    
    const animateStep = () => {
      if (currentStepIndex < steps.length) {
        setGanFlowStep(steps[currentStepIndex])
        
        // 模拟训练数据
        const mockTrainingData = {
          epoch: currentStepIndex + 1,
          totalEpochs: 5,
          generatorLoss: (4.0 - (currentStepIndex / 4) * 3.5 + Math.random() * 0.5).toFixed(4),
          discriminatorLoss: (0.8 - (currentStepIndex / 4) * 0.3 + Math.random() * 0.2).toFixed(4),
          trainingProgress: ((currentStepIndex + 1) / 5) * 100
        }
        
        setGanProcessingData(mockTrainingData)
        
        setTimeout(() => {
          currentStepIndex++
          animateStep()
        }, 2000) // 每步2秒
      } else {
        // 动画完成，延迟退出全屏
        setTimeout(() => {
          setIsGanFullscreen(false)
          // 保持GAN流程激活状态，让用户可以继续查看结果
          // setIsGanFlowActive(false) // 注释掉，保持激活
        }, 2000)
      }
    }
    
    animateStep()
  }
  
  // 退出全屏回调
  const handleExitFullscreen = () => {
    setIsGanFullscreen(false)
    setIsGanFlowActive(false)
  }
  
  // ESC键退出全屏
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isGanFullscreen) {
        handleExitFullscreen()
      }
    }
    
    if (isGanFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isGanFullscreen])
  
  // 图像增强流程状态
  const [showEnhancementFlow, setShowEnhancementFlow] = useState(false)
  const [enhancementStep, setEnhancementStep] = useState(0)
  const [isEnhancementActive, setIsEnhancementActive] = useState(false)

  const applications = {
    medical: {
      title: '医疗影像增强',
      subtitle: 'Medical Image Enhancement',
      problem: '低分辨率医疗影像影响诊断准确性',
      solution: '使用Super-Resolution GAN提升影像质量',
      description: '在医疗诊断中，高质量的影像对于准确诊断至关重要。传统的低分辨率影像可能导致细节丢失，影响医生的判断。',
      icon: '🏥',
      color: '#e74c3c',
      steps: [
        { title: '输入低分辨率影像', desc: '获取原始医疗扫描图像', icon: '📷' },
        { title: 'GAN预处理', desc: '图像标准化和噪声去除', icon: '🔧' },
        { title: '超分辨率生成', desc: 'SRGAN生成高分辨率图像', icon: '🎯' },
        { title: '质量评估', desc: '医学专家验证增强效果', icon: '✅' }
      ],
      metrics: {
        resolution: '4x提升',
        accuracy: '95.2%',
        time: '0.3秒',
        satisfaction: '98%'
      },
      beforeAfter: {
        before: '64×64像素，细节模糊',
        after: '256×256像素，细节清晰'
      },
      processingDescription: '使用Super-Resolution GAN提升影像分辨率和对比度，增强病灶可见度'
    },

  }

  const currentApp = applications[selectedApplication]

  // 示例CT扫描图片 - 使用真实的CT扫描图像

  // 使用示例图片
  const useExampleImage = () => {
    setUploadedImage(exampleCTImage)
    setProcessedImage(null)
    setShowResults(false)
    setIsUsingExample(true)
  }

  useEffect(() => {
    let interval
    if (isProcessing) {
      interval = setInterval(() => {
        setProcessingStep(prev => {
          if (prev >= currentApp.steps.length - 1) {
            setIsProcessing(false)
            setShowResults(true)
            // 如果有上传的图片，生成处理后的图片
            if (uploadedImage) {
              setTimeout(() => {
                simulateImageProcessing()
              }, 500)
            }
            return prev
          }
          return prev + 1
        })
      }, 1500)
    }
    return () => clearInterval(interval)
  }, [isProcessing, currentApp.steps.length, uploadedImage])

  const handleStartDemo = () => {
    // 显示GAN流程图确认对话框
    setShowGanConfirmDialog(true)
  }
  
  // 确认进入GAN流程图演示
  const handleConfirmGanDemo = () => {
    setShowGanConfirmDialog(false)
    setIsProcessing(true)
    setShowResults(false)
    setProcessingStep(0)
    
    // 启动全屏GAN流程可视化
    setShowGanFlow(true)
    setIsGanFlowActive(true)
    setGanFlowStep(0)
    setIsGanFullscreen(true) // 立即进入全屏模式
    
    // 开始GAN训练动画
    startGanTrainingAnimation()
    
    // 同时启动原有的处理模拟（在后台运行）
    startGanProcessingSimulation()
  }
  
  // 取消GAN流程图演示，执行原有的处理流程
  const handleCancelGanDemo = () => {
    setShowGanConfirmDialog(false)
    setIsProcessing(true)
    setShowResults(false)
    setProcessingStep(0)
    
    // 只启动原有的处理模拟，不进入全屏
    startGanProcessingSimulation()
  }

  // GAN处理模拟（非训练，而是处理单张图片）
  const startGanProcessingSimulation = () => {
    const steps = ['数据输入', '生成器处理', '判别器验证', '输出结果']
    let currentStep = 0
    
    const processStep = () => {
      if (currentStep < steps.length) {
        setGanFlowStep(currentStep)
        
        // 模拟每个步骤的处理数据
        const stepData = {
          stepName: steps[currentStep],
          isProcessing: true,
          progress: ((currentStep + 1) / steps.length) * 100
        }
        
        // 如果是最后一步，生成结果图像
        if (currentStep === steps.length - 1) {
          const resultImage = generateProcessedImage()
          stepData.resultImage = resultImage
          stepData.isComplete = true
        }
        
        setGanProcessingData(stepData)
        
        setTimeout(() => {
          currentStep++
          if (currentStep < steps.length) {
            processStep()
          } else {
            // 处理完成
            setIsGanFlowActive(false)
            setGanProcessingData(prev => ({
              ...prev,
              isProcessing: false,
              isComplete: true
            }))
          }
        }, 1500) // 每步1.5秒
      }
    }
    
    processStep()
  }
  
  // 生成处理后的图像结果
  const generateProcessedImage = () => {
    // 根据当前选择的应用类型生成相应的结果
    if (selectedApplication === 'medical') {
      return generateEnhancedMedicalImage()
    }
    return generateDigitPattern(Math.floor(Math.random() * 10), 0.9)
  }
  
  // 生成增强的医疗图像
  const generateEnhancedMedicalImage = () => {
    return [
      "████████████████",
      "██            ██",
      "██  ████████  ██",
      "██  ██    ██  ██",
      "██  ██ ██ ██  ██",
      "██  ██    ██  ██",
      "██  ████████  ██",
      "██            ██",
      "██  ████████  ██",
      "██  ██    ██  ██",
      "██  ██ ██ ██  ██",
      "██  ██    ██  ██",
      "██  ████████  ██",
      "██            ██",
      "██            ██",
      "████████████████"
    ]
  }

  // 生成MNIST风格的图像数据
  const generateMNISTImages = (quality) => {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    return Array.from({ length: 5 }, (_, i) => {
      const digit = digits[Math.floor(Math.random() * digits.length)]
      return {
        id: i,
        digit: digit,
        quality: quality,
        data: generateDigitPattern(digit, quality)
      }
    })
  }





  // 处理流程回调函数 - 增强版本
  const handleFlowStepComplete = useCallback((stepId, stepIndex) => {
    try {
      // 安全地更新状态
      if (typeof stepIndex === 'number' && stepIndex >= 0) {
        setCurrentFlowStep(stepIndex)
      }
      
      // 检查是否是最后一步
      if (stepIndex >= 2) { // 最后一步完成 (索引从0开始，所以2是第3步)
        const timeoutId = setTimeout(() => {
          try {
            setIsFlowActive(false)
            setCurrentFlowStep(0) // 重置步骤
            console.log('处理流程已完成')
          } catch (error) {
            console.error('完成流程时出错:', error)
          }
        }, 1500) // 增加延迟时间确保动画完成
        
        // 清理timeout的引用
        return () => clearTimeout(timeoutId)
      }
    } catch (error) {
      console.error('处理流程步骤完成时出错:', error)
      // 发生错误时安全地重置状态
      try {
        setIsFlowActive(false)
        setCurrentFlowStep(0)
      } catch (resetError) {
        console.error('重置状态时出错:', resetError)
        // 如果连重置都失败，刷新页面
        window.location.reload()
      }
    }
  }, [])

  const handleReset = () => {
    setIsProcessing(false)
    setShowResults(false)
    setProcessingStep(0)
    setUploadedImage(null)
    setProcessedImage(null)
    setIsUsingExample(false)

    
    // 重置GAN流程状态
    setIsGanFlowActive(false)
    setGanFlowStep(0)
    setGanProcessingData(null)
    
    // 重置图像增强流程状态
    setShowEnhancementFlow(false)
    setEnhancementStep(0)
    setIsEnhancementActive(false)
  }



  // 图片上传处理
  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target.result)
        setProcessedImage(null)
        setShowResults(false)
        setIsUsingExample(false) // 清除示例图片状态
      }
      reader.readAsDataURL(file)
    }
  }

  // 拖拽处理
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files[0])
    }
  }

  // 文件选择处理
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  // 模拟图片处理
  const simulateImageProcessing = () => {
    if (!uploadedImage) return

    // 创建canvas来模拟图片处理效果
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // 绘制原图
      ctx.drawImage(img, 0, 0)
      
      // 根据不同应用类型应用不同的滤镜效果
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      switch (selectedApplication) {
        case 'medical':
          // 医疗影像增强：增加对比度和锐化，提升细节可见度
          for (let i = 0; i < data.length; i += 4) {
            // 增强对比度
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.4 + 128))
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.4 + 128))
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.4 + 128))
          }
          break

      }
      
      ctx.putImageData(imageData, 0, 0)
      setProcessedImage(canvas.toDataURL())
    }
    
    img.src = uploadedImage
  }

  return (
    <div className="applications-container">
      <div className="applications-header">
        <h1>GAN 实际应用</h1>
        <p className="applications-subtitle">
          探索生成对抗网络在各个领域的创新应用，体验AI技术如何解决现实问题
        </p>
      </div>

      {/* 应用选择器 */}
      <div className="application-selector">
        {Object.entries(applications).map(([key, app]) => (
          <div
            key={key}
            className={`app-tab ${selectedApplication === key ? 'active' : ''}`}
            onClick={() => {
              setSelectedApplication(key)
              handleReset()
            }}
            style={{ '--app-color': app.color }}
          >
            <div className="app-icon">{app.icon}</div>
            <div className="app-info">
              <h3>{app.title}</h3>
              <p>{app.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 应用详情 */}
      <div className="application-detail">
        <div className="app-overview">
          <div className="problem-solution">
            <div className="problem-card">
              <h3>🚨 问题场景</h3>
              <p>{currentApp.problem}</p>
            </div>
            <div className="arrow">→</div>
            <div className="solution-card">
              <h3>💡 GAN解决方案</h3>
              <p>{currentApp.solution}</p>
            </div>
          </div>
          <div className="app-description">
            <p>{currentApp.description}</p>
          </div>
        </div>

        

        {/* GAN处理流程可视化 */}
        <div className="gan-flow-visualization-section">
          <div className="gan-flow-header">
            <h3>GAN 处理流程图</h3>
            <p>实时展示生成对抗网络的图像处理过程</p>
            
            {/* 可视化控制面板 */}
            <div className="gan-visualization-controls">
              <div className="control-group">
                <label className="control-label">
                  <input
                    type="checkbox"
                    checked={showGanFlow}
                    onChange={(e) => setShowGanFlow(e.target.checked)}
                  />
                  显示流程图
                </label>
                <label className="control-label">
                  <input
                    type="checkbox"
                    checked={showDataFlow}
                    onChange={(e) => setShowDataFlow(e.target.checked)}
                  />
                  显示数据流动画
                </label>
              </div>
            </div>
          </div>

          {/* GAN流程可视化组件 */}
          {(showGanFlow || showDataFlow) && (
            <div className="gan-visualization-layout">
              {/* 可视化组件容器 */}
              <div className="gan-visualization-components">
                {showGanFlow && (
                  <div className="gan-process-flow-container">
                    <ErrorBoundary>
                      <ProcessFlowVisualization
                        currentStep={ganFlowStep}
                        isTraining={isGanFlowActive}
                        trainingData={ganProcessingData}
                        onStepChange={setGanFlowStep}
                        isFullscreen={isGanFullscreen}
                        onExitFullscreen={handleExitFullscreen}
                      />
                    </ErrorBoundary>
                  </div>
                )}
                
                {showDataFlow && (
                  <div className="gan-data-flow-container">
                    <ErrorBoundary>
                      <DataFlowAnimation
                        currentStep={ganFlowStep}
                        isTraining={isGanFlowActive}
                        trainingData={ganProcessingData}
                      />
                    </ErrorBoundary>
                </div>
                )}
              </div>
          </div>
          )}
        </div>

        {/* 图像增强流程可视化 */}
        {selectedApplication === 'medical' && showEnhancementFlow && (
          <div className="enhancement-flow-section">
            <div className="enhancement-flow-header">
              <h3>SRGAN 图像增强详细流程</h3>
              <p>Super-Resolution GAN 医疗影像超分辨率增强技术的完整处理流程</p>
              
              <div className="enhancement-controls">
                <button 
                  className={`enhancement-btn ${isEnhancementActive ? 'stop' : 'start'}`}
                  onClick={() => {
                    setIsEnhancementActive(!isEnhancementActive)
                    if (!isEnhancementActive) {
                      // 启动增强流程演示
                      setEnhancementStep(0)
                      const interval = setInterval(() => {
                        setEnhancementStep(prev => {
                          if (prev >= 4) {
                            clearInterval(interval)
                            setIsEnhancementActive(false)
                            return 0
                          }
                          return prev + 1
                        })
                      }, 2000)
                    }
                  }}
                >
                  {isEnhancementActive ? '⏹️ 停止演示' : '▶️ 开始演示'}
                </button>
                
                <div className="enhancement-speed-control">
                  <label>演示速度:</label>
                  <select defaultValue="normal">
                    <option value="slow">慢速</option>
                    <option value="normal">正常</option>
                    <option value="fast">快速</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="enhancement-flow-container">
              <ImageEnhancementFlow
                currentStep={enhancementStep}
                onStepChange={setEnhancementStep}
                enhancementData={{
                  isActive: isEnhancementActive,
                  inputImage: uploadedImage,
                  processingStep: enhancementStep
                }}
              />
            </div>
          </div>
        )}

        {/* 图片上传区域 */}
        <div className="image-upload-section">
          <h3>上传图片体验</h3>
          
          {/* 示例图片按钮 */}
          {!uploadedImage && (
            <div className="example-image-section">
              <button 
                className="example-btn"
                onClick={useExampleImage}
              >
                🏥 使用示例CT扫描图片
              </button>
              <p className="example-description">
                点击使用真实的CT扫描图片进行演示，或上传您自己的图片
              </p>
            </div>
          )}
          
          <div 
            className={`upload-area ${isDragOver ? 'drag-over' : ''} ${uploadedImage ? 'has-image' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            {uploadedImage ? (
              <div className="uploaded-image-preview">
                <img src={uploadedImage} alt="上传的图片" />
                <div className="upload-overlay">
                  <span>{isUsingExample ? '点击更换图片' : '点击或拖拽更换图片'}</span>
                  {isUsingExample && (
                    <div className="example-badge">示例图片</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📷</div>
                <h4>上传图片</h4>
                <p>点击选择或拖拽图片到此处</p>
                <small>支持 JPG, PNG, GIF 格式</small>
              </div>
            )}
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* 演示控制 */}
        <div className="demo-controls">
          <button
            className={`demo-btn ${isProcessing ? 'processing' : 'start'}`}
            onClick={handleStartDemo}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="spinner"></span>
                处理中... ({processingStep + 1}/{currentApp.steps.length})
              </>
            ) : (
              <>
                <span>▶️</span>
                {uploadedImage ? (isUsingExample ? '开始处理示例图片' : '开始处理图片') : '开始演示'}
              </>
            )}
          </button>
          <button className="reset-btn" onClick={handleReset}>
            🔄 重置
          </button>
          
          {selectedApplication === 'medical' && (
            <button 
              className={`enhancement-flow-btn ${showEnhancementFlow ? 'active' : ''}`}
              onClick={() => setShowEnhancementFlow(!showEnhancementFlow)}
            >
              {showEnhancementFlow ? '🔍 隐藏增强流程' : '🔍 显示增强流程'}
            </button>
          )}
        </div>

        {/* 结果展示 */}
        {showResults && (
          <div className="results-panel">
            <h3>处理结果</h3>
            {uploadedImage && (
              <div className="processing-description">
                <p>{currentApp.processingDescription}</p>
              </div>
            )}
            <div className="results-grid">
              <div className="before-after">
                <div className="before">
                  <h4>处理前</h4>
                  {uploadedImage ? (
                    <div className="result-image-container">
                      <img src={uploadedImage} alt="原始图片" className="result-image" />
                      <div className="image-info">
                        <span className="quality-badge original">
                          {selectedApplication === 'medical' ? '原始影像' : '原始照片'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="result-placeholder before-img">
                      <span>📷</span>
                      <p>{currentApp.beforeAfter.before}</p>
                    </div>
                  )}
                </div>
                <div className="after">
                  <h4>处理后</h4>
                  {processedImage ? (
                    <div className="result-image-container">
                      <img src={processedImage} alt="处理后图片" className="result-image" />
                      <div className="image-info">
                        <span className="quality-badge enhanced">
                          增强影像
                        </span>
                      </div>
                    </div>
                  ) : uploadedImage ? (
                    <div className="result-placeholder processing-img">
                      <span className="processing-spinner">⏳</span>
                      <p>
                        正在增强医疗影像...
                      </p>
                    </div>
                  ) : (
                    <div className="result-placeholder after-img">
                      <span>✨</span>
                      <p>{currentApp.beforeAfter.after}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="metrics-display">
                <h4>性能指标</h4>
                <div className="metrics-grid">
                  {Object.entries(currentApp.metrics).map(([key, value]) => (
                    <div key={key} className="metric-item">
                      <span className="metric-label">
                        {key === 'resolution' && '分辨率提升'}
                        {key === 'accuracy' && '准确率'}
                        {key === 'time' && '处理时间'}
                        {key === 'satisfaction' && '用户满意度'}
                        {key === 'styles' && '可用风格'}
                        {key === 'quality' && '质量评分'}
                        {key === 'novelty' && '创新度'}
                      </span>
                      <span className="metric-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GAN超分辨率技术详解 */}
      <div className="gan-tech-details">
        <h3>GAN超分辨率技术详解</h3>
        <div className="tech-details-grid">
          <div className="tech-card" data-tech="medical">
            <div className="tech-icon">🏥</div>
            <h4>医疗图像预处理</h4>
            <div className="tech-specs">
              <div className="spec-item">
                <span className="spec-label">DICOM解析:</span>
                <span className="spec-value">医疗图像标准格式解析</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">噪声去除:</span>
                <span className="spec-value">使用Non-local means滤波</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">对比度增强:</span>
                <span className="spec-value">自适应直方图均衡化</span>
              </div>
            </div>
          </div>
          
          <div className="tech-card" data-tech="esrgan">
            <div className="tech-icon">🧠</div>
            <h4>ESRGAN网络架构</h4>
            <div className="tech-specs">
              <div className="spec-item">
                <span className="spec-label">生成器:</span>
                <span className="spec-value">ResNet + Dense Block结构</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">判别器:</span>
                <span className="spec-value">VGG-based网络</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">损失函数:</span>
                <span className="spec-value">感知损失 + 对抗损失</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">上采样:</span>
                <span className="spec-value">4倍分辨率提升(256→1024)</span>
              </div>
            </div>
          </div>
          
          <div className="tech-card" data-tech="optimization">
            <div className="tech-icon">⚡</div>
            <h4>后处理与优化</h4>
            <div className="tech-specs">
              <div className="spec-item">
                <span className="spec-label">边缘增强:</span>
                <span className="spec-value">Unsharp masking技术</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">保真去噪:</span>
                <span className="spec-value">小波变换处理</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">特征保护:</span>
                <span className="spec-value">结构保真分析</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">细节恢复:</span>
                <span className="spec-value">多尺度特征融合</span>
              </div>
            </div>
          </div>
          
          <div className="tech-card" data-tech="evaluation">
            <div className="tech-icon">📊</div>
            <h4>医疗效果量评估</h4>
            <div className="tech-specs">
              <div className="spec-item">
                <span className="spec-label">客观指标:</span>
                <span className="spec-value">PSNR &gt; 35dB, SSIM &gt; 0.9</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">感知质量:</span>
                <span className="spec-value">LPIPS &lt; 0.1</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">临床验证:</span>
                <span className="spec-value">放射科医师评估</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">标准合规:</span>
                <span className="spec-value">FDA医疗器械标准</span>
              </div>
            </div>
          </div>
          
          <div className="tech-card" data-tech="performance">
            <div className="tech-icon">🚀</div>
            <h4>性能与效率</h4>
            <div className="tech-specs">
              <div className="spec-item">
                <span className="spec-label">处理速度:</span>
                <span className="spec-value">单张图像 &lt; 3秒</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">GPU加速:</span>
                <span className="spec-value">CUDA并行计算</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">内存占用:</span>
                <span className="spec-value">&lt; 4GB VRAM</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">批处理:</span>
                <span className="spec-value">支持多图像并行处理</span>
              </div>
            </div>
          </div>
          
          <div className="tech-card" data-tech="applications">
            <div className="tech-icon">🔬</div>
            <h4>临床应用场景</h4>
            <div className="tech-specs">
              <div className="spec-item">
                <span className="spec-label">CT增强:</span>
                <span className="spec-value">肺部、腹部影像增强</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">MRI优化:</span>
                <span className="spec-value">脑部、脊椎结构分析</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">X光片:</span>
                <span className="spec-value">骨折、肺炎诊断</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">超声波:</span>
                <span className="spec-value">胎儿发育监测</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 技术优势对比 */}
      <div className="tech-comparison">
        <h3>技术优势对比</h3>
        <div className="comparison-container">
          <div className="comparison-table-enhanced">
            {/* 表格头部 */}
            <div className="table-header">
              <div className="header-cell metric-header">
                <div className="header-icon">📊</div>
                <span>评估指标</span>
              </div>
              <div className="header-cell method-header traditional-header">
                <div className="method-badge traditional-badge">
                  <div className="badge-icon">🔧</div>
                  <div className="badge-content">
                    <div className="method-name">传统插值</div>
                    <div className="method-desc">双线性/双三次</div>
                  </div>
                </div>
              </div>
              <div className="header-cell method-header deep-learning-header">
                <div className="method-badge deep-learning-badge">
                  <div className="badge-icon">🧠</div>
                  <div className="badge-content">
                    <div className="method-name">深度学习</div>
                    <div className="method-desc">CNN/ResNet</div>
                  </div>
                </div>
              </div>
              <div className="header-cell method-header gan-header">
                <div className="method-badge gan-badge">
                  <div className="badge-icon">⚡</div>
                  <div className="badge-content">
                    <div className="method-name">GAN超分辨率</div>
                    <div className="method-desc">ESRGAN/SRGAN</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 图像质量行 */}
            <div className="table-row" data-metric="quality">
              <div className="metric-cell">
                <div className="metric-icon">🖼️</div>
                <div className="metric-info">
                  <div className="metric-name">图像质量</div>
                  <div className="metric-desc">PSNR/SSIM指标</div>
                </div>
              </div>
              <div className="value-cell traditional-cell">
                <div className="score-display">
                  <div className="stars">⭐⭐</div>
                  <div className="score-text">一般</div>
                  <div className="score-number">2.0/5.0</div>
                </div>
              </div>
              <div className="value-cell deep-learning-cell">
                <div className="score-display">
                  <div className="stars">⭐⭐⭐</div>
                  <div className="score-text">良好</div>
                  <div className="score-number">3.5/5.0</div>
                </div>
              </div>
              <div className="value-cell gan-cell">
                <div className="score-display">
                  <div className="stars">⭐⭐⭐⭐⭐</div>
                  <div className="score-text">优秀</div>
                  <div className="score-number">4.8/5.0</div>
                </div>
              </div>
            </div>

            {/* 细节保持行 */}
            <div className="table-row" data-metric="detail">
              <div className="metric-cell">
                <div className="metric-icon">🔍</div>
                <div className="metric-info">
                  <div className="metric-name">细节保持</div>
                  <div className="metric-desc">边缘清晰度</div>
                </div>
              </div>
              <div className="value-cell traditional-cell">
                <div className="score-display">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '30%'}}></div>
                  </div>
                  <div className="score-text">差</div>
                  <div className="score-number">30%</div>
                </div>
              </div>
              <div className="value-cell deep-learning-cell">
                <div className="score-display">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '70%'}}></div>
                  </div>
                  <div className="score-text">良好</div>
                  <div className="score-number">70%</div>
                </div>
              </div>
              <div className="value-cell gan-cell">
                <div className="score-display">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '95%'}}></div>
                  </div>
                  <div className="score-text">优秀</div>
                  <div className="score-number">95%</div>
                </div>
              </div>
            </div>

            {/* 处理速度行 */}
            <div className="table-row" data-metric="speed">
              <div className="metric-cell">
                <div className="metric-icon">⚡</div>
                <div className="metric-info">
                  <div className="metric-name">处理速度</div>
                  <div className="metric-desc">单张图像耗时</div>
                </div>
              </div>
              <div className="value-cell traditional-cell">
                <div className="score-display">
                  <div className="speed-indicator fast">
                    <div className="speed-icon">🚀</div>
                    <div className="speed-text">快</div>
                  </div>
                  <div className="score-number">&lt;0.1s</div>
                </div>
              </div>
              <div className="value-cell deep-learning-cell">
                <div className="score-display">
                  <div className="speed-indicator medium">
                    <div className="speed-icon">🚶</div>
                    <div className="speed-text">中等</div>
                  </div>
                  <div className="score-number">1-2s</div>
                </div>
              </div>
              <div className="value-cell gan-cell">
                <div className="score-display">
                  <div className="speed-indicator fast">
                    <div className="speed-icon">⚡</div>
                    <div className="speed-text">快</div>
                  </div>
                  <div className="score-number">&lt;3s</div>
                </div>
              </div>
            </div>

            {/* 医疗适用性行 */}
            <div className="table-row" data-metric="medical">
              <div className="metric-cell">
                <div className="metric-icon">🏥</div>
                <div className="metric-info">
                  <div className="metric-name">医疗适用性</div>
                  <div className="metric-desc">临床应用价值</div>
                </div>
              </div>
              <div className="value-cell traditional-cell">
                <div className="score-display">
                  <div className="medical-rating low">
                    <div className="rating-icon">❌</div>
                    <div className="rating-text">低</div>
                  </div>
                  <div className="score-number">不推荐</div>
                </div>
              </div>
              <div className="value-cell deep-learning-cell">
                <div className="score-display">
                  <div className="medical-rating medium">
                    <div className="rating-icon">⚠️</div>
                    <div className="rating-text">中等</div>
                  </div>
                  <div className="score-number">可考虑</div>
                </div>
              </div>
              <div className="value-cell gan-cell">
                <div className="score-display">
                  <div className="medical-rating high">
                    <div className="rating-icon">✅</div>
                    <div className="rating-text">高</div>
                  </div>
                  <div className="score-number">强烈推荐</div>
                </div>
              </div>
            </div>

            {/* 综合评分行 */}
            <div className="table-row summary-row" data-metric="overall">
              <div className="metric-cell">
                <div className="metric-icon">🏆</div>
                <div className="metric-info">
                  <div className="metric-name">综合评分</div>
                  <div className="metric-desc">整体表现</div>
                </div>
              </div>
              <div className="value-cell traditional-cell">
                <div className="overall-score">
                  <div className="score-circle traditional-score">
                    <span>2.5</span>
                  </div>
                  <div className="score-label">基础级</div>
                </div>
              </div>
              <div className="value-cell deep-learning-cell">
                <div className="overall-score">
                  <div className="score-circle deep-learning-score">
                    <span>3.8</span>
                  </div>
                  <div className="score-label">专业级</div>
                </div>
              </div>
              <div className="value-cell gan-cell">
                <div className="overall-score">
                  <div className="score-circle gan-score">
                    <span>4.9</span>
                  </div>
                  <div className="score-label">顶级</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* GAN流程图确认对话框 */}
      {showGanConfirmDialog && (
        <div className="gan-confirm-overlay">
          <div className="gan-confirm-dialog">
            <div className="dialog-header">
              <h3>🎬 GAN处理流程图演示</h3>
            </div>
            <div className="dialog-content">
              <p>是否要进入全屏GAN处理流程图演示？</p>
              <div className="dialog-features">
                <div className="feature-item">
                  <span className="feature-icon">🖥️</span>
                  <span>全屏沉浸式体验</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <span>实时动画演示</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔗</span>
                  <span>可视化数据流</span>
                </div>
              </div>
            </div>
            <div className="dialog-actions">
              <button 
                className="dialog-btn cancel"
                onClick={handleCancelGanDemo}
              >
                <span>❌</span>
                否，留在本页面
              </button>
              <button 
                className="dialog-btn confirm"
                onClick={handleConfirmGanDemo}
              >
                <span>✅</span>
                是，开始演示
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

