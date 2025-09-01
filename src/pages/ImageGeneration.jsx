import React, { useState, useCallback } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

import './ImageGeneration.css'

// 代码块数据 - 正确的执行顺序
const originalCodeBlocks = [
  {
    id: 'imports',
    order: 1,
    title: '导入依赖',
    description: '导入PyTorch和相关库',
    code: `import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import matplotlib.pyplot as plt
import numpy as np`
  },
  {
    id: 'data-prep',
    order: 2,
    title: '数据准备',
    description: '准备MNIST手写数字数据集',
    code: `# 数据预处理
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

# 加载MNIST数据集
train_data = datasets.MNIST(root='./data', train=True, download=True, transform=transform)
dataloader = DataLoader(train_data, batch_size=64, shuffle=True)`
  },
  {
    id: 'generator',
    order: 3,
    title: '定义生成器',
    description: '构建生成器神经网络',
    code: `class Generator(nn.Module):
    def __init__(self):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(100, 256),
            nn.LeakyReLU(0.2),
            nn.Linear(256, 512),
            nn.LeakyReLU(0.2),
            nn.Linear(512, 784),
            nn.Tanh()
        )
    
    def forward(self, z):
        return self.model(z).view(-1, 1, 28, 28)`
  },
  {
    id: 'discriminator',
    order: 4,
    title: '定义判别器',
    description: '构建判别器神经网络',
    code: `class Discriminator(nn.Module):
    def __init__(self):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(784, 512),
            nn.LeakyReLU(0.2),
            nn.Linear(512, 256),
            nn.LeakyReLU(0.2),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )
    
    def forward(self, img):
        return self.model(img.view(-1, 784))`
  },
  {
    id: 'initialization',
    order: 5,
    title: '初始化模型',
    description: '创建模型实例和优化器',
    code: `device = torch.device("cpu")
generator = Generator().to(device)
discriminator = Discriminator().to(device)
optimizer_G = optim.Adam(generator.parameters(), lr=0.0002)
optimizer_D = optim.Adam(discriminator.parameters(), lr=0.0002)
criterion = nn.BCELoss()`
  },
  {
    id: 'training',
    order: 6,
    title: '训练循环',
    description: '对抗训练主循环',
    code: `epochs = 14
fixed_noise = torch.randn(64, 100, device=device)

plt.ion()
for epoch in range(epochs):
    for i, (imgs, _) in enumerate(dataloader):
        # 训练判别器
        real_imgs = imgs.to(device)
        real_labels = torch.ones(imgs.size(0), 1, device=device)
        fake_labels = torch.zeros(imgs.size(0), 1, device=device)
        
        # 真实样本
        outputs = discriminator(real_imgs)
        d_loss_real = criterion(outputs, real_labels)
        
        # 生成样本
        z = torch.randn(imgs.size(0), 100, device=device)
        fake_imgs = generator(z)
        outputs = discriminator(fake_imgs.detach())
        d_loss_fake = criterion(outputs, fake_labels)
        
        # 更新判别器
        d_loss = d_loss_real + d_loss_fake
        optimizer_D.zero_grad()
        d_loss.backward()
        optimizer_D.step()
        
        # 训练生成器
        z = torch.randn(imgs.size(0), 100, device=device)
        fake_imgs = generator(z)
        outputs = discriminator(fake_imgs)
        g_loss = criterion(outputs, real_labels)
        
        # 更新生成器
        optimizer_G.zero_grad()
        g_loss.backward()
        optimizer_G.step()
    
    # 每轮显示生成结果
    with torch.no_grad():
        test_imgs = generator(fixed_noise).cpu()
        test_imgs = test_imgs / 2 + 0.5
    
    plt.clf()
    plt.imshow(torch.cat([test_imgs[j] for j in range(5)], dim=2).squeeze(), cmap='gray')
    plt.title(f"Epoch {epoch+1} | D Loss: {d_loss.item():.4f} | G Loss: {g_loss.item():.4f}")
    plt.axis('off')
    plt.pause(0.1)

plt.ioff()
plt.show()`
  }
]

// 生成随机排序的代码块
function generateRandomizedBlocks() {
  const shuffled = [...originalCodeBlocks]
  // Fisher-Yates 洗牌算法
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  // 分配随机数字
  const randomNumbers = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5)
  
  return shuffled.map((block, index) => ({
    ...block,
    displayNumber: randomNumbers[index],
    title: `${randomNumbers[index]}. ${block.title}`
  }))
}

// 可拖拽区域组件 - 工作区
function DroppableWorkspace({ children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'workspace-container',
  })

  const style = {
    opacity: isOver ? 0.8 : 1,
    backgroundColor: isOver ? 'rgba(124,77,255,0.1)' : 'transparent',
    borderColor: isOver ? 'rgba(124,77,255,0.5)' : 'rgba(255,255,255,0.2)',
    transform: isOver ? 'scale(1.02)' : 'scale(1)',
    transition: 'all 0.3s ease'
  }

  return (
    <div ref={setNodeRef} style={style} className="workspace-drop-zone">
      {children}
    </div>
  )
}

// 可拖拽区域组件 - 可用代码块区域
function DroppableAvailableBlocks({ children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'available-blocks-container',
  })

  const style = {
    opacity: isOver ? 0.9 : 1,
    backgroundColor: isOver ? 'rgba(26,188,156,0.1)' : 'transparent',
    transform: isOver ? 'scale(1.01)' : 'scale(1)',
    transition: 'all 0.3s ease'
  }

  return (
    <div ref={setNodeRef} style={style} className="available-blocks-area">
      {children}
    </div>
  )
}



// 可拖拽的代码卡片组件
function SortableCodeCard({ id, title, description, isInWorkspace, onMoveToWorkspace, onRemoveFromWorkspace }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`code-card ${isInWorkspace ? 'in-workspace' : ''}`}
    >
      <div className="card-header">
        <h4>{title}</h4>
        <button
          className="move-btn"
          onClick={(e) => {
            e.stopPropagation()
            if (isInWorkspace) {
              onRemoveFromWorkspace(id)
            } else {
              onMoveToWorkspace(id)
            }
          }}
        >
          {isInWorkspace ? '←' : '→'}
        </button>
      </div>
      <p className="card-description">{description}</p>
    </div>
  )
}

export default function ImageGeneration() {
  const [codeBlocks, setCodeBlocks] = useState(() => generateRandomizedBlocks())
  const [availableBlocks, setAvailableBlocks] = useState([])
  const [workspaceBlocks, setWorkspaceBlocks] = useState([])
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [runResults, setRunResults] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  // 固定MNIST数字，确保每轮训练显示相同的数字
  const [fixedDigits, setFixedDigits] = useState([])
  


  // 初始化可用代码块
  React.useEffect(() => {
    setAvailableBlocks(codeBlocks.map(block => block.id))
  }, [codeBlocks])

  // 初始化固定的MNIST数字
  React.useEffect(() => {
    if (fixedDigits.length === 0) {
      const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      const randomDigits = Array.from({ length: 5 }, () => 
        digits[Math.floor(Math.random() * digits.length)]
      )
      setFixedDigits(randomDigits)
    }
  }, [fixedDigits])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 检查工作区排序是否正确
  const isCorrectOrder = useCallback(() => {
    if (workspaceBlocks.length !== 6) return false
    
    const workspaceOrder = workspaceBlocks.map(blockId => {
      const block = codeBlocks.find(b => b.id === blockId)
      return block?.order
    })
    
    const expectedOrder = [1, 2, 3, 4, 5, 6]
    return JSON.stringify(workspaceOrder) === JSON.stringify(expectedOrder)
  }, [workspaceBlocks, codeBlocks])

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    
    if (!over) return

    const activeId = active.id
    const overId = over.id

    // 从工作区拖拽到可用代码块区域
    if (over.id === 'available-blocks-container' && workspaceBlocks.includes(activeId)) {
      setWorkspaceBlocks(prev => prev.filter(id => id !== activeId))
      setAvailableBlocks(prev => [...prev, activeId])
      setErrorMessage('')
    }
    // 从可用代码块拖拽到工作区
    else if ((over.id === 'workspace-container' || over.data?.current?.sortable?.containerId === 'workspace-container' || workspaceBlocks.includes(overId)) && availableBlocks.includes(activeId)) {
      setAvailableBlocks(prev => prev.filter(id => id !== activeId))
      
      if (workspaceBlocks.includes(overId)) {
        // 如果拖拽到工作区中的某个元素上，插入到该位置
        const targetIndex = workspaceBlocks.indexOf(overId)
        setWorkspaceBlocks(prev => {
          const newBlocks = [...prev]
          newBlocks.splice(targetIndex, 0, activeId)
          return newBlocks
        })
      } else {
        // 否则添加到末尾
        setWorkspaceBlocks(prev => [...prev, activeId])
      }
      setErrorMessage('')
    }
    // 如果在工作区内重新排序
    else if (workspaceBlocks.includes(activeId) && workspaceBlocks.includes(overId)) {
      setWorkspaceBlocks(prev => {
        const oldIndex = prev.indexOf(activeId)
        const newIndex = prev.indexOf(overId)
        return arrayMove(prev, oldIndex, newIndex)
      })
      setErrorMessage('')
    }
    // 如果在可用代码块区域内重新排序
    else if (availableBlocks.includes(activeId) && availableBlocks.includes(overId)) {
      setAvailableBlocks(prev => {
        const oldIndex = prev.indexOf(activeId)
        const newIndex = prev.indexOf(overId)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }, [availableBlocks, workspaceBlocks])

  const moveToWorkspace = useCallback((blockId) => {
    setAvailableBlocks(prev => prev.filter(id => id !== blockId))
    setWorkspaceBlocks(prev => [...prev, blockId])
    setErrorMessage('')
  }, [])

  const removeFromWorkspace = useCallback((blockId) => {
    setWorkspaceBlocks(prev => prev.filter(id => id !== blockId))
    setAvailableBlocks(prev => [...prev, blockId])
    setErrorMessage('')
  }, [])

  const showCode = useCallback(() => {
    if (workspaceBlocks.length === 0) return
    
    // 显示所有工作区代码块的完整代码
    const allCode = workspaceBlocks.map(blockId => {
      const block = codeBlocks.find(b => b.id === blockId)
      return `# ${block.title}\n${block.code}`
    }).join('\n\n')
    
    setSelectedBlock({
      title: '完整 GAN 代码',
      code: allCode
    })
  }, [workspaceBlocks, codeBlocks])

  const runCode = useCallback(() => {
    if (workspaceBlocks.length === 0) {
      setErrorMessage('请先将代码块添加到工作区')
      // 滚动到工作区
      const workspaceElement = document.querySelector('.workspace-area')
      if (workspaceElement) {
        workspaceElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    
    if (!isCorrectOrder()) {
      setErrorMessage('代码块顺序不正确！请按照正确的执行顺序排列：1.导入依赖 → 2.数据准备 → 3.定义生成器 → 4.定义判别器 → 5.初始化模型 → 6.训练循环')
      // 滚动到工作区并高亮显示
      const workspaceElement = document.querySelector('.workspace-area')
      if (workspaceElement) {
        workspaceElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // 添加错误高亮效果
        workspaceElement.classList.add('error-highlight')
        setTimeout(() => {
          workspaceElement.classList.remove('error-highlight')
        }, 2000)
      }
      return
    }
    
    setErrorMessage('')
    setIsRunning(true)
    setRunResults(null)
    

    
    // 模拟真实的GAN训练过程
    const simulateCodeExecution = () => {
      const steps = [
        { step: 1, message: '导入依赖库...', duration: 500 },
        { step: 2, message: '加载MNIST数据集...', duration: 1000 },
        { step: 3, message: '初始化生成器网络...', duration: 800 },
        { step: 4, message: '初始化判别器网络...', duration: 800 },
        { step: 5, message: '设置优化器和损失函数...', duration: 600 },
        { step: 6, message: '开始训练循环...', duration: 1000 }
      ]
      
      let currentStep = 0
      const executeStep = () => {
        if (currentStep < steps.length) {
          const step = steps[currentStep]
          setRunResults(prev => ({
            ...prev,
            currentStep: step.step,
            currentMessage: step.message,
            isExecuting: true
          }))
          
          setTimeout(() => {
            currentStep++
            executeStep()
          }, step.duration)
        } else {
          // 开始训练可视化
          startTrainingVisualization()
        }
      }
      
      executeStep()
    }

    // 训练可视化动画
    const startTrainingVisualization = () => {
      const epochs = 14
      let currentEpoch = 1
      
      const trainEpoch = () => {
        if (currentEpoch <= epochs) {
          // 模拟每个epoch的损失值变化
          const gLoss = (4.0 - (currentEpoch / epochs) * 3.5 + Math.random() * 0.5).toFixed(4)
          const dLoss = (0.8 - (currentEpoch / epochs) * 0.3 + Math.random() * 0.2).toFixed(4)
          
          // 生成当前epoch的图像数据（模拟从模糊到清晰的过程）
          // 质量从0逐渐增加到1，但数字保持不变
          const imageQuality = currentEpoch / epochs
          const generatedImages = generateMNISTImages(imageQuality)
          

          
          setRunResults(prev => ({
            ...prev,
            isExecuting: true,
            isTraining: true,
            currentEpoch: currentEpoch,
            totalEpochs: epochs,
            generatorLoss: gLoss,
            discriminatorLoss: dLoss,
            currentImages: generatedImages,
            trainingProgress: (currentEpoch / epochs) * 100
          }))
          
          setTimeout(() => {
            currentEpoch++
            trainEpoch()
          }, 800) // 固定间隔
        } else {
          // 训练完成
          const finalGLoss = (0.5 + Math.random() * 0.3).toFixed(4)
          const finalDLoss = (0.4 + Math.random() * 0.2).toFixed(4)
          
          setRunResults({
            isExecuting: false,
            isTraining: false,
            completed: true,
            epoch: epochs,
            generatorLoss: finalGLoss,
            discriminatorLoss: finalDLoss,
            finalImages: generateMNISTImages(1.0),
            executionLog: [
              'Downloading MNIST dataset...',
              'Dataset loaded successfully: 60000 training samples',
              'Generator initialized with 784 output neurons',
              'Discriminator initialized with 784 input neurons',
              'Using Adam optimizer with lr=0.0002',
              `Training for ${epochs} epochs...`,
              `Epoch ${epochs}/14 - Generator Loss: ${finalGLoss}, Discriminator Loss: ${finalDLoss}`,
              'Training completed successfully!',
              'Generated 5 sample images'
            ],
            pythonOutput: `Epoch [${epochs}/14], Step [938/938]
Generator Loss: ${finalGLoss}
Discriminator Loss: ${finalDLoss}
Time elapsed: ${(Math.random() * 30 + 45).toFixed(1)}s
Generated images saved to: ./generated_images/
Training completed successfully!`
          })
          setIsRunning(false)

        }
      }
      
      trainEpoch()
    }

    // 生成MNIST风格的图像数据 - 使用固定的数字，只改变质量
    const generateMNISTImages = (quality) => {
      return Array.from({ length: 5 }, (_, i) => {
        const digit = fixedDigits[i] || 0
        return {
          id: i,
          digit: digit,
          quality: quality,
          data: generateDigitPattern(digit, quality)
        }
      })
    }

        // 生成数字图案数据 - 根据质量从模糊到清晰
    const generateDigitPattern = (digit, quality) => {
      // 28x28像素的简化MNIST数字图案
      const patterns = {
        0: [
          "  ████████  ",
          " ██      ██ ",
          "██        ██",
          "██        ██",
          "██        ██",
          "██        ██",
          "██        ██",
          " ██      ██ ",
          "  ████████  "
        ],
        1: [
          "    ██    ",
          "  ████    ",
          "    ██    ",
          "    ██    ",
          "    ██    ",
          "    ██    ",
          "    ██    ",
          "    ██    ",
          "  ██████  "
        ],
        2: [
          "  ████████  ",
          " ██      ██ ",
          "          ██",
          "        ██  ",
          "      ██    ",
          "    ██      ",
          "  ██        ",
          " ██      ██ ",
          "████████████"
        ],
        3: [
          "  ████████  ",
          " ██      ██ ",
          "          ██",
          "    ██████  ",
          "          ██",
          "          ██",
          "          ██",
          " ██      ██ ",
          "  ████████  "
        ],
        4: [
          "██      ██",
          "██      ██",
          "██      ██",
          "██      ██",
          "████████████",
          "        ██",
          "        ██",
          "        ██",
          "        ██"
        ],
        5: [
          "████████████",
          "██          ",
          "██          ",
          "██████████  ",
          "          ██",
          "          ██",
          "          ██",
          " ██      ██ ",
          "  ████████  "
        ],
        6: [
          "  ████████  ",
          " ██      ██ ",
          "██          ",
          "██████████  ",
          "██        ██",
          "██        ██",
          "██        ██",
          " ██      ██ ",
          "  ████████  "
        ],
        7: [
          "████████████",
          "          ██",
          "        ██  ",
          "      ██    ",
          "    ██      ",
          "  ██        ",
          " ██         ",
          "██          ",
          "██          "
        ],
        8: [
          "  ████████  ",
          " ██      ██ ",
          "██        ██",
          " ██      ██ ",
          "  ████████  ",
          " ██      ██ ",
          "██        ██",
          " ██      ██ ",
          "  ████████  "
        ],
        9: [
          "  ████████  ",
          " ██      ██ ",
          "██        ██",
          "██        ██",
          " ██████████ ",
          "          ██",
          "          ██",
          " ██      ██ ",
          "  ████████  "
        ]
      }
      
      const pattern = patterns[digit] || patterns[0]
      
      // 根据质量从模糊到清晰：质量越低，噪声越多，字符越模糊
      const noiseLevel = 1 - quality
      const blurLevel = Math.max(0, noiseLevel * 2) // 增强模糊效果
      
      return pattern.map(row => {
        return row.split('').map(char => {
          // 根据质量决定是否添加噪声
          if (Math.random() < noiseLevel * 0.5) {
            // 质量低时，字符更容易被替换
            if (char === '█') {
              // 实心方块可能变成空格、半实心或保持实心
              if (Math.random() < blurLevel * 0.7) {
                return Math.random() < 0.5 ? ' ' : '▓'
              }
            } else if (char === ' ') {
              // 空格可能变成半实心
              if (Math.random() < blurLevel * 0.3) {
                return '░'
              }
            }
          }
          return char
        }).join('')
      })
    }
    
    simulateCodeExecution()
  }, [workspaceBlocks, isCorrectOrder])

  const resetBlocks = useCallback(() => {
    const newBlocks = generateRandomizedBlocks()
    setCodeBlocks(newBlocks)
    setAvailableBlocks(newBlocks.map(block => block.id))
    setWorkspaceBlocks([])
    setSelectedBlock(null)
    setRunResults(null)
    setErrorMessage('')
    // 重新生成固定的MNIST数字
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const randomDigits = Array.from({ length: 5 }, () => 
      digits[Math.floor(Math.random() * digits.length)]
    )
    setFixedDigits(randomDigits)
  }, [])



  return (
    <div className="section code-implementation">
      <div className="implementation-header">
        <h1>GAN 代码实现与流程可视化</h1>
        <p className="text-muted">
          拖拽代码块到工作区，点击查看完整代码，运行查看生成效果。
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="implementation-layout">
          {/* 左侧：可用代码块 */}
          <div className="available-blocks">
            <h3>可用代码块</h3>
            <DroppableAvailableBlocks>
              <SortableContext items={availableBlocks} strategy={verticalListSortingStrategy}>
                <div className="blocks-container">
                  {availableBlocks.map(blockId => {
                    const block = codeBlocks.find(b => b.id === blockId)
                    return (
                      <SortableCodeCard
                        key={blockId}
                        id={blockId}
                        title={block.title}
                        description={block.description}
                        isInWorkspace={false}
                        onMoveToWorkspace={moveToWorkspace}
                      />
                    )
                  })}
                </div>
              </SortableContext>
            </DroppableAvailableBlocks>
          </div>

          {/* 右侧：工作区 */}
          <div className="workspace-area">
            <div className="workspace-header">
              <h3>代码工作区 ({workspaceBlocks.length}/6)</h3>
              <div className="workspace-controls">
                <button 
                  className="control-btn show-code"
                  onClick={showCode}
                  disabled={workspaceBlocks.length === 0}
                >
                  📄 显示完整代码
                </button>
                <button 
                  className="control-btn reset"
                  onClick={resetBlocks}
                >
                  🔄 重新洗牌
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {errorMessage && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 排序状态提示 */}
            {workspaceBlocks.length === 6 && (
              <div className={`order-status ${isCorrectOrder() ? 'correct' : 'incorrect'}`}>
                {isCorrectOrder() ? (
                  <>
                    <span className="status-icon">✅</span>
                    <span>代码块排序正确！可以运行代码了</span>
                  </>
                ) : (
                  <>
                    <span className="status-icon">❌</span>
                    <span>代码块顺序不正确，请重新排列</span>
                  </>
                )}
              </div>
            )}

            <DroppableWorkspace>
              <SortableContext items={workspaceBlocks} strategy={verticalListSortingStrategy}>
                {workspaceBlocks.length === 0 ? (
                  <div className="empty-workspace">
                    <p>将代码块拖拽到这里开始构建GAN</p>
                  </div>
                ) : (
                  workspaceBlocks.map(blockId => {
                    const block = codeBlocks.find(b => b.id === blockId)
                    return (
                      <SortableCodeCard
                        key={blockId}
                        id={blockId}
                        title={block.title}
                        description={block.description}
                        isInWorkspace={true}
                        onRemoveFromWorkspace={removeFromWorkspace}
                      />
                    )
                  })
                )}
              </SortableContext>
            </DroppableWorkspace>
          </div>
        </div>
      </DndContext>



      {/* 代码显示区域 */}
      {selectedBlock && (
        <div className="code-display">
          <div className="code-header">
            <h3>{selectedBlock.title}</h3>
            <button 
              className="close-btn"
              onClick={() => setSelectedBlock(null)}
            >
              ✕
            </button>
          </div>
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '0 0 0 0',
              fontSize: '14px'
            }}
          >
            {selectedBlock.code}
          </SyntaxHighlighter>
          <div className="code-footer">
            <button 
              className="control-btn run-code"
              onClick={runCode}
              disabled={workspaceBlocks.length === 0 || isRunning}
            >
              {isRunning ? '⏳ 运行中...' : '▶️ 运行代码'}
            </button>
          </div>
        </div>
      )}

      {/* 运行结果显示区域 */}
      {runResults && (
        <div className="run-results">
          {runResults.isExecuting && !runResults.isTraining ? (
            /* 代码可视化运行部分 */
            <div className="execution-visualization">
              <h3>🔄 代码执行中...</h3>
              <div className="execution-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(runResults.currentStep / 6) * 100}%` }}
                  ></div>
                </div>
                <div className="current-step">
                  <span className="step-number">步骤 {runResults.currentStep}/6</span>
                  <span className="step-message">{runResults.currentMessage}</span>
                </div>
              </div>
              <div className="execution-steps">
                {[
                  '导入依赖库',
                  '加载MNIST数据集', 
                  '初始化生成器网络',
                  '初始化判别器网络',
                  '设置优化器和损失函数',
                  '开始训练循环'
                ].map((step, index) => (
                  <div 
                    key={index} 
                    className={`step-item ${index + 1 <= runResults.currentStep ? 'completed' : ''} ${index + 1 === runResults.currentStep ? 'active' : ''}`}
                  >
                    <div className="step-icon">
                      {index + 1 < runResults.currentStep ? '✅' : index + 1 === runResults.currentStep ? '⏳' : '⭕'}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : runResults.isTraining ? (
            /* GAN训练可视化动画 */
            <div className="training-visualization">
              <div className="training-header">
                <h3>🧠 GAN 训练中...</h3>
                <div className="epoch-info">
                  <span className="epoch-text">Epoch {runResults.currentEpoch} | D Loss: {runResults.discriminatorLoss} | G Loss: {runResults.generatorLoss}</span>
                </div>
              </div>
              
              <div className="training-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill training" 
                    style={{ width: `${runResults.trainingProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{runResults.trainingProgress.toFixed(1)}% 完成</span>
              </div>

              <div className="generated-images-live">
                <h4>实时生成结果:</h4>
                <div className="mnist-images-container">
                  {runResults.currentImages && runResults.currentImages.map((image, index) => (
                    <div key={index} className="mnist-image">
                      <div className="mnist-digit">
                        {image.data.map((row, rowIndex) => (
                          <div key={rowIndex} className="mnist-row">
                            {row.split('').map((pixel, pixelIndex) => (
                              <span 
                                key={pixelIndex} 
                                className={`mnist-pixel ${pixel === '█' ? 'filled' : pixel === '▓' ? 'partial' : 'empty'}`}
                              >
                                {pixel === ' ' ? '·' : pixel}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className="digit-label">数字 {image.digit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : runResults.completed ? (
            /* 最终结果部分 */
            <div className="execution-results">
              <h3>✅ 执行完成</h3>
              
              {/* 可视化结果 */}
              <div className="visual-results">
                <div className="final-training-header">
                  <h4>最终训练结果</h4>
                  <div className="final-epoch-info">
                    <span className="final-epoch-text">Epoch {runResults.epoch} | D Loss: {runResults.discriminatorLoss} | G Loss: {runResults.generatorLoss}</span>
                  </div>
                </div>
                
                <div className="final-generated-images">
                  <h4>最终生成的MNIST数字:</h4>
                  <div className="final-mnist-container">
                    {runResults.finalImages && runResults.finalImages.map((image, index) => (
                      <div key={index} className="final-mnist-image">
                        <div className="final-mnist-digit">
                          {image.data.map((row, rowIndex) => (
                            <div key={rowIndex} className="mnist-row">
                              {row.split('').map((pixel, pixelIndex) => (
                                <span 
                                  key={pixelIndex} 
                                  className={`mnist-pixel ${pixel === '█' ? 'filled' : pixel === '▓' ? 'partial' : 'empty'}`}
                                >
                                  {pixel === ' ' ? '·' : pixel}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                        <div className="final-digit-label">数字 {image.digit}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="training-metrics">
                  <div className="metric">
                    <span>训练轮次:</span>
                    <span>{runResults.epoch}</span>
                  </div>
                  <div className="metric">
                    <span>生成器损失:</span>
                    <span>{runResults.generatorLoss}</span>
                  </div>
                  <div className="metric">
                    <span>判别器损失:</span>
                    <span>{runResults.discriminatorLoss}</span>
                  </div>
                </div>
              </div>

              {/* Python输出结果 */}
              <div className="python-output">
                <h4>Python 控制台输出</h4>
                <div className="console-output">
                  <pre>{runResults.pythonOutput}</pre>
                </div>
              </div>

              {/* 执行日志 */}
              <div className="execution-log">
                <h4>执行日志</h4>
                <div className="log-content">
                  {runResults.executionLog.map((log, index) => (
                    <div key={index} className="log-item">
                      <span className="log-time">[{new Date().toLocaleTimeString()}]</span>
                      <span className="log-message">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

