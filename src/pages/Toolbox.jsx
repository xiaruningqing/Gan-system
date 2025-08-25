import React, { useState, useEffect, useCallback } from 'react'
import './Toolbox.css'

// GAN变体数据
const ganVariants = [
  {
    id: 'dcgan',
    name: 'DCGAN',
    fullName: 'Deep Convolutional GAN',
    icon: '🎨',
    color: '#7c4dff',
    description: '使用卷积神经网络的生成对抗网络，专门用于图像生成',
    features: ['卷积层', '批归一化', 'LeakyReLU激活', '转置卷积'],
    year: 2015,
    difficulty: 1,
    gameDescription: '通过构建网络架构来生成清晰的图像',
    gameRules: '按正确顺序连接网络层，观察生成图像的质量变化'
  },
  {
    id: 'wgan',
    name: 'WGAN',
    fullName: 'Wasserstein GAN',
    icon: '⚖️',
    color: '#26c6da',
    description: '使用Wasserstein距离的GAN变体，提供更稳定的训练',
    features: ['Wasserstein距离', '梯度惩罚', '权重裁剪', '稳定训练'],
    year: 2017,
    difficulty: 2,
    gameDescription: '平衡生成器和判别器的训练，避免模式崩塌',
    gameRules: '调整训练参数来保持生成器和判别器的平衡，需要达到90分以上才算通过'
  }
]

// 游戏状态
const gameStates = {
  SELECTING: 'selecting',
  PLAYING: 'playing',
  COMPLETED: 'completed'
}

export default function Toolbox() {
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [gameState, setGameState] = useState(gameStates.SELECTING)
  const [gameScore, setGameScore] = useState(0)
  const [gameProgress, setGameProgress] = useState(0)
  const [showGame, setShowGame] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [gameData, setGameData] = useState({})
  const [gameMessages, setGameMessages] = useState([])
  const [showHint, setShowHint] = useState(false)
  const [animations, setAnimations] = useState({})

  // 训练模拟器状态
  const [trainingSimulator, setTrainingSimulator] = useState(null)

  // 完成延时：用于在达到完成条件后，继续展示可视化一段时间
  const scheduleCompletion = useCallback((holdMs = 2500) => {
    setGameData(prev => ({ ...prev, isCompleting: true }))
    setTimeout(() => {
      setGameData(prev => ({ ...prev, isCompleting: false, gamePhase: 'completed' }))
    }, holdMs)
  }, [])

  // 工具方法：打乱数组顺序（Fisher–Yates）
  const shuffleArray = (arr) => {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = copy[i]
      copy[i] = copy[j]
      copy[j] = tmp
    }
    return copy
  }

  // 添加游戏消息
  const addGameMessage = (message, type = 'info') => {
    setGameMessages(prev => [...prev, { id: Date.now(), message, type, timestamp: Date.now() }])
  }
  
  // 重置游戏
  const resetGame = () => {
    setGameState(gameStates.SELECTING)
    setGameData({})
    setGameMessages([])
    if (trainingSimulator) {
      clearInterval(trainingSimulator)
      setTrainingSimulator(null)
    }
  }
  
  // 开始训练模拟器
  const startTrainingSimulator = () => {
    if (trainingSimulator) {
      clearInterval(trainingSimulator)
    }
    
    const simulator = setInterval(() => {
      setGameData(prev => {
        if (!prev.isTraining || prev.gamePhase !== 'training') {
          clearInterval(simulator)
          setTrainingSimulator(null)
          return prev
        }
        
        const newEpochs = prev.trainingEpochs + 1
        const balance = prev.balance || 0.5
        
        // 模拟训练过程
        const generatorLoss = Math.max(0, prev.generatorLoss + (Math.random() - 0.5) * 0.1)
        const discriminatorLoss = Math.max(0, prev.discriminatorLoss + (Math.random() - 0.5) * 0.1)
        const wassersteinDistance = Math.abs(generatorLoss - discriminatorLoss)
        
        // 计算训练风险指标
        const modeCollapseRisk = Math.min(1, wassersteinDistance * 2)
        const gradientExplosionRisk = Math.min(1, Math.abs(generatorLoss - discriminatorLoss) / 2)
        const stabilityScore = Math.max(0, 100 - (wassersteinDistance * 100) - (Math.abs(balance - 0.5) * 200))
        
        // 检查训练失败条件（完成展示阶段不再触发失败）
        if (!prev.isCompleting) {
          if (newEpochs >= prev.maxTrainingEpochs) {
            setGameData(prev => ({ ...prev, gamePhase: 'failed' }))
            addGameMessage('⏰ 训练超时！已达到最大训练轮次。', 'error')
            clearInterval(simulator)
            setTrainingSimulator(null)
            return prev
          }
          
          if (stabilityScore <= 0) {
            setGameData(prev => ({ ...prev, gamePhase: 'failed' }))
            addGameMessage('💥 训练失败！稳定性分数过低，模型崩溃。', 'error')
            clearInterval(simulator)
            setTrainingSimulator(null)
            return prev
          }
          
          if (modeCollapseRisk >= prev.maxModeCollapseRisk) {
            setGameData(prev => ({ ...prev, gamePhase: 'failed' }))
            addGameMessage('🔄 模式崩塌！生成器失去了多样性。', 'error')
            clearInterval(simulator)
            setTrainingSimulator(null)
            return prev
          }
          
          if (gradientExplosionRisk >= prev.maxGradientExplosionRisk) {
            setGameData(prev => ({ ...prev, gamePhase: 'failed' }))
            addGameMessage('💥 梯度爆炸！训练不稳定。', 'error')
            clearInterval(simulator)
            setTrainingSimulator(null)
            return prev
          }
        }
        
        // 检查训练成功条件
        if (stabilityScore >= prev.targetStabilityScore && wassersteinDistance <= 0.05 && balance >= 0.4 && balance <= 0.6) {
          // 进入完成展示阶段：保留若干轮次用于可视化
          const remaining = (prev.completingEpochsRemaining ?? 10) - 1
          if (!prev.isCompleting) {
            addGameMessage('🎉 训练达到目标，开始完成展示…', 'success')
            return { ...prev, isCompleting: true, completingEpochsRemaining: 10 }
          } else if (remaining > 0) {
            return { ...prev, completingEpochsRemaining: remaining }
          } else {
            setGameData(prev2 => ({ ...prev2, gamePhase: 'completed', isCompleting: false, completingEpochsRemaining: 0 }))
            addGameMessage('🏆 展示完成！训练结束。', 'success')
            clearInterval(simulator)
            setTrainingSimulator(null)
            return prev
          }
        }
        
        // 更新训练历史
        const lossHistory = [...prev.lossHistory, { 
          generatorLoss, 
          discriminatorLoss, 
          epoch: newEpochs,
          wassersteinDistance,
          balance
        }].slice(-20)
        
        return {
          ...prev,
          trainingEpochs: newEpochs,
          generatorLoss,
          discriminatorLoss,
          wassersteinDistance,
          modeCollapseRisk,
          gradientExplosionRisk,
          stabilityScore,
          lossHistory,
          gameTime: prev.gameTime + 1
        }
      })
    }, 1000 / (gameData.trainingSpeed || 1))
    
    setTrainingSimulator(simulator)
  }
  
  // 停止训练模拟器
  const stopTrainingSimulator = () => {
    if (trainingSimulator) {
      clearInterval(trainingSimulator)
      setTrainingSimulator(null)
    }
  }

  // 开始游戏
  const startGame = useCallback((variant) => {
    setSelectedVariant(variant)
    setGameState(gameStates.PLAYING)
    setGameScore(0)
    setGameProgress(0)
    setCurrentStep(0)
    setShowGame(true)
    setGameMessages([])
    setShowHint(false)
    setAnimations({})
    
    // 根据变体类型初始化游戏数据
    switch (variant.id) {
      case 'dcgan':
        setGameData({
          // 基础游戏状态
          gamePhase: 'introduction', // introduction, setup, game, completed
          currentStep: 0,
          
          // 网络构建游戏数据
          layers: [
          { id: 'input', name: '输入层', type: 'input', neurons: 100, description: '随机噪声输入' },
          { id: 'dense1', name: '全连接层1', type: 'dense', neurons: 256, description: '特征提取' },
          { id: 'dense2', name: '全连接层2', type: 'dense', neurons: 512, description: '特征扩展' },
          { id: 'reshape', name: '重塑层', type: 'reshape', neurons: 784, description: '转换为图像格式' },
          { id: 'conv1', name: '卷积层1', type: 'conv', neurons: 64, description: '空间特征学习' },
          { id: 'conv2', name: '卷积层2', type: 'conv', neurons: 32, description: '细节特征学习' },
          { id: 'output', name: '输出层', type: 'output', neurons: 1, description: '生成图像' }
          ],
          selectedLayers: [],
          currentLayer: null,
          imageQuality: 0,
          generatedImage: null,
          correctOrder: ['input', 'dense1', 'dense2', 'reshape', 'conv1', 'conv2', 'output'],
          
          // 游戏统计
          gameTime: 0,
          hintsUsed: 0,
          bestScore: 0,
          
          // 介绍步骤
          introductionSteps: [
            {
              title: "什么是DCGAN？",
              content: "Deep Convolutional GAN (DCGAN) 是第一个成功使用卷积神经网络的GAN变体，它通过引入卷积层、批归一化和LeakyReLU激活函数，显著提升了图像生成质量。",
              image: "🖼️"
            },
            {
              title: "DCGAN的核心创新",
              content: "1. 使用转置卷积进行上采样\n2. 引入批归一化稳定训练\n3. 采用LeakyReLU避免梯度消失\n4. 全连接层替换为卷积层\n5. 使用步长卷积控制特征图大小",
              image: "⚡"
            },
            {
              title: "网络架构特点",
              content: "• 生成器：转置卷积 + 批归一化 + ReLU\n• 判别器：卷积 + 批归一化 + LeakyReLU\n• 去除全连接层，使用卷积层\n• 稳定的训练过程",
              image: "🏗️"
            },
            {
              title: "主要应用场景",
              content: "• 高分辨率图像生成\n• 图像风格转换\n• 数据增强\n• 艺术创作\n• 游戏资产生成\n• 医学图像合成",
              image: "🎨"
            },
            {
              title: "游戏目标",
              content: "构建正确的DCGAN网络架构！你需要：\n• 按正确顺序排列网络层\n• 理解每层的作用\n• 构建完整的生成器网络\n• 观察生成的图像质量",
              image: "🎯"
            }
          ]
        })
        
        addGameMessage('🚀 DCGAN网络构建挑战开始！首先了解DCGAN的基本概念和网络架构。', 'info')
        break
      
      case 'wgan':
        setGameData({
          // 基础游戏状态
          gamePhase: 'introduction', // introduction, setup, training, completed, failed
          currentStep: 0,
          
          // 训练参数
          generatorLoss: 0.5,
          discriminatorLoss: 0.5,
          balance: 0.5,
          trainingEpochs: 0,
          maxTrainingEpochs: 100,
          
          // 游戏指标
          stabilityScore: 100,
          modeCollapseRisk: 0,
          gradientExplosionRisk: 0,
          wassersteinDistance: 0,
          
          // 训练历史
          lossHistory: [],
          gradientHistory: [],
          wassersteinHistory: [],
          
          // 游戏统计
          gameTime: 0,
          hintsUsed: 0,
          autoBalanceUsed: 0,
          bestScore: 0,
          
          // 训练状态
          isTraining: false,
          trainingSpeed: 1, // 1x, 2x, 4x
          autoMode: false,
          
          // 游戏规则
          targetStabilityScore: 90,
          maxModeCollapseRisk: 0.8,
          maxGradientExplosionRisk: 0.8,
          
          // 介绍步骤
          introductionSteps: [
            {
              title: "什么是WGAN？",
              content: "Wasserstein GAN (WGAN) 是一种改进的生成对抗网络，它使用Wasserstein距离来度量真实数据和生成数据之间的差异，解决了传统GAN训练不稳定的问题。",
              image: "⚖️"
            },
            {
              title: "WGAN的核心优势",
              content: "1. 训练更稳定，不会出现模式崩塌\n2. 损失函数有意义，可以反映训练质量\n3. 生成器收敛性更好\n4. 对超参数不敏感",
              image: "🛡️"
            },
            {
              title: "主要应用场景",
              content: "• 图像生成和编辑\n• 风格迁移\n• 数据增强\n• 医学图像处理\n• 艺术创作",
              image: "🎨"
            },
            {
              title: "游戏目标",
              content: "通过调整训练平衡参数，让WGAN达到稳定的训练状态。你需要：\n• 保持稳定性分数≥90\n• 避免模式崩塌和梯度爆炸\n• 在限定轮次内完成训练",
              image: "🎯"
            }
          ]
        })
        
        addGameMessage('🚀 WGAN训练挑战开始！首先了解WGAN的基本概念和游戏规则。', 'info')
        break
      
      case 'cyclegan':
        setGameData({
          // 基础游戏状态
          gamePhase: 'introduction', // introduction, setup, training, completed, failed
          currentStep: 0,
          
          // 训练参数
          generatorLoss: 0.5,
          discriminatorLoss: 0.5,
          cycleConsistencyLoss: 0.5,
          identityLoss: 0.5,
          trainingEpochs: 0,
          maxTrainingEpochs: 100,
          
          // 游戏指标
          stabilityScore: 100,
          cycleConsistencyScore: 100,
          identityPreservationScore: 100,
          styleTransferQuality: 0,
          
          // 训练历史
          lossHistory: [],
          cycleHistory: [],
          identityHistory: [],
          
          // 游戏统计
          gameTime: 0,
          hintsUsed: 0,
          autoBalanceUsed: 0,
          bestScore: 0,
          
          // 训练状态
          isTraining: false,
          trainingSpeed: 1, // 1x, 2x, 4x
          autoMode: false,
          
          // 游戏规则
          targetStabilityScore: 90,
          targetCycleConsistencyScore: 85,
          
          
          // 介绍步骤
          introductionSteps: [
            {
              title: "什么是CycleGAN？",
              content: "CycleGAN是一种无监督的图像到图像转换模型，它可以在没有配对训练数据的情况下，学习两个不同域之间的映射关系，实现风格转换。",
              image: "🔄"
            },
            {
              title: "CycleGAN的核心原理",
              content: "1. 循环一致性损失：确保转换后的图像能转换回原图\n2. 对抗训练：生成器与判别器的博弈\n3. 身份映射：保持输入图像的基本结构\n4. 无配对数据：不需要成对的训练样本",
              image: "🧠"
            },
            {
              title: "网络架构特点",
              content: "• 两个生成器：G(A→B) 和 G(B→A)\n• 两个判别器：D(A) 和 D(B)\n• 循环一致性损失\n• 身份映射损失\n• 残差块结构",
              image: "🏗️"
            },
            {
              title: "主要应用场景",
              content: "• 照片风格转换（照片→油画）\n• 季节转换（夏天→冬天）\n• 物体转换（马→斑马）\n• 艺术风格迁移\n• 医学图像转换\n• 游戏场景风格化",
              image: "🎨"
            },
            {
              title: "游戏目标",
              content: "通过调整训练参数，让CycleGAN实现高质量的图像转换。你需要：\n• 平衡各种损失函数\n• 保持循环一致性\n• 在限定轮次内完成训练\n• 观察风格转换效果",
              image: "🎯"
            }
          ]
        })
        
        addGameMessage('🚀 CycleGAN风格转换挑战开始！首先了解CycleGAN的基本原理和应用场景。', 'info')
        break
      
      case 'stylegan':
        setGameData({
          // 基础游戏状态
          gamePhase: 'introduction', // introduction, setup, training, completed, failed
          currentStep: 0,
          
          // 训练参数
          generatorLoss: 0.5,
          discriminatorLoss: 0.5,
          styleLoss: 0.5,
          perceptualLoss: 0.5,
          trainingEpochs: 0,
          maxTrainingEpochs: 100,
          
          // 游戏指标
          stabilityScore: 100,
          styleQuality: 0,
          perceptualQuality: 0,
          diversityScore: 0,
          
          // 训练历史
          lossHistory: [],
          styleHistory: [],
          perceptualHistory: [],
          
          // 游戏统计
          gameTime: 0,
          hintsUsed: 0,
          autoBalanceUsed: 0,
          bestScore: 0,
          
          // 训练状态
          isTraining: false,
          trainingSpeed: 1, // 1x, 2x, 4x
          autoMode: false,
          
          // 游戏规则
          targetStabilityScore: 90,
          targetStyleQuality: 85,
          styles: { 
            age: 0.5,
            gender: 0.5,
            smile: 0.5,
            eyeglass: 0.1
          },
          
          
          // 介绍步骤
          introductionSteps: [
            {
              title: "什么是StyleGAN？",
              content: "StyleGAN是一种革命性的生成对抗网络，它通过自适应实例归一化(AdaIN)和渐进式增长策略，能够生成前所未有的高质量、高分辨率的图像。",
              image: "🌟"
            },
            {
              title: "StyleGAN的核心创新",
              content: "1. 自适应实例归一化(AdaIN)：控制生成图像的风格\n2. 渐进式增长：从低分辨率逐步提升到高分辨率\n3. 噪声注入：增加图像的随机性和多样性\n4. 映射网络：将潜在向量转换为中间潜在空间",
              image: "⚡"
            },
            {
              title: "网络架构特点",
              content: "• 映射网络：将潜在向量转换为中间潜在空间\n• 生成器：渐进式增长结构\n• 判别器：多尺度判别\n• 风格混合：控制不同层级的风格\n• 噪声注入：增加随机性",
              image: "🏗️"
            },
            {
              title: "主要应用场景",
              content: "• 高分辨率人脸生成\n• 艺术风格图像创作\n• 游戏角色设计\n• 虚拟形象生成\n• 数据增强\n• 创意设计辅助",
              image: "🎨"
            },
            {
              title: "游戏目标",
              content: "通过调整训练参数，让StyleGAN生成高质量的图像。你需要：\n• 平衡各种损失函数\n• 控制风格和内容\n• 在限定轮次内完成训练\n• 观察图像质量提升",
              image: "🎯"
            }
          ]
        })
        
        addGameMessage('🚀 StyleGAN高质量图像生成挑战开始！首先了解StyleGAN的创新技术和应用。', 'info')
        break
      
      case 'biggan':
        setGameData({
          // 基础游戏状态
          gamePhase: 'introduction', // introduction, setup, game, completed
          currentStep: 0,
          
          // 模型参数
          modelSize: 1,
          classConditioning: false,
          orthogonalRegularization: 0.5,
          truncationTrick: 0.5,
          currentCategory: 'animals',
          
          // 游戏指标
          stabilityScore: 100,
          classAccuracy: 0,
          imageQuality: 0,
          diversityScore: 0,
          
          // 游戏统计
          gameTime: 0,
          hintsUsed: 0,
          bestScore: 0,
          
          // 介绍步骤
          introductionSteps: [
            {
              title: "什么是BigGAN？",
              content: "BigGAN是一种大规模的条件生成对抗网络，它通过增加模型容量、使用类别条件化和改进的训练技术，在ImageNet数据集上取得了突破性的生成质量。",
              image: "🚀"
            },
            {
              title: "BigGAN的核心创新",
              content: "1. 大规模模型：增加网络深度和宽度\n2. 类别条件化：根据类别标签生成特定图像\n3. 正交正则化：改善训练稳定性\n4. 截断技巧：控制生成图像的多样性\n5. 自注意力机制：捕获全局依赖关系",
              image: "⚡"
            },
            {
              title: "网络架构特点",
              content: "• 生成器：残差块 + 自注意力 + 类别条件化\n• 判别器：残差块 + 自注意力 + 类别条件化\n• 正交正则化：改善权重矩阵\n• 截断技巧：平衡质量和多样性",
              image: "🏗️"
            },
            {
              title: "主要应用场景",
              content: "• 大规模图像生成\n• 类别条件化生成\n• 数据增强\n• 创意设计\n• 游戏资产生成\n• 科学研究数据生成",
              image: "🎨"
            },
            {
              title: "游戏目标",
              content: "通过调整模型参数，让BigGAN生成高质量的类别条件化图像。你需要：\n• 增加模型规模提升质量\n• 启用类别条件化\n• 调整正交正则化\n• 平衡截断技巧",
              image: "🎯"
            }
          ]
        })
        
        addGameMessage('🚀 BigGAN大规模图像生成挑战开始！首先了解BigGAN的技术创新和应用。', 'info')
        break
    }
  }, [addGameMessage])

  // 游戏逻辑
  const handleGameAction = useCallback((action, value) => {
    if (!selectedVariant) return

    let newScore = gameScore
    let newProgress = gameProgress

    switch (selectedVariant.id) {
      case 'dcgan':
        if (action === 'selectLayer') {
          const layer = gameData.layers.find(l => l.id === value)
          const newLayers = [...gameData.selectedLayers, layer]
          setGameData(prev => ({ 
            ...prev, 
            selectedLayers: newLayers,
            currentLayer: layer
          }))
          
          // 检查层顺序是否正确
          const correctOrder = gameData.correctOrder
          const currentOrder = newLayers.map(l => l.id)
          const isCorrect = correctOrder.slice(0, currentOrder.length).every((id, index) => id === currentOrder[index])
          
          if (isCorrect) {
            newScore = Math.min(100, newScore + 15)
            addGameMessage(`✅ 正确添加了 ${layer.name}！${layer.description}`, 'success')
            
            // 添加动画效果
            setAnimations(prev => ({ ...prev, [layer.id]: 'correct' }))
            setTimeout(() => setAnimations(prev => ({ ...prev, [layer.id]: null })), 1000)
          } else {
            newScore = Math.max(0, newScore - 5)
            addGameMessage(`❌ 层顺序错误！请按照正确的架构顺序添加层。`, 'error')
            
            // 添加错误动画
            setAnimations(prev => ({ ...prev, [layer.id]: 'error' }))
            setTimeout(() => setAnimations(prev => ({ ...prev, [layer.id]: null })), 1000)
          }
          
          newProgress = (newLayers.length / gameData.layers.length) * 100
          
          // 生成图像预览
          if (newLayers.length >= 3) {
            const quality = Math.min(1, newLayers.length / gameData.layers.length)
            setGameData(prev => ({ 
              ...prev, 
              imageQuality: quality,
              generatedImage: generatePreviewImage(quality)
            }))
          }
        }
        break

      case 'cyclegan':
        if (action === 'adjustParameter') {
          const { parameter, value: newValue } = value;
          setGameData(prev => ({ ...prev, [parameter]: newValue }));

          // Recalculate scores based on all parameters
          setGameData(prev => {
            const { cycleConsistencyLoss, identityLoss } = prev;
            const cycleScore = Math.max(0, 100 - cycleConsistencyLoss * 100);
            const identityScore = Math.max(0, 100 - identityLoss * 100);
            const overallScore = (cycleScore + identityScore) / 2;
            
            newScore = overallScore;
            newProgress = overallScore;

            if (overallScore > 85) {
              addGameMessage('✅ 参数平衡得很好！图像转换质量很高。', 'success');
            } else {
              addGameMessage('🤔 正在调整参数...继续寻找最佳平衡点。', 'info');
            }
            return prev;
          });
        }
        break;

      case 'stylegan':
        if (action === 'adjustStyle') {
          const { style, value: newValue } = value;
          setGameData(prev => ({
            ...prev,
            styles: { ...prev.styles, [style]: newValue }
          }));

          // Recalculate scores
          setGameData(prev => {
            const { styles } = prev;
            const totalStyleValue = Object.values(styles).reduce((sum, val) => sum + val, 0);
            const avgStyleValue = totalStyleValue / Object.keys(styles).length;
            
            // A simple scoring mechanism: score is higher when styles are balanced
            const variance = Object.values(styles).reduce((sum, val) => sum + Math.pow(val - avgStyleValue, 2), 0) / Object.keys(styles).length;
            newScore = Math.max(0, 100 - variance * 100);
            newProgress = (totalStyleValue / Object.keys(styles).length) * 100;

            addGameMessage(`🎨 调整了 ${style} 样式。`, 'info');
            return prev;
          });
        }
        break;

      case 'biggan':
        if (action === 'adjustModel') {
          const { parameter, value: newValue } = value;
          setGameData(prev => ({ ...prev, [parameter]: newValue }));

          // Recalculate scores
          setGameData(prev => {
            const { modelSize, classConditioning, truncationTrick } = prev;
            const sizeScore = modelSize * 25; // Model size contributes up to 25 points
            const classScore = classConditioning ? 50 : 0; // Class conditioning is crucial, 50 points
            const truncationScore = (1 - Math.abs(truncationTrick - 0.5)) * 50; // Truncation trick balanced around 0.5, up to 25 points
            const overallScore = sizeScore + classScore + truncationScore;

            newScore = overallScore;
            newProgress = overallScore;

            addGameMessage(`🔧 调整了 ${parameter}。`, 'info');
            if (overallScore > 95) {
                addGameMessage('🏆 模型参数非常棒！生成图像质量极高！', 'success');
            }
            return prev;
          });
        }
        break;
      
      case 'wgan':
        if (action === 'adjustBalance') {
          setGameData(prev => ({ ...prev, balance: value }))
          const balance = Math.abs(value - 0.5)
          newScore = Math.max(0, 100 - balance * 200)
          newProgress = Math.min(100, (1 - balance) * 100)
          
          // 模拟训练过程
          const generatorLoss = Math.random() * (1 - balance) + balance * 0.5
          const discriminatorLoss = Math.random() * balance + (1 - balance) * 0.5
          
          // 计算趋势
          const prevGeneratorLoss = gameData.generatorLoss || 0
          const prevDiscriminatorLoss = gameData.discriminatorLoss || 0
          const generatorLossTrend = generatorLoss < prevGeneratorLoss ? 'decreasing' : generatorLoss > prevGeneratorLoss ? 'increasing' : 'stable'
          const discriminatorLossTrend = discriminatorLoss < prevDiscriminatorLoss ? 'decreasing' : discriminatorLoss > prevDiscriminatorLoss ? 'increasing' : 'stable'
          
          // 计算Wasserstein距离和其他指标
          const wassersteinDistance = Math.abs(generatorLoss - discriminatorLoss)
          const gradientPenalty = Math.random() * 0.1
          const weightClipping = Math.random() * 0.2
          const learningRate = 0.0001
          
          // 更新训练状态
          let trainingStatus = 'idle'
          let trainingProgress = 0
          
          if (gameData.trainingStatus === 'training') {
            trainingProgress = Math.min(1, (gameData.trainingEpochs + 1) / 100)
            
            if (wassersteinDistance < 0.1 && balance >= 0.4 && balance <= 0.6) {
              trainingStatus = 'converging'
            } else if (wassersteinDistance > 0.5 || balance < 0.2 || balance > 0.8) {
              trainingStatus = 'diverging'
            } else {
              trainingStatus = 'training'
            }
          }
          
          setGameData(prev => ({
            ...prev,
            generatorLoss,
            discriminatorLoss,
            generatorLossTrend,
            discriminatorLossTrend,
            trainingEpochs: prev.trainingEpochs + 1,
            lossHistory: [...prev.lossHistory, { 
              generatorLoss, 
              discriminatorLoss, 
              epoch: prev.trainingEpochs + 1,
              wassersteinDistance,
              balance: value
            }],
            wassersteinDistance,
            gradientPenalty,
            weightClipping,
            learningRate,
            trainingStatus,
            trainingProgress
          }))
          
          if (newScore >= 90) {
            addGameMessage('🎉 完美平衡！训练达到目标分数，模型稳定。', 'success')
            
            // 检查成就
            const newAchievements = []
            if (newScore >= 95 && !gameData.achievements.includes('perfect_balance')) {
              newAchievements.push('perfect_balance')
              addGameMessage('🏆 成就解锁：完美平衡大师！', 'success')
            }
            if (gameData.trainingEpochs <= 50 && !gameData.achievements.includes('fast_convergence')) {
              newAchievements.push('fast_convergence')
              addGameMessage('⚡ 成就解锁：快速收敛专家！', 'success')
            }
            if (gameData.stabilityScore >= 95 && !gameData.achievements.includes('stability_master')) {
              newAchievements.push('stability_master')
              addGameMessage('🛡️ 成就解锁：稳定性大师！', 'success')
            }
            
            // 更新成就
            if (newAchievements.length > 0) {
              setGameData(prev => ({
                ...prev,
                achievements: [...prev.achievements, ...newAchievements]
              }))
            }
            
            // 检查是否完成当前等级
            if (gameProgress >= 90 && gameData.stabilityScore >= 90) {
              if (gameData.currentLevel < gameData.maxLevel) {
                addGameMessage(`🎮 第 ${gameData.currentLevel} 关完成！准备进入下一关。`, 'success')
                setGameData(prev => ({
                  ...prev,
                  successfulRuns: prev.successfulRuns + 1,
                  streakCount: prev.streakCount + 1,
                  bestScore: Math.max(prev.bestScore, newScore)
                }))
              } else {
                // 完成所有等级
                setGameState(gameStates.COMPLETED)
                addGameMessage('🏆 恭喜！你成功完成了所有WGAN训练挑战！', 'success')
                setGameData(prev => ({
                  ...prev,
                  successfulRuns: prev.successfulRuns + 1,
                  streakCount: prev.streakCount + 1,
                  bestScore: Math.max(prev.bestScore, newScore)
                }))
              }
            }
          } else if (newScore >= 70) {
            addGameMessage('👍 训练平衡良好，继续调整以达到90分。', 'info')
          } else {
            addGameMessage('⚠️ 训练不平衡，可能导致模式崩塌。', 'warning')
          }
        } else if (action === 'startTraining') {
          setGameData(prev => ({ 
            ...prev, 
            trainingStatus: 'training',
            trainingEpochs: 0,
            lossHistory: [],
            gradientHistory: [],
            wassersteinHistory: []
          }))
          addGameMessage('🚀 开始训练！观察损失曲线和收敛情况。', 'info')
          
          // 启动训练定时器
          const trainingInterval = setInterval(() => {
            setGameData(prev => {
              if (prev.trainingStatus !== 'training') {
                clearInterval(trainingInterval)
                return prev
              }
              
              const newEpochs = prev.trainingEpochs + 1
              const balance = prev.balance || 0.5
              
              // 模拟训练过程
              const generatorLoss = Math.max(0, prev.generatorLoss + (Math.random() - 0.5) * 0.1)
              const discriminatorLoss = Math.max(0, prev.discriminatorLoss + (Math.random() - 0.5) * 0.1)
              const wassersteinDistance = Math.abs(generatorLoss - discriminatorLoss)
              
              // 生成梯度历史
              const gradientValue = (Math.random() - 0.5) * 2
              const gradientHistory = [...prev.gradientHistory, { value: gradientValue, epoch: newEpochs }]
              
              // 生成Wasserstein距离历史
              const wassersteinHistory = [...prev.wassersteinHistory, { value: wassersteinDistance, epoch: newEpochs }]
              
              // 计算训练风险指标
              const modeCollapseRisk = Math.min(1, wassersteinDistance * 2)
              const gradientExplosionRisk = Math.min(1, Math.abs(gradientValue) / 2)
              const stabilityScore = Math.max(0, 100 - (wassersteinDistance * 100) - (Math.abs(balance - 0.5) * 200))
              const trainingEfficiency = Math.min(100, (newEpochs / prev.maxTrainingEpochs) * 100)
              
              // 检查训练失败条件
              let trainingStatus = prev.trainingStatus
              if (newEpochs >= prev.maxTrainingEpochs) {
                trainingStatus = 'failed'
                addGameMessage('⏰ 训练超时！已达到最大训练轮次。', 'error')
              } else if (stabilityScore <= 0) {
                trainingStatus = 'failed'
                addGameMessage('💥 训练失败！稳定性分数过低，模型崩溃。', 'error')
              } else if (modeCollapseRisk >= prev.modeCollapseThreshold) {
                trainingStatus = 'failed'
                addGameMessage('🔄 模式崩塌！生成器失去了多样性。', 'error')
              } else if (gradientExplosionRisk >= prev.gradientExplosionThreshold) {
                trainingStatus = 'failed'
                addGameMessage('💥 梯度爆炸！训练不稳定。', 'error')
              }
              
              // 检查训练成功条件
              if (stabilityScore >= 90 && wassersteinDistance <= prev.convergenceThreshold && balance >= 0.4 && balance <= 0.6) {
                trainingStatus = 'completed'
                addGameMessage('🎉 训练成功！模型达到稳定收敛状态。', 'success')
              }
              
              return {
                ...prev,
                trainingEpochs: newEpochs,
                generatorLoss,
                discriminatorLoss,
                wassersteinDistance,
                gradientHistory: gradientHistory.slice(-15),
                wassersteinHistory: wassersteinHistory.slice(-25),
                lossHistory: [...prev.lossHistory, { 
                  generatorLoss, 
                  discriminatorLoss, 
                  epoch: newEpochs,
                  wassersteinDistance,
                  balance
                }].slice(-20),
                modeCollapseRisk,
                gradientExplosionRisk,
                stabilityScore,
                trainingEfficiency,
                trainingStatus
              }
            })
          }, 1000)
          
        } else if (action === 'pauseTraining') {
          setGameData(prev => ({ ...prev, trainingStatus: 'idle' }))
          addGameMessage('⏸️ 训练已暂停。', 'info')
        } else if (action === 'resetTraining') {
          setGameData(prev => ({
            ...prev,
            trainingStatus: 'idle',
            trainingEpochs: 0,
            generatorLoss: 0,
            discriminatorLoss: 0,
            lossHistory: [],
            gradientHistory: [],
            wassersteinHistory: [],
            trainingProgress: 0,
            stabilityScore: 100,
            modeCollapseRisk: 0,
            gradientExplosionRisk: 0,
            trainingEfficiency: 0
          }))
          addGameMessage('🔄 训练已重置。', 'info')
        } else if (action === 'autoBalance') {
          // 自动平衡算法
          let targetBalance = 0.5
          const currentBalance = gameData.balance || 0.5
          
          if (currentBalance < 0.4) {
            targetBalance = 0.5 + (0.5 - currentBalance) * 0.3
          } else if (currentBalance > 0.6) {
            targetBalance = 0.5 - (currentBalance - 0.5) * 0.3
          }
          
          setGameData(prev => ({ 
            ...prev, 
            balance: targetBalance,
            autoBalanceUsed: prev.autoBalanceUsed + 1
          }))
          addGameMessage(`🤖 自动平衡：${targetBalance.toFixed(2)}`, 'info')
          
          // 触发平衡调整
          handleGameAction('adjustBalance', targetBalance)
        } else if (action === 'adjustDifficulty') {
          const difficulties = ['easy', 'normal', 'hard', 'expert']
          const currentIndex = difficulties.indexOf(gameData.difficulty)
          const newIndex = (currentIndex + 1) % difficulties.length
          const newDifficulty = difficulties[newIndex]
          
          // 根据难度调整参数
          const difficultyParams = {
            easy: { maxTrainingEpochs: 150, stabilityThreshold: 0.15, convergenceThreshold: 0.08 },
            normal: { maxTrainingEpochs: 100, stabilityThreshold: 0.1, convergenceThreshold: 0.05 },
            hard: { maxTrainingEpochs: 80, stabilityThreshold: 0.08, convergenceThreshold: 0.03 },
            expert: { maxTrainingEpochs: 60, stabilityThreshold: 0.05, convergenceThreshold: 0.02 }
          }
          
          setGameData(prev => ({
            ...prev,
            difficulty: newDifficulty,
            ...difficultyParams[newDifficulty]
          }))
          
          addGameMessage(`🎯 难度调整为：${newDifficulty.toUpperCase()}`, 'info')
        } else if (action === 'useHint') {
          if (gameData.hintsUsed < 3) {
            const hints = [
              '💡 提示：平衡值0.5是最佳选择，避免极端值',
              '💡 提示：观察损失曲线，如果两条线差距过大，需要调整平衡',
              '💡 提示：Wasserstein距离越小，训练越稳定',
              '💡 提示：梯度惩罚可以帮助稳定训练',
              '💡 提示：权重裁剪防止梯度爆炸'
            ]
            
            const randomHint = hints[Math.floor(Math.random() * hints.length)]
            addGameMessage(randomHint, 'info')
            
            setGameData(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }))
          } else {
            addGameMessage('❌ 提示次数已用完！', 'warning')
          }
        } else if (action === 'nextLevel') {
          if (gameData.currentLevel < gameData.maxLevel) {
            setGameData(prev => ({
              ...prev,
              currentLevel: prev.currentLevel + 1,
              trainingStatus: 'idle',
              trainingEpochs: 0,
              generatorLoss: 0,
              discriminatorLoss: 0,
              lossHistory: [],
              gradientHistory: [],
              wassersteinHistory: [],
              trainingProgress: 0,
              stabilityScore: 100,
              modeCollapseRisk: 0,
              gradientExplosionRisk: 0,
              trainingEfficiency: 0
            }))
            
            // 根据等级调整难度
            const levelMultiplier = 1 + (gameData.currentLevel - 1) * 0.2
            setGameData(prev => ({
              ...prev,
              maxTrainingEpochs: Math.floor(100 / levelMultiplier),
              stabilityThreshold: 0.1 / levelMultiplier,
              convergenceThreshold: 0.05 / levelMultiplier
            }))
            
            addGameMessage(`🎮 进入第 ${gameData.currentLevel} 关！难度提升。`, 'success')
          }
        }
        break
      
      case 'cyclegan':
        if (action === 'convertImage') {
          setGameData(prev => ({ ...prev, conversionProgress: value }))
          newProgress = value
          newScore = value
          
          // 模拟转换步骤
          const steps = [
            '提取源图像特征',
            '应用目标风格',
            '保持内容一致性',
            '循环一致性检查',
            '生成最终图像'
          ]
          
          const currentStep = Math.floor((value / 100) * steps.length)
          if (currentStep < steps.length) {
            addGameMessage(`🔄 ${steps[currentStep]}...`, 'info')
          }
          
          if (value >= 100) {
            const finalResult = generateCycleGANResult(gameData.sourceImage, gameData.targetStyle)
            setGameData(prev => ({ 
              ...prev, 
              finalImage: finalResult,
              cycleConsistency: 0.95,
              intermediateSteps: generateIntermediateSteps(prev.sourceImage, prev.targetStyle)
            }))
            addGameMessage('🎨 图像转换完成！循环一致性保持良好。', 'success')
          }
        } else if (action === 'changeStyle') {
          setGameData(prev => ({ ...prev, targetStyle: value, conversionProgress: 0 }))
          addGameMessage(`🎨 切换到 ${value} 风格转换`, 'info')
        }
        break
      
      case 'stylegan':
        if (action === 'adjustStyle') {
          setGameData(prev => ({
            ...prev,
            styleParams: { ...prev.styleParams, [value.param]: value.value }
          }))
          newScore = Math.min(100, newScore + 8)
          newProgress = Math.min(100, newProgress + 15)
          
          addGameMessage(`🎭 调整 ${getParamDisplayName(value.param)} 参数: ${value.value.toFixed(2)}`, 'info')
          
          // 生成人脸预览
          const faceParams = { ...gameData.styleParams, [value.param]: value.value }
          setGameData(prev => ({ 
            ...prev, 
            generatedFace: generateStyleGANFace(faceParams)
          }))
        } else if (action === 'styleMixing') {
          setGameData(prev => ({ ...prev, styleMixing: true }))
          addGameMessage('🎨 开始样式混合，观察不同样式的融合效果', 'info')
        }
        break
      
      case 'biggan':
        if (action === 'increaseSize') {
          setGameData(prev => ({ ...prev, modelSize: value }))
          newScore = Math.min(100, newScore + value * 15)
          newProgress = Math.min(100, newProgress + value * 20)
          
          // 更新质量指标
          const fidelity = Math.min(1, value / 3)
          const diversity = Math.min(1, value / 2)
          const resolution = Math.min(1, value / 4)
          
          setGameData(prev => ({
            ...prev,
            qualityMetrics: { fidelity, diversity, resolution }
          }))
          
          addGameMessage(`🏗️ 模型规模增加到 ${value}x，生成质量提升！`, 'success')
        } else if (action === 'toggleClassConditioning') {
          setGameData(prev => ({ ...prev, classConditioning: !prev.classConditioning }))
          addGameMessage('🏷️ 类别条件控制已切换', 'info')
        } else if (action === 'changeCategory') {
          setGameData(prev => ({ ...prev, currentCategory: value }))
          addGameMessage(`🏷️ 切换到 ${value} 类别`, 'info')
        }
        break
    }

    setGameScore(newScore)
    setGameProgress(newProgress)

    // 检查完成条件
    if (selectedVariant.id === 'wgan') {
      if (newScore >= 90 && !gameData.isCompleting && gameData.gamePhase !== 'completed') {
        addGameMessage('🎉 达到目标分数，展示最终效果…', 'success')
        scheduleCompletion(2500)
      }
    } else if (selectedVariant.id === 'dcgan') {
      if (newProgress >= 100 && !gameData.isCompleting && gameData.gamePhase !== 'completed') {
        addGameMessage('🎉 构建完成，展示最终效果…', 'success')
        scheduleCompletion(5000)
      }
    } else if (newProgress >= 100 && !gameData.isCompleting && gameData.gamePhase !== 'completed') {
      addGameMessage('🎉 转换/构建完成，展示最终效果…', 'success')
      scheduleCompletion(2500)
    }
  }, [selectedVariant, gameScore, gameProgress, gameData, addGameMessage])

  // 生成预览图像
  const generatePreviewImage = (quality) => {
    // 根据质量生成更真实的图像
    const size = Math.floor(16 + quality * 16) // 更大的图像尺寸
    const image = []
    
    // 模拟不同质量下的图像特征
    for (let i = 0; i < size; i++) {
      const row = []
      for (let j = 0; j < size; j++) {
        const noise = Math.random()
        const distanceFromCenter = Math.sqrt((i - size/2) ** 2 + (j - size/2) ** 2)
        const centerWeight = Math.max(0, 1 - distanceFromCenter / (size/2))
        
        // 根据质量和位置生成像素
        if (quality > 0.8) {
          // 高质量：清晰的形状
          if (noise < 0.7 + centerWeight * 0.3) {
            row.push('█')
          } else if (noise < 0.9) {
            row.push('▓')
          } else {
            row.push('░')
          }
        } else if (quality > 0.5) {
          // 中等质量：模糊的形状
          if (noise < 0.5 + centerWeight * 0.3) {
            row.push('▓')
          } else if (noise < 0.8) {
            row.push('░')
          } else {
            row.push(' ')
          }
        } else {
          // 低质量：噪声
          if (noise < 0.3 + centerWeight * 0.2) {
            row.push('░')
          } else {
            row.push(' ')
          }
        }
      }
      image.push(row.join(''))
    }
    return image
  }

  // 已移除神经网络3D可视化功能

  // 生成CycleGAN结果
  const generateCycleGANResult = (source, target) => {
    const styles = {
      horse: { zebra: '🦓', horse: '🐎', apple: '🍎', orange: '🍊' },
      zebra: { horse: '🐎', zebra: '🦓', apple: '🍎', orange: '🍊' },
      apple: { orange: '🍊', horse: '🐎', zebra: '🦓', apple: '🍎' },
      orange: { apple: '🍎', horse: '🐎', zebra: '🦓', orange: '🍊' }
    }
    return styles[source]?.[target] || '🖼️'
  }

  // 生成中间步骤
  const generateIntermediateSteps = (source, target) => {
    const steps = []
    for (let i = 0; i < 5; i++) {
      const progress = i / 4
      const sourceEmoji = source === 'horse' ? '🐎' : source === 'zebra' ? '🦓' : source === 'apple' ? '🍎' : '🍊'
      const targetEmoji = target === 'horse' ? '🐎' : target === 'zebra' ? '🦓' : target === 'apple' ? '🍎' : '🍊'
      
      if (progress < 0.5) {
        steps.push(sourceEmoji)
      } else {
        steps.push(targetEmoji)
      }
    }
    return steps
  }

  // 生成StyleGAN人脸
  const generateStyleGANFace = (params) => {
    const faces = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇']
    const index = Math.floor((params.age + params.gender + params.expression) / 3 * faces.length)
    return faces[index % faces.length]
  }

  // 获取参数显示名称
  const getParamDisplayName = (param) => {
    const names = {
      age: '年龄',
      gender: '性别',
      expression: '表情',
      hairStyle: '发型',
      skinTone: '肤色',
      eyeColor: '眼睛颜色'
    }
    return names[param] || param
  }

  // 显示提示
  const toggleHint = useCallback(() => {
    setShowHint(!showHint)
  }, [showHint])

  // 渲染游戏界面
  const renderGame = () => {
    if (!selectedVariant) return null

    switch (selectedVariant.id) {
      case 'dcgan':
        return (
          <div className="game-container dcgan-game">
            {/* 游戏阶段指示器 */}
            <div className="game-phase-indicator">
              <div className={`phase-step ${gameData.gamePhase === 'introduction' ? 'active' : ''}`}>
                <span className="phase-icon">📚</span>
                <span className="phase-label">学习阶段</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'setup' ? 'active' : ''}`}>
                <span className="phase-icon">⚙️</span>
                <span className="phase-label">参数设置</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'training' ? 'active' : ''}`}>
                <span className="phase-icon">🚀</span>
                <span className="phase-label">训练阶段</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'completed' ? 'active' : ''}`}>
                <span className="phase-icon">🏆</span>
                <span className="phase-label">完成</span>
              </div>
            </div>

            {/* 介绍阶段 */}
            {gameData.gamePhase === 'introduction' && (
              <div className="introduction-phase">
                <div className="introduction-header">
                  <h2>🎓 DCGAN (Deep Convolutional GAN) 学习</h2>
                  <p>了解DCGAN的基本概念、网络架构和应用场景</p>
                </div>
                
                <div className="introduction-content">
                  <div className="introduction-step">
                    <div className="step-header">
                      <span className="step-image">{gameData.introductionSteps[gameData.currentStep]?.image}</span>
                      <h3>{gameData.introductionSteps[gameData.currentStep]?.title}</h3>
                    </div>
                    <div className="step-content">
                      <p>{gameData.introductionSteps[gameData.currentStep]?.content}</p>
                    </div>
                  </div>
                  
                  <div className="introduction-navigation">
                    <button 
                      className="nav-btn prev-btn"
                      onClick={() => setGameData(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))}
                      disabled={gameData.currentStep === 0}
                    >
                      ← 上一步
              </button>
                    
                    <span className="step-counter">
                      {gameData.currentStep + 1} / {gameData.introductionSteps.length}
                    </span>
                    
                    {gameData.currentStep < gameData.introductionSteps.length - 1 ? (
                      <button 
                        className="nav-btn next-btn"
                        onClick={() => setGameData(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))}
                      >
                        下一步 →
                      </button>
                    ) : (
                      <button 
                        className="nav-btn start-btn"
                        onClick={() => setGameData(prev => ({ ...prev, gamePhase: 'setup' }))}
                      >
                        开始游戏 →
                      </button>
                    )}
            </div>
                </div>
              </div>
            )}

                        {/* 游戏阶段 */}
            {gameData.gamePhase === 'setup' && (
              <div className="setup-phase">
                <div className="setup-header">
                  <h3>🎮 DCGAN网络构建游戏</h3>
              <p>网络层顺序已被打乱，请按正确顺序重新排列</p>
              <button className="hint-btn" onClick={toggleHint}>
                {showHint ? '隐藏提示' : '显示提示'}
              </button>
            </div>
            
            {showHint && (
              <div className="hint-box">
                <h4>💡 提示</h4>
                <p>DCGAN的正确架构顺序：输入层 → 全连接层 → 重塑层 → 卷积层 → 输出层</p>
                <p>每个层都有特定的作用，按顺序连接可以获得最佳效果。</p>
              </div>
            )}
            
            <div className="game-content">
              <div className="dcgan-grid">
                <div className="dcgan-left">
                  <div className="network-builder">
                <h4>网络层选择</h4>
                <div className="network-layers">
                  {shuffleArray(gameData.layers || []).map((layer) => (
                    <button
                      key={layer.id}
                      className={`network-layer ${gameData.selectedLayers?.find(l => l.id === layer.id) ? 'selected' : ''} ${layer.type} ${animations[layer.id] || ''}`}
                      onClick={() => handleGameAction('selectLayer', layer.id)}
                      disabled={gameData.selectedLayers?.find(l => l.id === layer.id)}
                    >
                      <div className="layer-name">{layer.name}</div>
                      <div className="layer-desc">{layer.description}</div>
                      <div className="layer-neurons">{layer.neurons} 神经元</div>
                    </button>
                  ))}
                </div>
                  </div>
                  <div className="image-preview">
                    <h4>生成图像预览</h4>
                    <div className="preview-container">
                      {gameData.generatedImage ? (
                        <div className="generated-image-container">
                          <div className="generated-image">
                            {gameData.generatedImage.map((row, index) => (
                              <div key={index} className="image-row">
                                {row.split('').map((pixel, pixelIndex) => (
                                  <span key={pixelIndex} className={`pixel ${pixel === '█' ? 'filled' : pixel === '▓' ? 'partial' : pixel === '░' ? 'light' : 'empty'}`}>
                                    {pixel}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                          <div className="image-stats">
                            <div className="quality-indicator">
                              <span className="quality-label">图像质量:</span>
                              <span className="quality-value">{Math.round(gameData.imageQuality * 100)}%</span>
                            </div>
                            <div className="resolution-info">
                              <span className="resolution-label">分辨率:</span>
                              <span className="resolution-value">{gameData.generatedImage.length}×{gameData.generatedImage[0]?.length || 0}</span>
                            </div>
                            <div className="pixel-distribution">
                              <span className="distribution-label">像素分布:</span>
                              <div className="distribution-bars">
                                <div className="dist-bar filled" style={{ width: `${Math.random() * 40 + 20}%` }}></div>
                                <div className="dist-bar partial" style={{ width: `${Math.random() * 30 + 15}%` }}></div>
                                <div className="dist-bar light" style={{ width: `${Math.random() * 20 + 10}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="no-image">
                          <div className="no-image-icon">🖼️</div>
                          <div className="no-image-text">尚未生成图像</div>
                          <div className="no-image-hint">请至少选择3个网络层来开始生成</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="dcgan-right"></div>
              </div>
            </div>
            
            <div className="game-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${gameProgress}%` }}></div>
              </div>
              <span>构建进度: {gameProgress.toFixed(0)}%</span>
            </div>
                
                <div className="setup-actions">
                  <button 
                    className="action-btn back-btn"
                    onClick={() => setGameData(prev => ({ ...prev, gamePhase: 'introduction', currentStep: 0 }))}
                  >
                    ← 返回学习
                  </button>
                  
                  <button 
                    className="action-btn start-game-btn"
                    onClick={() => {
                      setGameData(prev => ({ ...prev, gamePhase: 'game' }))
                      addGameMessage('🎮 开始DCGAN网络构建游戏！', 'info')
                    }}
                  >
                    开始游戏
                  </button>
                </div>
              </div>
            )}
            
            {/* 游戏进行阶段 */}
            {gameData.gamePhase === 'game' && (
              <div className="game-phase">
                <div className="game-header">
                  <h3>🎮 DCGAN网络构建进行中</h3>
                  <p>继续构建网络，观察图像质量提升</p>
                </div>
                
                <div className="game-content">
                  <div className="dcgan-grid">
                    <div className="dcgan-left">
                      <div className="network-builder">
                        <h4>网络层选择</h4>
                        <div className="network-layers">
                          {shuffleArray(gameData.layers || []).map((layer) => (
                            <button
                              key={layer.id}
                              className={`network-layer ${gameData.selectedLayers?.find(l => l.id === layer.id) ? 'selected' : ''} ${layer.type} ${animations[layer.id] || ''}`}
                              onClick={() => handleGameAction('selectLayer', layer.id)}
                              disabled={gameData.selectedLayers?.find(l => l.id === layer.id)}
                            >
                              <div className="layer-name">{layer.name}</div>
                              <div className="layer-desc">{layer.description}</div>
                              <div className="layer-neurons">{layer.neurons} 神经元</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="image-preview">
                        <h4>生成图像预览</h4>
                        <div className="preview-container">
                          {gameData.generatedImage ? (
                            <div className="generated-image-container">
                              <div className="generated-image">
                                {gameData.generatedImage.map((row, index) => (
                                  <div key={index} className="image-row">
                                    {row.split('').map((pixel, pixelIndex) => (
                                      <span key={pixelIndex} className={`pixel ${pixel === '█' ? 'filled' : pixel === '▓' ? 'partial' : pixel === '░' ? 'light' : 'empty'}`}>
                                        {pixel}
                                      </span>
                                    ))}
                                  </div>
                                ))}
                              </div>
                              <div className="image-stats">
                                <div className="quality-indicator">
                                  <span className="quality-label">图像质量:</span>
                                  <span className="quality-value">{Math.round(gameData.imageQuality * 100)}%</span>
                                </div>
                                <div className="resolution-info">
                                  <span className="resolution-label">分辨率:</span>
                                  <span className="resolution-value">{gameData.generatedImage.length}×{gameData.generatedImage[0]?.length || 0}</span>
                                </div>
                                <div className="pixel-distribution">
                                  <span className="distribution-label">像素分布:</span>
                                  <div className="distribution-bars">
                                    <div className="dist-bar filled" style={{ width: `${Math.random() * 40 + 20}%` }}></div>
                                    <div className="dist-bar partial" style={{ width: `${Math.random() * 30 + 15}%` }}></div>
                                    <div className="dist-bar light" style={{ width: `${Math.random() * 20 + 10}%` }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="no-image">
                              <div className="no-image-icon">🖼️</div>
                              <div className="no-image-text">尚未生成图像</div>
                              <div className="no-image-hint">请至少选择3个网络层来开始生成</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="dcgan-right"></div>
                  </div>
                </div>
                
                <div className="game-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${gameProgress}%` }}></div>
                  </div>
                  <span>构建进度: {gameProgress.toFixed(0)}%</span>
                </div>
              </div>
            )}

            {/* 游戏完成状态 */}
            {gameData.gamePhase === 'completed' && (
              <div className="game-completed">
                <h3>🎉 完成挑战！</h3>
                <p>恭喜你成功完成了DCGAN挑战！</p>
                <div className="completion-stats">
                  <div className="stat">
                    <span className="stat-label">最终稳定性分数</span>
                    <span className="stat-value">{Math.round(gameData.stabilityScore)}</span>
              </div>
                  <div className="stat">
                    <span className="stat-label">训练时间</span>
                    <span className="stat-value">{gameData.gameTime}s</span>
            </div>
                  <div className="stat">
                    <span className="stat-label">训练轮次</span>
                    <span className="stat-value">{gameData.trainingEpochs}</span>
                  </div>
                </div>
                
                <div className="completion-actions">
                  <button 
                    className="control-btn return-main"
                    onClick={() => {
                      setGameState(gameStates.SELECTING)
                      setShowGame(false)
                      setSelectedVariant(null)
                    }}
                  >
                    🏠 返回GAN变体主页
                  </button>
                </div>
              </div>
            )}
          </div>
        )

      case 'wgan':
        return (
          <div className="game-container wgan-game">
            {/* 游戏阶段指示器 */}
            <div className="game-phase-indicator">
              <div className={`phase-step ${gameData.gamePhase === 'introduction' ? 'active' : ''}`}>
                <span className="phase-icon">📚</span>
                <span className="phase-label">学习阶段</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'setup' ? 'active' : ''}`}>
                <span className="phase-icon">⚙️</span>
                <span className="phase-label">参数设置</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'training' ? 'active' : ''}`}>
                <span className="phase-icon">🚀</span>
                <span className="phase-label">训练阶段</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'completed' ? 'active' : ''}`}>
                <span className="phase-icon">🏆</span>
                <span className="phase-label">完成</span>
              </div>
            </div>
            
            {/* 介绍阶段 */}
            {gameData.gamePhase === 'introduction' && (
              <div className="introduction-phase">
                <div className="introduction-header">
                  <h2>🎓 WGAN (Wasserstein GAN) 学习</h2>
                  <p>了解WGAN的基本概念、优势和应用场景</p>
                </div>
                
                <div className="introduction-content">
                  <div className="introduction-step">
                    <div className="step-header">
                      <span className="step-image">{gameData.introductionSteps[gameData.currentStep]?.image}</span>
                      <h3>{gameData.introductionSteps[gameData.currentStep]?.title}</h3>
                    </div>
                    <div className="step-content">
                      <p>{gameData.introductionSteps[gameData.currentStep]?.content}</p>
                    </div>
                  </div>
                  
                  <div className="introduction-navigation">
                    <button 
                      className="nav-btn prev-btn"
                      onClick={() => setGameData(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))}
                      disabled={gameData.currentStep === 0}
                    >
                      ← 上一步
                    </button>
                    
                    <span className="step-counter">
                      {gameData.currentStep + 1} / {gameData.introductionSteps.length}
                    </span>
                    
                    {gameData.currentStep < gameData.introductionSteps.length - 1 ? (
                      <button 
                        className="nav-btn next-btn"
                        onClick={() => setGameData(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))}
                      >
                        下一步 →
                      </button>
                    ) : (
                      <button 
                        className="nav-btn start-btn"
                        onClick={() => setGameData(prev => ({ ...prev, gamePhase: 'setup' }))}
                      >
                        开始游戏 →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 参数设置阶段 */}
            {gameData.gamePhase === 'setup' && (
              <div className="setup-phase">
                <div className="setup-header">
                  <h3>⚙️ 训练参数设置</h3>
                  <p>调整训练参数，为WGAN训练做准备</p>
                </div>
                
                <div className="setup-content">
                  <div className="parameter-group">
                    <h4>🎯 训练平衡参数</h4>
              <div className="balance-control">
                      <div className="balance-labels">
                        <span className="label generator">生成器主导</span>
                        <span className="label balanced">平衡</span>
                        <span className="label discriminator">判别器主导</span>
                      </div>
                      
                      <div className="balance-slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                          value={gameData.balance}
                          onChange={(e) => setGameData(prev => ({ ...prev, balance: parseFloat(e.target.value) }))}
                          className="balance-slider"
                />
                        <div className="balance-value">
                          当前值: {gameData.balance.toFixed(2)}
                </div>
                      </div>
                      
                      <div className="balance-zones">
                        <div className="zone danger" style={{ width: '40%' }}>危险区</div>
                        <div className="zone warning" style={{ width: '20%' }}>警告区</div>
                        <div className="zone safe" style={{ width: '20%' }}>安全区</div>
                        <div className="zone warning" style={{ width: '20%' }}>警告区</div>
                      </div>
                </div>
              </div>
              
                  <div className="parameter-group">
                    <h4>⚡ 训练设置</h4>
                    <div className="training-settings">
                      <div className="setting-item">
                        <label>训练速度:</label>
                        <select 
                          value={gameData.trainingSpeed}
                          onChange={(e) => setGameData(prev => ({ ...prev, trainingSpeed: parseInt(e.target.value) }))}
                        >
                          <option value={1}>1x (正常)</option>
                          <option value={2}>2x (快速)</option>
                          <option value={4}>4x (极速)</option>
                        </select>
                </div>
                      
                      <div className="setting-item">
                        <label>自动模式:</label>
                        <input
                          type="checkbox"
                          checked={gameData.autoMode}
                          onChange={(e) => setGameData(prev => ({ ...prev, autoMode: e.target.checked }))}
                        />
                        <span className="setting-hint">启用后系统会自动调整参数</span>
                </div>
                </div>
                </div>
                  
                  <div className="setup-actions">
                    <button 
                      className="action-btn back-btn"
                      onClick={() => setGameData(prev => ({ ...prev, gamePhase: 'introduction', currentStep: 0 }))}
                    >
                      ← 返回学习
                    </button>
                    
                    <button 
                      className="action-btn start-training-btn"
                      onClick={() => {
                        setGameData(prev => ({ 
                          ...prev, 
                          gamePhase: 'training',
                          isTraining: true
                        }))
                        addGameMessage('🚀 开始WGAN训练！观察训练过程和指标变化。', 'info')
                        startTrainingSimulator()
                      }}
                    >
                      开始训练
                    </button>
              </div>
                </div>
              </div>
            )}

            {/* 训练阶段 */}
            {gameData.gamePhase === 'training' && (
              <div className="training-phase">
                <div className="training-header">
                  <h3>🚀 WGAN训练进行中</h3>
                  <div className="training-controls">
                    <button 
                      className={`control-btn ${gameData.isTraining ? 'pause-btn' : 'play-btn'}`}
                      onClick={() => {
                        if (gameData.isTraining) {
                          setGameData(prev => ({ ...prev, isTraining: false }))
                          stopTrainingSimulator()
                          addGameMessage('⏸️ 训练已暂停。', 'info')
                        } else {
                          setGameData(prev => ({ ...prev, isTraining: true }))
                          startTrainingSimulator()
                          addGameMessage('▶️ 训练已继续。', 'info')
                        }
                      }}
                    >
                      {gameData.isTraining ? '⏸️ 暂停' : '▶️ 继续'}
                    </button>
                    
                    <button 
                      className="control-btn reset-btn"
                      onClick={() => {
                        stopTrainingSimulator()
                        setGameData(prev => ({ 
                          ...prev, 
                          isTraining: false,
                          trainingEpochs: 0,
                          generatorLoss: 0.5,
                          discriminatorLoss: 0.5,
                          stabilityScore: 100,
                          modeCollapseRisk: 0,
                          gradientExplosionRisk: 0,
                          wassersteinDistance: 0,
                          lossHistory: [],
                          gradientHistory: [],
                          wassersteinHistory: [],
                          gameTime: 0
                        }))
                        addGameMessage('🔄 训练已重置，可以重新开始。', 'info')
                      }}
                    >
                      🔄 重置
                    </button>
                    
                    <button 
                      className="control-btn auto-balance-btn"
                      onClick={() => {
                        const newBalance = 0.5 + (Math.random() - 0.5) * 0.2
                        setGameData(prev => ({ 
                          ...prev, 
                          balance: newBalance,
                          autoBalanceUsed: prev.autoBalanceUsed + 1
                        }))
                        addGameMessage(`🤖 自动平衡：${newBalance.toFixed(2)}`, 'info')
                      }}
                    >
                      🤖 自动平衡
                    </button>
                  </div>
                </div>
                
                <div className="training-content">
                  {/* 训练状态面板 */}
                  <div className="training-status-panel">
                    <div className="status-item">
                      <span className="status-label">训练轮次</span>
                      <span className="status-value">{gameData.trainingEpochs} / {gameData.maxTrainingEpochs}</span>
                    </div>
                    
                    <div className="status-item">
                      <span className="status-label">稳定性分数</span>
                      <span className={`status-value ${gameData.stabilityScore >= 90 ? 'success' : gameData.stabilityScore >= 70 ? 'warning' : 'danger'}`}>
                        {Math.round(gameData.stabilityScore)}
                      </span>
                    </div>
                    
                    <div className="status-item">
                      <span className="status-label">训练时间</span>
                      <span className="status-value">{gameData.gameTime}s</span>
                    </div>
                  </div>
                  
                  {/* 实时指标监控 */}
                  <div className="metrics-monitoring">
                    <h4>📊 实时训练指标</h4>
                    <div className="metrics-grid">
                      <div className="metric-card">
                        <div className="metric-header">
                          <span className="metric-icon">🎨</span>
                          <span className="metric-label">生成器损失</span>
                        </div>
                        <div className="metric-value">{gameData.generatorLoss.toFixed(4)}</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill generator" 
                            style={{ width: `${Math.min(gameData.generatorLoss * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="metric-card">
                        <div className="metric-header">
                          <span className="metric-icon">🔍</span>
                          <span className="metric-label">判别器损失</span>
                        </div>
                        <div className="metric-value">{gameData.discriminatorLoss.toFixed(4)}</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill discriminator" 
                            style={{ width: `${Math.min(gameData.discriminatorLoss * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="metric-card">
                        <div className="metric-header">
                          <span className="metric-icon">🛡️</span>
                          <span className="metric-label">模式崩塌风险</span>
                        </div>
                        <div className="metric-value">{Math.round(gameData.modeCollapseRisk * 100)}%</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill risk" 
                            style={{ width: `${gameData.modeCollapseRisk * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="metric-card">
                        <div className="metric-header">
                          <span className="metric-icon">💥</span>
                          <span className="metric-label">梯度爆炸风险</span>
                        </div>
                        <div className="metric-value">{Math.round(gameData.gradientExplosionRisk * 100)}%</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill risk" 
                            style={{ width: `${gameData.gradientExplosionRisk * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 损失曲线图 */}
              <div className="loss-chart">
                    <h4>📈 损失曲线</h4>
                <div className="chart-container">
                      <div className="chart-y-axis">
                        <span>1.0</span>
                        <span>0.8</span>
                        <span>0.6</span>
                        <span>0.4</span>
                        <span>0.2</span>
                        <span>0.0</span>
                      </div>
                      <div className="chart-content">
                        {gameData.lossHistory.slice(-20).map((point, index) => (
                    <div key={index} className="chart-point">
                            <div className="point-tooltip">
                              <div>轮次: {point.epoch}</div>
                              <div>G损失: {point.generatorLoss.toFixed(4)}</div>
                              <div>D损失: {point.discriminatorLoss.toFixed(4)}</div>
                            </div>
                      <div className="g-loss" style={{ height: `${point.generatorLoss * 100}%` }}></div>
                      <div className="d-loss" style={{ height: `${point.discriminatorLoss * 100}%` }}></div>
                    </div>
                  ))}
                      </div>
                      <div className="chart-x-axis">
                        <span>0</span>
                        <span>5</span>
                        <span>10</span>
                        <span>15</span>
                        <span>20</span>
                      </div>
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><span className="legend-color g-loss"></span>生成器损失</span>
                  <span className="legend-item"><span className="legend-color d-loss"></span>判别器损失</span>
                </div>
              </div>
                  
                  {/* 训练建议 */}
                  <div className="training-advice">
                    <h4>💡 训练建议</h4>
                    <div className="advice-content">
                      {gameData.balance < 0.3 && (
                        <div className="advice-item warning">
                          <span className="advice-icon">⚠️</span>
                          <span className="advice-text">生成器训练过强，可能导致模式崩塌。建议增加判别器训练强度。</span>
            </div>
                      )}
                      {gameData.balance > 0.7 && (
                        <div className="advice-item warning">
                          <span className="advice-icon">⚠️</span>
                          <span className="advice-text">判别器训练过强，可能阻碍生成器学习。建议平衡训练强度。</span>
                        </div>
                      )}
                      {gameData.balance >= 0.4 && gameData.balance <= 0.6 && (
                        <div className="advice-item success">
                          <span className="advice-icon">✅</span>
                          <span className="advice-text">训练平衡良好！保持这个平衡值可以获得稳定的训练效果。</span>
                        </div>
                      )}
                      {gameData.modeCollapseRisk > 0.6 && (
                        <div className="advice-item danger">
                          <span className="advice-icon">🚨</span>
                          <span className="advice-text">模式崩塌风险很高！建议立即调整平衡值或重置训练。</span>
                        </div>
                      )}
                      {gameData.gradientExplosionRisk > 0.7 && (
                        <div className="advice-item danger">
                          <span className="advice-icon">💥</span>
                          <span className="advice-text">梯度爆炸风险很高！建议降低学习率或使用梯度惩罚。</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 游戏完成状态 */}
            {gameData.gamePhase === 'completed' && (
              <div className="game-completed">
                <h3>🎉 训练完成！</h3>
                <p>恭喜你成功完成了WGAN训练挑战！</p>
                <div className="completion-stats">
                  <div className="stat">
                    <span className="stat-label">最终稳定性分数</span>
                    <span className="stat-value">{Math.round(gameData.stabilityScore)}</span>
              </div>
                  <div className="stat">
                    <span className="stat-label">训练时间</span>
                    <span className="stat-value">{gameData.gameTime}s</span>
            </div>
                  <div className="stat">
                    <span className="stat-label">训练轮次</span>
                    <span className="stat-value">{gameData.trainingEpochs}</span>
                  </div>
                </div>
                
                <div className="completion-actions">
                  <button 
                    className="control-btn next-variant"
                    onClick={() => resetGame()}
                  >
                    尝试其他变体
                  </button>
                  
                  <button 
                    className="control-btn return-main"
                    onClick={() => {
                      setGameState(gameStates.SELECTING)
                      setShowGame(false)
                      setSelectedVariant(null)
                    }}
                  >
                    🏠 返回GAN变体主页
                  </button>
                </div>
              </div>
            )}
          </div>
        )

      case 'cyclegan':
        return (
          <div className="game-container cyclegan-game">
            {/* 游戏阶段指示器 */}
            <div className="game-phase-indicator">
              <div className={`phase-step ${gameData.gamePhase === 'introduction' ? 'active' : ''}`}>
                <span className="phase-icon">📚</span>
                <span className="phase-label">学习阶段</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'setup' ? 'active' : ''}`}>
                <span className="phase-icon">⚙️</span>
                <span className="phase-label">参数设置</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'training' ? 'active' : ''}`}>
                <span className="phase-icon">🚀</span>
                <span className="phase-label">训练阶段</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'completed' ? 'active' : ''}`}>
                <span className="phase-icon">🏆</span>
                <span className="phase-label">完成</span>
              </div>
            </div>
            
            {/* 介绍阶段 */}
            {gameData.gamePhase === 'introduction' && (
              <div className="introduction-phase">
                <div className="introduction-header">
                  <h2>🎓 CycleGAN 学习</h2>
                  <p>了解CycleGAN的基本原理、网络架构和应用场景</p>
                </div>
                
                <div className="introduction-content">
                  <div className="introduction-step">
                    <div className="step-header">
                      <span className="step-image">{gameData.introductionSteps[gameData.currentStep]?.image}</span>
                      <h3>{gameData.introductionSteps[gameData.currentStep]?.title}</h3>
                    </div>
                    <div className="step-content">
                      <p>{gameData.introductionSteps[gameData.currentStep]?.content}</p>
                    </div>
                  </div>
                  
                  <div className="introduction-navigation">
                    <button 
                      className="nav-btn prev-btn"
                      onClick={() => setGameData(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))}
                      disabled={gameData.currentStep === 0}
                    >
                      ← 上一步
                    </button>
                    
                    <span className="step-counter">
                      {gameData.currentStep + 1} / {gameData.introductionSteps.length}
                    </span>
                    
                    {gameData.currentStep < gameData.introductionSteps.length - 1 ? (
                      <button 
                        className="nav-btn next-btn"
                        onClick={() => setGameData(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))}
                      >
                        下一步 →
                      </button>
                    ) : (
                      <button 
                        className="nav-btn start-btn"
                        onClick={() => setGameData(prev => ({ ...prev, gamePhase: 'setup' }))}
                      >
                        开始游戏 →
                      </button>
                    )}
                </div>
                </div>
              </div>
            )}

            {/* 游戏阶段 */}
            {gameData.gamePhase === 'setup' && (
              <div className="setup-phase">
                <div className="setup-header">
                  <h3>🎨 CycleGAN风格转换游戏</h3>
                  <p>选择源图像和目标风格，观察风格转换效果</p>
                  <button className="hint-btn" onClick={toggleHint}>
                    {showHint ? '隐藏提示' : '显示提示'}
                  </button>
                </div>
                
                {showHint && (
                  <div className="hint-box">
                    <h4>💡 提示</h4>
                    <p>CycleGAN可以实现无配对数据的风格转换，通过循环一致性损失保持图像内容不变。</p>
                    <p>选择合适的损失权重可以获得更好的转换效果。</p>
                  </div>
                )}
            
            <div className="game-content">
                  <div className="style-transfer-controls">
                    <h4>🎯 风格转换控制</h4>
                    <div className="transfer-settings">
                      <div className="setting-group">
                        <label>源图像类型:</label>
                  <select 
                    value={gameData.sourceImage} 
                          onChange={(e) => handleGameAction('changeSource', e.target.value)}
                        >
                          <option value="horse">🐎 马</option>
                          <option value="zebra">🦓 斑马</option>
                          <option value="apple">🍎 苹果</option>
                          <option value="orange">🍊 橙子</option>
                  </select>
                </div>
                
                      <div className="setting-group">
                  <label>目标风格:</label>
                  <select 
                    value={gameData.targetStyle}
                          onChange={(e) => handleGameAction('changeTarget', e.target.value)}
                        >
                          <option value="zebra">🦓 斑马风格</option>
                          <option value="horse">🐎 马风格</option>
                          <option value="orange">🍊 橙子风格</option>
                          <option value="apple">🍎 苹果风格</option>
                  </select>
                </div>
                
                      <div className="setting-group">
                        <label>循环一致性损失权重:</label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={gameData.cycleConsistencyLoss}
                          onChange={(e) => setGameData(prev => ({ ...prev, cycleConsistencyLoss: parseFloat(e.target.value) }))}
                          className="weight-slider"
                        />
                        <span className="weight-value">{gameData.cycleConsistencyLoss}</span>
                      </div>
                      
                      <div className="setting-group">
                        <label>身份映射损失权重:</label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={gameData.identityLoss}
                          onChange={(e) => setGameData(prev => ({ ...prev, identityLoss: parseFloat(e.target.value) }))}
                          className="weight-slider"
                        />
                        <span className="weight-value">{gameData.identityLoss}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="style-transfer-preview">
                    <h4>风格转换预览</h4>
                    <div className="transfer-preview-container">
                      <div className="image-pair">
                        <div className="source-image">
                          <div className="image-label">源图像</div>
                          <div className="image-content">
                            {gameData.sourceImage === 'horse' ? '🐎' : gameData.sourceImage === 'zebra' ? '🦓' : gameData.sourceImage === 'apple' ? '🍎' : '🍊'}
                          </div>
                        </div>
                        
                        <div className="transfer-arrow">→</div>
                        
                        <div className="target-image">
                          <div className="image-label">目标风格</div>
                          <div className="image-content">
                            {gameData.targetStyle === 'horse' ? '🐎' : gameData.targetStyle === 'zebra' ? '🦓' : gameData.targetStyle === 'apple' ? '🍎' : '🍊'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="transfer-steps">
                        <h5>转换过程</h5>
                        <div className="steps-container">
                          {generateIntermediateSteps(gameData.sourceImage, gameData.targetStyle).map((step, index) => (
                            <div key={index} className="step-item">
                              <span className="step-emoji">{step}</span>
                              <span className="step-label">步骤 {index + 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="cycle-consistency-monitor">
                    <h4>🔄 循环一致性监控</h4>
                    <div className="consistency-metrics">
                      <div className="metric-item">
                        <span className="metric-label">循环一致性损失:</span>
                        <span className="metric-value">{gameData.cycleConsistencyLoss.toFixed(2)}</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill cycle" 
                            style={{ width: `${(gameData.cycleConsistencyLoss / 2) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="metric-item">
                        <span className="metric-label">身份映射损失:</span>
                        <span className="metric-value">{gameData.identityLoss.toFixed(2)}</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill identity" 
                            style={{ width: `${(gameData.identityLoss / 2) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="setup-actions">
                <button 
                    className="action-btn back-btn"
                    onClick={() => setGameData(prev => ({ ...prev, gamePhase: 'introduction', currentStep: 0 }))}
                  >
                    ← 返回学习
                  </button>
                  
                  <button 
                    className="action-btn start-game-btn"
                  onClick={() => {
                      setGameData(prev => ({ ...prev, gamePhase: 'game' }))
                      addGameMessage('🎨 开始CycleGAN风格转换游戏！', 'info')
                    }}
                  >
                    开始游戏
                </button>
              </div>
              </div>
            )}

            {/* 游戏进行阶段 */}
            {gameData.gamePhase === 'game' && (
              <div className="game-phase">
                <div className="game-header">
                  <h3>🎨 CycleGAN风格转换进行中</h3>
                  <p>继续调整参数，观察风格转换效果</p>
                    </div>
                
                <div className="game-content">
                  <div className="style-transfer-controls">
                    <h4>🎯 风格转换控制</h4>
                    <div className="transfer-settings">
                      <div className="setting-group">
                        <label>源图像类型:</label>
                        <select 
                          value={gameData.sourceImage}
                          onChange={(e) => handleGameAction('changeSource', e.target.value)}
                        >
                          <option value="horse">🐎 马</option>
                          <option value="zebra">🦓 斑马</option>
                          <option value="apple">🍎 苹果</option>
                          <option value="orange">🍊 橙子</option>
                        </select>
                  </div>
                  
                      <div className="setting-group">
                        <label>目标风格:</label>
                        <select 
                          value={gameData.targetStyle}
                          onChange={(e) => handleGameAction('changeTarget', e.target.value)}
                        >
                          <option value="zebra">🦓 斑马风格</option>
                          <option value="horse">🐎 马风格</option>
                          <option value="orange">🍊 橙子风格</option>
                          <option value="apple">🍎 苹果风格</option>
                        </select>
                    </div>
                      
                      <div className="setting-group">
                        <label>循环一致性损失权重:</label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={gameData.cycleConsistencyLoss}
                          onChange={(e) => setGameData(prev => ({ ...prev, cycleConsistencyLoss: parseFloat(e.target.value) }))}
                          className="weight-slider"
                        />
                        <span className="weight-value">{gameData.cycleConsistencyLoss}</span>
                  </div>
                  
                      <div className="setting-group">
                        <label>身份映射损失权重:</label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={gameData.identityLoss}
                          onChange={(e) => setGameData(prev => ({ ...prev, identityLoss: parseFloat(e.target.value) }))}
                          className="weight-slider"
                        />
                        <span className="weight-value">{gameData.identityLoss}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="style-transfer-preview">
                    <h4>风格转换预览</h4>
                    <div className="transfer-preview-container">
                      <div className="image-pair">
                        <div className="source-image">
                          <div className="image-label">源图像</div>
                          <div className="image-content">
                            {gameData.sourceImage === 'horse' ? '🐎' : gameData.sourceImage === 'zebra' ? '🦓' : gameData.sourceImage === 'apple' ? '🍎' : '🍊'}
                    </div>
                  </div>
                  
                        <div className="transfer-arrow">→</div>
                        
                        <div className="target-image">
                          <div className="image-label">目标风格</div>
                          <div className="image-content">
                            {gameData.targetStyle === 'horse' ? '🐎' : gameData.targetStyle === 'zebra' ? '🦓' : gameData.targetStyle === 'apple' ? '🍎' : '🍊'}
                    </div>
                  </div>
                </div>
                
                      <div className="transfer-steps">
                        <h5>转换过程</h5>
                        <div className="steps-container">
                          {generateIntermediateSteps(gameData.sourceImage, gameData.targetStyle).map((step, index) => (
                        <div key={index} className="step-item">
                              <span className="step-emoji">{step}</span>
                              <span className="step-label">步骤 {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                    </div>
              </div>
              
                  <div className="cycle-consistency-monitor">
                    <h4>🔄 循环一致性监控</h4>
                    <div className="consistency-metrics">
                      <div className="metric-item">
                        <span className="metric-label">循环一致性损失:</span>
                        <span className="metric-value">{gameData.cycleConsistencyLoss.toFixed(2)}</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill cycle" 
                            style={{ width: `${(gameData.cycleConsistencyLoss / 2) * 100}%` }}
                          ></div>
                </div>
                      </div>
                      
                      <div className="metric-item">
                        <span className="metric-label">身份映射损失:</span>
                        <span className="metric-value">{gameData.identityLoss.toFixed(2)}</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill identity" 
                            style={{ width: `${(gameData.identityLoss / 2) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="style-transfer-results">
                    <h4>🎨 风格转换结果</h4>
                    <div className="results-container">
                      <div className="result-item">
                        <div className="result-label">转换质量评分</div>
                        <div className="result-value">{Math.round((gameData.cycleConsistencyLoss + gameData.identityLoss) * 25)}/100</div>
                        <div className="result-bar">
                          <div 
                            className="result-fill" 
                            style={{ width: `${(gameData.cycleConsistencyLoss + gameData.identityLoss) * 25}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="result-item">
                        <div className="result-label">风格一致性</div>
                        <div className="result-value">{Math.round(gameData.cycleConsistencyLoss * 50)}%</div>
                        <div className="result-bar">
                          <div 
                            className="result-fill style" 
                            style={{ width: `${gameData.cycleConsistencyLoss * 50}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="result-item">
                        <div className="result-label">内容保持度</div>
                        <div className="result-value">{Math.round(gameData.identityLoss * 50)}%</div>
                        <div className="result-bar">
                          <div 
                            className="result-fill content" 
                            style={{ width: `${gameData.identityLoss * 50}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
              </div>
            </div>
            
            <div className="game-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${gameProgress}%` }}></div>
              </div>
              <span>转换进度: {gameProgress.toFixed(0)}%</span>
            </div>
              </div>
            )}

            {/* 游戏完成状态 */}
            {gameData.gamePhase === 'completed' && (
              <div className="game-completed">
                <h3>🎉 训练完成！</h3>
                <p>恭喜你成功完成了CycleGAN训练挑战！</p>
                <div className="completion-stats">
                  <div className="stat">
                    <span className="stat-label">循环一致性分数</span>
                    <span className="stat-value">{Math.round(gameData.cycleConsistencyScore)}</span>
                </div>
                  <div className="stat">
                    <span className="stat-label">身份保持分数</span>
                    <span className="stat-value">{Math.round(gameData.identityPreservationScore)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">训练时间</span>
                    <span className="stat-value">{gameData.gameTime}s</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">训练轮次</span>
                    <span className="stat-value">{gameData.trainingEpochs}</span>
              </div>
            </div>
            
                <div className="completion-actions">
                  <button 
                    className="control-btn next-variant"
                    onClick={() => resetGame()}
                  >
                    尝试其他变体
                  </button>
                  
                  <button 
                    className="control-btn return-main"
                    onClick={() => {
                      setGameState(gameStates.SELECTING)
                      setShowGame(false)
                      setSelectedVariant(null)
                    }}
                  >
                    🏠 返回GAN变体主页
                  </button>
              </div>
            </div>
            )}
          </div>
        )

      case 'stylegan':
        return (
          <div className="game-container stylegan-game">
            {/* 游戏阶段指示器 */}
            <div className="game-phase-indicator">
              <div className={`phase-step ${gameData.gamePhase === 'introduction' ? 'active' : ''}`}>
                <span className="phase-icon">📚</span>
                <span className="phase-label">学习阶段</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'setup' ? 'active' : ''}`}>
                <span className="phase-icon">⚙️</span>
                <span className="phase-label">参数设置</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'training' ? 'active' : ''}`}>
                <span className="phase-icon">🚀</span>
                <span className="phase-label">训练阶段</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'completed' ? 'active' : ''}`}>
                <span className="phase-icon">🏆</span>
                <span className="phase-label">完成</span>
              </div>
            </div>
            
            {/* 介绍阶段 */}
            {gameData.gamePhase === 'introduction' && (
              <div className="introduction-phase">
                <div className="introduction-header">
                  <h2>🎓 StyleGAN 学习</h2>
                  <p>了解StyleGAN的创新技术、网络架构和应用场景</p>
                </div>
                
                <div className="introduction-content">
                  <div className="introduction-step">
                    <div className="step-header">
                      <span className="step-image">{gameData.introductionSteps[gameData.currentStep]?.image}</span>
                      <h3>{gameData.introductionSteps[gameData.currentStep]?.title}</h3>
                    </div>
                    <div className="step-content">
                      <p>{gameData.introductionSteps[gameData.currentStep]?.content}</p>
                    </div>
                  </div>
                  
                  <div className="introduction-navigation">
                    <button 
                      className="nav-btn prev-btn"
                      onClick={() => setGameData(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))}
                      disabled={gameData.currentStep === 0}
                    >
                      ← 上一步
                    </button>
                    
                    <span className="step-counter">
                      {gameData.currentStep + 1} / {gameData.introductionSteps.length}
                    </span>
                    
                    {gameData.currentStep < gameData.introductionSteps.length - 1 ? (
                      <button 
                        className="nav-btn next-btn"
                        onClick={() => setGameData(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))}
                      >
                        下一步 →
                      </button>
                    ) : (
                      <button 
                        className="nav-btn start-btn"
                        onClick={() => setGameData(prev => ({ ...prev, gamePhase: 'setup' }))}
                      >
                        开始游戏 →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 游戏阶段 */}
            {gameData.gamePhase === 'setup' && (
              <div className="setup-phase">
                <div className="setup-header">
                  <h3>🎨 StyleGAN风格混合游戏</h3>
                  <p>调整风格参数，生成高质量的人脸图像</p>
                  <button className="hint-btn" onClick={toggleHint}>
                    {showHint ? '隐藏提示' : '显示提示'}
                  </button>
                </div>
                
                {showHint && (
                  <div className="hint-box">
                    <h4>💡 提示</h4>
                    <p>StyleGAN通过调整不同的风格参数可以控制生成图像的年龄、性别、表情等特征。</p>
                    <p>合理的参数组合可以生成更真实、更高质量的人脸图像。</p>
                  </div>
                )}
            
            <div className="game-content">
                  <div className="style-parameters">
                    <h4>🎭 风格参数控制</h4>
                    <div className="parameter-grid">
                      <div className="parameter-item">
                        <label>年龄控制:</label>
                    <input
                      type="range"
                      min="0"
                          max="100"
                          step="1"
                          value={gameData.age}
                          onChange={(e) => handleGameAction('changeAge', parseInt(e.target.value))}
                          className="style-slider"
                        />
                        <span className="parameter-value">{gameData.age}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill age" style={{ width: `${gameData.age}%` }}></div>
                    </div>
                  </div>
                      
                      <div className="parameter-item">
                        <label>性别控制:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={gameData.gender}
                          onChange={(e) => handleGameAction('changeGender', parseInt(e.target.value))}
                          className="style-slider"
                        />
                        <span className="parameter-value">{gameData.gender}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill gender" style={{ width: `${gameData.gender}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>表情控制:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={gameData.expression}
                          onChange={(e) => handleGameAction('changeExpression', parseInt(e.target.value))}
                          className="style-slider"
                        />
                        <span className="parameter-value">{gameData.expression}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill expression" style={{ width: `${gameData.expression}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>发型控制:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={gameData.hairStyle}
                          onChange={(e) => handleGameAction('changeHairStyle', parseInt(e.target.value))}
                          className="style-slider"
                        />
                        <span className="parameter-value">{gameData.hairStyle}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill hair" style={{ width: `${gameData.hairStyle}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>肤色控制:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={gameData.skinTone}
                          onChange={(e) => handleGameAction('changeSkinTone', parseInt(e.target.value))}
                          className="style-slider"
                        />
                        <span className="parameter-value">{gameData.skinTone}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill skin" style={{ width: `${gameData.skinTone}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>眼睛颜色:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={gameData.eyeColor}
                          onChange={(e) => handleGameAction('changeEyeColor', parseInt(e.target.value))}
                          className="style-slider"
                        />
                        <span className="parameter-value">{gameData.eyeColor}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill eye" style={{ width: `${gameData.eyeColor}%` }}></div>
                        </div>
                      </div>
                    </div>
              </div>
              
              <div className="face-preview">
                    <h4>👤 人脸预览</h4>
                    <div className="face-container">
                  <div className="generated-face">
                        {generateStyleGANFace(gameData)}
                  </div>
                      <div className="face-stats">
                        <div className="stat-item">
                          <span className="stat-label">年龄:</span>
                          <span className="stat-value">{gameData.age}</span>
                    </div>
                        <div className="stat-item">
                          <span className="stat-label">性别:</span>
                          <span className="stat-value">{gameData.gender < 50 ? '女性' : '男性'}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">表情:</span>
                          <span className="stat-value">{gameData.expression < 33 ? '平静' : gameData.expression < 66 ? '微笑' : '大笑'}</span>
                        </div>
                  </div>
                </div>
              </div>
              
                  <div className="style-quality-monitor">
                    <h4>📊 风格质量监控</h4>
                    <div className="quality-metrics">
                      <div className="metric-item">
                        <span className="metric-label">风格损失:</span>
                        <span className="metric-value">{gameData.styleLoss.toFixed(2)}</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill style" 
                            style={{ width: `${(gameData.styleLoss / 2) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="metric-item">
                        <span className="metric-label">感知损失:</span>
                        <span className="metric-value">{gameData.perceptualLoss.toFixed(2)}</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill perceptual" 
                            style={{ width: `${(gameData.perceptualLoss / 2) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="setup-actions">
                <button 
                    className="action-btn back-btn"
                    onClick={() => setGameData(prev => ({ ...prev, gamePhase: 'introduction', currentStep: 0 }))}
                >
                    ← 返回学习
                </button>
                  
                  <button 
                    className="action-btn start-game-btn"
                    onClick={() => {
                      setGameData(prev => ({ ...prev, gamePhase: 'game' }))
                      addGameMessage('🎨 开始StyleGAN风格混合游戏！', 'info')
                    }}
                  >
                    开始游戏
                  </button>
                    </div>
                  </div>
                )}

            {/* 游戏进行阶段 */}
            {gameData.gamePhase === 'game' && (
              <div className="game-phase">
                <div className="game-header">
                  <h3>🎨 StyleGAN风格混合进行中</h3>
                  <p>继续调整风格参数，生成更高质量的人脸图像</p>
                </div>
                
                <div className="game-content">
                  <div className="style-parameters">
                    <h4>🎭 风格参数控制</h4>
                    <div className="parameter-grid">
                      <div className="parameter-item">
                        <label>年龄控制:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={gameData.age}
                          onChange={(e) => handleGameAction('changeAge', parseInt(e.target.value))}
                          className="style-slider"
                        />
                        <span className="parameter-value">{gameData.age}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill age" style={{ width: `${gameData.age}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>性别控制:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={gameData.gender}
                          onChange={(e) => handleGameAction('changeGender', parseInt(e.target.value))}
                          className="style-slider"
                        />
                        <span className="parameter-value">{gameData.gender}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill gender" style={{ width: `${gameData.gender}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>表情控制:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={gameData.expression}
                          onChange={(e) => handleGameAction('changeExpression', parseInt(e.target.value))}
                          className="style-slider"
                        />
                        <span className="parameter-value">{gameData.expression}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill expression" style={{ width: `${gameData.expression}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>发型控制:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={gameData.hairStyle}
                          onChange={(e) => handleGameAction('changeHairStyle', parseInt(e.target.value))}
                          className="style-slider"
                        />
                        <span className="parameter-value">{gameData.hairStyle}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill hair" style={{ width: `${gameData.hairStyle}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>肤色控制:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={gameData.skinTone}
                          onChange={(e) => handleGameAction('changeSkinTone', parseInt(e.target.value))}
                          className="style-slider"
                        />
                        <span className="parameter-value">{gameData.skinTone}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill skin" style={{ width: `${gameData.skinTone}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>眼睛颜色:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={gameData.eyeColor}
                          onChange={(e) => handleGameAction('changeEyeColor', parseInt(e.target.value))}
                          className="style-slider"
                        />
                        <span className="parameter-value">{gameData.eyeColor}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill eye" style={{ width: `${gameData.eyeColor}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="face-preview">
                    <h4>👤 人脸预览</h4>
                    <div className="face-container">
                      <div className="generated-face">
                        {generateStyleGANFace(gameData)}
                      </div>
                      <div className="face-stats">
                        <div className="stat-item">
                          <span className="stat-label">年龄:</span>
                          <span className="stat-value">{gameData.age}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">性别:</span>
                          <span className="stat-value">{gameData.gender < 50 ? '女性' : '男性'}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">表情:</span>
                          <span className="stat-value">{gameData.expression < 33 ? '平静' : gameData.expression < 66 ? '微笑' : '大笑'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="style-quality-monitor">
                    <h4>📊 风格质量监控</h4>
                    <div className="quality-metrics">
                      <div className="metric-item">
                        <span className="metric-label">风格损失:</span>
                        <span className="metric-value">{gameData.styleLoss.toFixed(2)}</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill style" 
                            style={{ width: `${(gameData.styleLoss / 2) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="metric-item">
                        <span className="metric-label">感知损失:</span>
                        <span className="metric-value">{gameData.perceptualLoss.toFixed(2)}</span>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill perceptual" 
                            style={{ width: `${(gameData.perceptualLoss / 2) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="style-results">
                    <h4>🎨 风格混合结果</h4>
                    <div className="results-container">
                      <div className="result-item">
                        <div className="result-label">整体质量评分</div>
                        <div className="result-value">{Math.round((gameData.age + gameData.gender + gameData.expression + gameData.hairStyle + gameData.skinTone + gameData.eyeColor) / 6)}/100</div>
                        <div className="result-bar">
                          <div 
                            className="result-fill" 
                            style={{ width: `${(gameData.age + gameData.gender + gameData.expression + gameData.hairStyle + gameData.skinTone + gameData.eyeColor) / 6}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="result-item">
                        <div className="result-label">风格一致性</div>
                        <div className="result-value">{Math.round(gameData.styleLoss * 50)}%</div>
                        <div className="result-bar">
                          <div 
                            className="result-fill style" 
                            style={{ width: `${gameData.styleLoss * 50}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="result-item">
                        <div className="result-label">感知质量</div>
                        <div className="result-value">{Math.round(gameData.perceptualLoss * 50)}%</div>
                        <div className="result-bar">
                          <div 
                            className="result-fill perceptual" 
                            style={{ width: `${gameData.perceptualLoss * 50}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
              </div>
            </div>
            
            <div className="game-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${gameProgress}%` }}></div>
              </div>
                  <span>风格混合进度: {gameProgress.toFixed(0)}%</span>
            </div>
              </div>
            )}


            {/* 游戏完成状态 */}
            {gameData.gamePhase === 'completed' && (
              <div className="game-completed">
                <h3>🎉 训练完成！</h3>
                <p>恭喜你成功完成了StyleGAN训练挑战！</p>
                <div className="completion-stats">
                  <div className="stat">
                    <span className="stat-label">风格质量分数</span>
                    <span className="stat-value">{Math.round(gameData.styleQuality)}</span>
              </div>
                  <div className="stat">
                    <span className="stat-label">感知质量分数</span>
                    <span className="stat-value">{Math.round(gameData.perceptualQuality)}</span>
            </div>
                  <div className="stat">
                    <span className="stat-label">训练时间</span>
                    <span className="stat-value">{gameData.gameTime}s</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">训练轮次</span>
                    <span className="stat-value">{gameData.trainingEpochs}</span>
                  </div>
                </div>
                
                <div className="completion-actions">
                  <button 
                    className="control-btn next-variant"
                    onClick={() => resetGame()}
                  >
                    尝试其他变体
                  </button>
                  
                  <button 
                    className="control-btn return-main"
                    onClick={() => {
                      setGameState(gameStates.SELECTING)
                      setShowGame(false)
                      setSelectedVariant(null)
                    }}
                  >
                    🏠 返回GAN变体主页
                  </button>
                </div>
              </div>
            )}
          </div>
        )

      case 'biggan':
        return (
          <div className="game-container biggan-game">
            {/* 游戏阶段指示器 */}
            <div className="game-phase-indicator">
              <div className={`phase-step ${gameData.gamePhase === 'introduction' ? 'active' : ''}`}>
                <span className="phase-icon">📚</span>
                <span className="phase-label">学习阶段</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'setup' ? 'active' : ''}`}>
                <span className="phase-icon">⚙️</span>
                <span className="phase-label">参数设置</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'game' ? 'active' : ''}`}>
                <span className="phase-icon">🎮</span>
                <span className="phase-label">游戏阶段</span>
              </div>
              <div className={`phase-step ${gameData.gamePhase === 'completed' ? 'active' : ''}`}>
                <span className="phase-icon">🏆</span>
                <span className="phase-label">完成</span>
              </div>
            </div>
            
            {/* 介绍阶段 */}
            {gameData.gamePhase === 'introduction' && (
              <div className="introduction-phase">
                <div className="introduction-header">
                  <h2>🎓 BigGAN 学习</h2>
                  <p>了解BigGAN的技术创新、网络架构和应用场景</p>
                </div>
                
                <div className="introduction-content">
                  <div className="introduction-step">
                    <div className="step-header">
                      <span className="step-image">{gameData.introductionSteps[gameData.currentStep]?.image}</span>
                      <h3>{gameData.introductionSteps[gameData.currentStep]?.title}</h3>
                    </div>
                    <div className="step-content">
                      <p>{gameData.introductionSteps[gameData.currentStep]?.content}</p>
                    </div>
                  </div>
                  
                  <div className="introduction-navigation">
                    <button 
                      className="nav-btn prev-btn"
                      onClick={() => setGameData(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))}
                      disabled={gameData.currentStep === 0}
                    >
                      ← 上一步
                    </button>
                    
                    <span className="step-counter">
                      {gameData.currentStep + 1} / {gameData.introductionSteps.length}
                    </span>
                    
                    {gameData.currentStep < gameData.introductionSteps.length - 1 ? (
                      <button 
                        className="nav-btn next-btn"
                        onClick={() => setGameData(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))}
                      >
                        下一步 →
                      </button>
                    ) : (
                      <button 
                        className="nav-btn start-btn"
                        onClick={() => setGameData(prev => ({ ...prev, gamePhase: 'setup' }))}
                      >
                        开始游戏 →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 游戏阶段 */}
            {gameData.gamePhase === 'setup' && (
              <div className="setup-phase">
                <div className="setup-header">
                  <h3>🚀 BigGAN模型扩展游戏</h3>
                  <p>调整模型参数，提升生成质量和多样性</p>
                  <button className="hint-btn" onClick={toggleHint}>
                    {showHint ? '隐藏提示' : '显示提示'}
                  </button>
                </div>
                
                {showHint && (
                  <div className="hint-box">
                    <h4>💡 提示</h4>
                    <p>BigGAN通过增加模型规模、使用类别条件化和正交正则化来提升生成质量。</p>
                    <p>合理的参数组合可以获得更好的生成效果。</p>
                  </div>
                )}
            
            <div className="game-content">
                  <div className="model-parameters">
                    <h4>⚙️ 模型参数控制</h4>
                    <div className="parameter-grid">
                      <div className="parameter-item">
                        <label>模型规模:</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={gameData.modelSize || 1}
                    onChange={(e) => handleGameAction('increaseSize', parseFloat(e.target.value))}
                          className="size-slider"
                        />
                        <span className="parameter-value">{gameData.modelSize || 1}x</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill size" style={{ width: `${((gameData.modelSize || 1) - 1) / 4 * 100}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>类别条件化:</label>
                        <input
                          type="checkbox"
                          checked={gameData.classConditioning}
                          onChange={() => handleGameAction('toggleClassConditioning')}
                          className="conditioning-toggle"
                        />
                        <span className="parameter-value">{gameData.classConditioning ? '启用' : '禁用'}</span>
                      </div>
                      
                      <div className="parameter-item">
                        <label>正交正则化:</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={gameData.orthogonalRegularization || 0.5}
                          onChange={(e) => setGameData(prev => ({ ...prev, orthogonalRegularization: parseFloat(e.target.value) }))}
                          className="orthogonal-slider"
                        />
                        <span className="parameter-value">{gameData.orthogonalRegularization || 0.5}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill orthogonal" style={{ width: `${(gameData.orthogonalRegularization || 0.5) * 100}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>截断技巧:</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={gameData.truncationTrick || 0.5}
                          onChange={(e) => setGameData(prev => ({ ...prev, truncationTrick: parseFloat(e.target.value) }))}
                          className="truncation-slider"
                        />
                        <span className="parameter-value">{gameData.truncationTrick || 0.5}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill truncation" style={{ width: `${(gameData.truncationTrick || 0.5) * 100}%` }}></div>
                        </div>
                      </div>
                  </div>
                </div>
                
                <div className="category-selector">
                    <h4>🏷️ 类别选择</h4>
                    <div className="category-options">
                      <div className="category-item">
                        <input
                          type="radio"
                          id="animals"
                          name="category"
                          value="animals"
                          checked={gameData.currentCategory === 'animals'}
                    onChange={(e) => handleGameAction('changeCategory', e.target.value)}
                        />
                        <label htmlFor="animals">🐾 动物</label>
                </div>
                
                      <div className="category-item">
                    <input
                          type="radio"
                          id="objects"
                          name="category"
                          value="objects"
                          checked={gameData.currentCategory === 'objects'}
                          onChange={(e) => handleGameAction('changeCategory', e.target.value)}
                        />
                        <label htmlFor="objects">🔧 物体</label>
        </div>
                      
                      <div className="category-item">
                        <input
                          type="radio"
                          id="landscapes"
                          name="category"
                          value="landscapes"
                          checked={gameData.currentCategory === 'landscapes'}
                          onChange={(e) => handleGameAction('changeCategory', e.target.value)}
                        />
                        <label htmlFor="landscapes">🏞️ 风景</label>
      </div>

                      <div className="category-item">
                        <input
                          type="radio"
                          id="faces"
                          name="category"
                          value="faces"
                          checked={gameData.currentCategory === 'animals'}
                          onChange={(e) => handleGameAction('changeCategory', e.target.value)}
                        />
                        <label htmlFor="faces">👤 人脸</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="quality-preview">
                    <h4>📊 质量预览</h4>
              <div className="quality-metrics">
                  <div className="metric-item">
                        <span className="metric-label">保真度:</span>
                        <span className="metric-value">{Math.round((gameData.modelSize || 1) * 20)}%</span>
                    <div className="metric-bar">
                          <div 
                            className="metric-fill fidelity" 
                            style={{ width: `${(gameData.modelSize || 1) * 20}%` }}
                          ></div>
                    </div>
                  </div>
                      
                  <div className="metric-item">
                        <span className="metric-label">多样性:</span>
                        <span className="metric-value">{Math.round((gameData.truncationTrick || 0.5) * 100)}%</span>
                    <div className="metric-bar">
                          <div 
                            className="metric-fill diversity" 
                            style={{ width: `${(gameData.truncationTrick || 0.5) * 100}%` }}
                          ></div>
                    </div>
                  </div>
                      
                  <div className="metric-item">
                        <span className="metric-label">稳定性:</span>
                        <span className="metric-value">{Math.round((gameData.orthogonalRegularization || 0.5) * 100)}%</span>
                    <div className="metric-bar">
                          <div 
                            className="metric-fill stability" 
                            style={{ width: `${(gameData.orthogonalRegularization || 0.5) * 100}%` }}
                          ></div>
                    </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="setup-actions">
                  <button 
                    className="action-btn back-btn"
                    onClick={() => setGameData(prev => ({ ...prev, gamePhase: 'introduction', currentStep: 0 }))}
                  >
                    ← 返回学习
                  </button>
                  
                  <button 
                    className="action-btn start-game-btn"
                    onClick={() => {
                      setGameData(prev => ({ ...prev, gamePhase: 'game' }))
                      addGameMessage('🚀 开始BigGAN模型扩展游戏！', 'info')
                    }}
                  >
                    开始游戏
                  </button>
                </div>
              </div>
            )}
            
            {/* 游戏进行阶段 */}
            {gameData.gamePhase === 'game' && (
              <div className="game-phase">
                <div className="game-header">
                  <h3>🚀 BigGAN模型扩展进行中</h3>
                  <p>继续调整参数，观察生成质量提升</p>
                </div>
                
                <div className="game-content">
                  <div className="model-parameters">
                    <h4>⚙️ 模型参数控制</h4>
                    <div className="parameter-grid">
                      <div className="parameter-item">
                        <label>模型规模:</label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.5"
                          value={gameData.modelSize || 1}
                          onChange={(e) => handleGameAction('increaseSize', parseFloat(e.target.value))}
                          className="size-slider"
                        />
                        <span className="parameter-value">{gameData.modelSize || 1}x</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill size" style={{ width: `${((gameData.modelSize || 1) - 1) / 4 * 100}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>类别条件化:</label>
                        <input
                          type="checkbox"
                          checked={gameData.classConditioning}
                          onChange={() => handleGameAction('toggleClassConditioning')}
                          className="conditioning-toggle"
                        />
                        <span className="parameter-value">{gameData.classConditioning ? '启用' : '禁用'}</span>
                      </div>
                      
                      <div className="parameter-item">
                        <label>正交正则化:</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={gameData.orthogonalRegularization || 0.5}
                          onChange={(e) => setGameData(prev => ({ ...prev, orthogonalRegularization: parseFloat(e.target.value) }))}
                          className="orthogonal-slider"
                        />
                        <span className="parameter-value">{gameData.orthogonalRegularization || 0.5}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill orthogonal" style={{ width: `${(gameData.orthogonalRegularization || 0.5) * 100}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="parameter-item">
                        <label>截断技巧:</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={gameData.truncationTrick || 0.5}
                          onChange={(e) => setGameData(prev => ({ ...prev, truncationTrick: parseFloat(e.target.value) }))}
                          className="truncation-slider"
                        />
                        <span className="parameter-value">{gameData.truncationTrick || 0.5}</span>
                        <div className="parameter-bar">
                          <div className="parameter-fill truncation" style={{ width: `${(gameData.truncationTrick || 0.5) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="category-selector">
                    <h4>🏷️ 类别选择</h4>
                    <div className="category-options">
                      <div className="category-item">
                        <input
                          type="radio"
                          id="animals-game"
                          name="category-game"
                          value="animals"
                          checked={gameData.currentCategory === 'animals'}
                          onChange={(e) => handleGameAction('changeCategory', e.target.value)}
                        />
                        <label htmlFor="animals-game">🐾 动物</label>
                      </div>
                      
                      <div className="category-item">
                        <input
                          type="radio"
                          id="objects-game"
                          name="category-game"
                          value="objects"
                          checked={gameData.currentCategory === 'objects'}
                          onChange={(e) => handleGameAction('changeCategory', e.target.value)}
                        />
                        <label htmlFor="objects-game">🔧 物体</label>
                      </div>
                      
                      <div className="category-item">
                        <input
                          type="radio"
                          id="landscapes-game"
                          name="category-game"
                          value="landscapes"
                          checked={gameData.currentCategory === 'landscapes'}
                          onChange={(e) => handleGameAction('changeCategory', e.target.value)}
                        />
                        <label htmlFor="objects-game">🏞️ 风景</label>
                      </div>
                      
                      <div className="category-item">
                        <input
                          type="radio"
                          id="faces-game"
                          name="category-game"
                          value="faces"
                          checked={gameData.currentCategory === 'faces'}
                          onChange={(e) => handleGameAction('changeCategory', e.target.value)}
                        />
                        <label htmlFor="faces-game">👤 人脸</label>
                  </div>
                </div>
              </div>
              
              <div className="generated-samples">
                    <h4>🎨 生成样本 - {gameData.currentCategory}</h4>
                <div className="samples-grid">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="sample-item">
                      {gameData.currentCategory === 'animals' && ['🐶', '🐱', '🐰', '🐼', '🐨', '🦊'][i]}
                      {gameData.currentCategory === 'objects' && ['🚗', '🏠', '📱', '💻', '🎸', '📷'][i]}
                      {gameData.currentCategory === 'landscapes' && ['🏞️', '🌅', '🌆', '🌃', '🏔️', '🌊'][i]}
                      {gameData.currentCategory === 'faces' && ['😀', '😃', '😄', '😁', '😆', '😅'][i]}
                    </div>
                  ))}
                </div>
              </div>
                  
                  <div className="quality-metrics">
                    <h4>📊 质量指标</h4>
                    <div className="metrics-grid">
                      <div className="metric-item">
                        <span className="metric-name">保真度</span>
                        <div className="metric-bar">
                          <div className="metric-fill fidelity" style={{ width: `${(gameData.modelSize || 1) * 20}%` }}></div>
                        </div>
                        <span className="metric-value">{Math.round((gameData.modelSize || 1) * 20)}%</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-name">多样性</span>
                        <div className="metric-bar">
                          <div className="metric-fill diversity" style={{ width: `${(gameData.truncationTrick || 0.5) * 100}%` }}></div>
                        </div>
                        <span className="metric-value">{Math.round((gameData.truncationTrick || 0.5) * 100)}%</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-name">稳定性</span>
                        <div className="metric-bar">
                          <div className="metric-fill stability" style={{ width: `${(gameData.orthogonalRegularization || 0.5) * 100}%` }}></div>
                        </div>
                        <span className="metric-value">{Math.round((gameData.orthogonalRegularization || 0.5) * 100)}%</span>
                      </div>
                    </div>
                  </div>
            </div>
            
            <div className="game-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${gameProgress}%` }}></div>
              </div>
                  <span>模型扩展进度: {gameProgress.toFixed(0)}%</span>
            </div>
              </div>
            )}

            {/* 游戏完成状态 */}
            {gameData.gamePhase === 'completed' && (
              <div className="game-completed">
                <h3>🎉 游戏完成！</h3>
                <p>恭喜你成功完成了BigGAN模型扩展挑战！</p>
                <div className="completion-stats">
                  <div className="stat">
                    <span className="stat-label">最终模型规模</span>
                    <span className="stat-value">{gameData.modelSize || 1}x</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">类别条件化</span>
                    <span className="stat-value">{gameData.classConditioning ? '启用' : '禁用'}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">正交正则化</span>
                    <span className="stat-value">{gameData.orthogonalRegularization || 0.5}</span>
                  </div>
                </div>
                
                <div className="completion-actions">
                  <button 
                    className="control-btn next-variant"
                    onClick={() => resetGame()}
                  >
                    尝试其他变体
                  </button>
                  
                  <button 
                    className="control-btn return-main"
                    onClick={() => {
                      setGameState(gameStates.SELECTING)
                      setShowGame(false)
                      setSelectedVariant(null)
                    }}
                  >
                    🏠 返回GAN变体主页
                  </button>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="section gan-variants">
      <div className="variants-header">
        <h1>GAN变体探索</h1>
        <p className="text-muted">通过交互式游戏了解不同的GAN变体及其特点</p>
      </div>

      {!showGame ? (
        <div className="variants-grid">
          {ganVariants.map((variant) => (
            <div 
              key={variant.id} 
              className="variant-card"
              style={{ borderColor: variant.color }}
            >
              <div className="variant-header">
                <span className="variant-icon">{variant.icon}</span>
                <div className="variant-info">
                  <h3>{variant.name}</h3>
                  <p className="variant-fullname">{variant.fullName}</p>
                  <span className="variant-year">{variant.year}</span>
                </div>
                <div className="difficulty-badge">
                  {'⭐'.repeat(variant.difficulty)}
                </div>
              </div>
              
              <p className="variant-description">{variant.description}</p>
              
              <div className="variant-features">
                <h4>核心特性:</h4>
                <ul>
                  {variant.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              
              <div className="game-info">
                <h4>🎮 游戏说明:</h4>
                <p>{variant.gameDescription}</p>
                <p className="game-rules">{variant.gameRules}</p>
              </div>
              
              <button 
                className="start-game-btn"
                style={{ backgroundColor: variant.color }}
                onClick={() => startGame(variant)}
              >
                🔍 开始探究
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="game-section">
          <div className="game-header">
            <h2>{selectedVariant?.name} - 交互式学习</h2>
            <div className="game-stats">
              <span className="score">得分: {gameScore}</span>
              <span className="progress">进度: {gameProgress.toFixed(0)}%</span>
            </div>
            <button className="reset-btn" onClick={resetGame}>
              🔄 重新开始
            </button>
          </div>
          
          {renderGame()}

          {gameData?.isCompleting && (
            <div className="completion-overlay">
              <div className="completion-badge">展示最终效果…</div>
            </div>
          )}
          
          <div className="game-messages">
            <h4>游戏消息</h4>
            <div className="messages-container">
              {gameMessages.slice(-5).map((msg, index) => (
                <div key={index} className={`message ${msg.type}`}>
                  <span className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  <span className="message-text">{msg.message}</span>
                </div>
              ))}
            </div>
          </div>
          
          {gameState === gameStates.COMPLETED && (
            <div className="game-completed">
              <h3>🎉 恭喜完成！</h3>
              <p>你已经成功学习了 {selectedVariant?.name} 的核心概念</p>
              <div className="completion-stats">
                <div className="stat">
                  <span className="stat-label">最终得分</span>
                  <span className="stat-value">{gameScore}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">完成时间</span>
                  <span className="stat-value">优秀</span>
                </div>
              </div>
              <button className="next-variant-btn" onClick={resetGame}>
                探索其他变体
              </button>
            </div>
          )}
      </div>
      )}
    </div>
  )
}

