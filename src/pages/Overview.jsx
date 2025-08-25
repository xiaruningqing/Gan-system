import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Overview.css'

export default function Overview() {
  const navigate = useNavigate()
  const [selectedCard, setSelectedCard] = useState(null)
  const [cardContent, setCardContent] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef(null)
  const knowledgeSectionRef = useRef(null)

  const knowledgeCards = [
    {
      id: 'generator',
      title: '生成器 (Generator)',
      icon: '🎯',
      category: '核心组件',
      description: '将随机噪声映射为逼真样本，持续优化生成质量',
      content: {
        overview: '生成器是GAN的创造者，它将随机噪声转换为逼真的数据样本。通过深度神经网络学习数据分布，生成与真实数据相似的样本。',
        keyPoints: [
          '输入：随机噪声向量（通常100-512维）',
          '架构：多层反卷积/转置卷积网络',
          '激活函数：ReLU（隐藏层）+ Tanh（输出层）',
          '目标：欺骗判别器，生成逼真样本'
        ],
        architecture: [
          '噪声输入层 (100维)',
          '全连接层 (4×4×1024)',
          '反卷积层1 (8×8×512)',
          '反卷积层2 (16×16×256)',
          '反卷积层3 (32×32×128)',
          '输出层 (64×64×3)'
        ],
        tips: ['使用批归一化稳定训练', '避免使用池化层', '使用LeakyReLU激活函数']
      }
    },
    {
      id: 'discriminator',
      title: '判别器 (Discriminator)',
      icon: '🔍',
      category: '核心组件',
      description: '区分真实与生成数据，提供训练反馈信号',
      content: {
        overview: '判别器是GAN的评判者，它学习区分真实数据和生成器产生的假数据。通过二分类任务训练，为生成器提供梯度信号。',
        keyPoints: [
          '输入：真实图像或生成图像',
          '架构：卷积神经网络（CNN）',
          '输出：单一概率值（0-1）',
          '目标：准确识别真假数据'
        ],
        architecture: [
          '输入层 (64×64×3)',
          '卷积层1 (32×32×64)',
          '卷积层2 (16×16×128)',
          '卷积层3 (8×8×256)',
          '卷积层4 (4×4×512)',
          '全连接层 (1)'
        ],
        techniques: ['使用Dropout防止过拟合', '标签平滑技术', '特征匹配']
      }
    },
    {
      id: 'adversarial',
      title: '对抗训练',
      icon: '⚔️',
      category: '训练机制',
      description: '两个网络相互博弈，达到动态平衡状态',
      content: {
        overview: '对抗训练是GAN的核心思想，生成器和判别器相互竞争，形成零和博弈。这种对抗机制驱动两个网络不断改进。',
        keyPoints: [
          '交替训练：先训练判别器，再训练生成器',
          '博弈论：基于纳什均衡理论',
          '损失函数：Minimax游戏目标',
          '平衡点：理想状态下的收敛'
        ],
        challenges: [
          '模式崩塌：生成器只生成少数几种样本',
          '训练不稳定：损失函数震荡',
          '梯度消失：判别器过强导致生成器无法学习'
        ],
        solutions: ['WGAN', 'Progressive GAN', 'StyleGAN', 'Spectral Normalization']
      }
    },
    {
      id: 'applications',
      title: '创新应用',
      icon: '🚀',
      category: '实际应用',
      description: '图像生成、风格迁移、数据增强等前沿应用',
      content: {
        overview: 'GAN在各个领域都有广泛应用，从艺术创作到科学研究，展现了强大的生成能力和创新潜力。',
        keyPoints: [
          '图像生成：创造逼真的人脸、风景等',
          '数据增强：为机器学习提供更多训练数据',
          '图像编辑：风格迁移、超分辨率、修复',
          '创意设计：艺术创作、游戏资源生成'
        ],
        examples: [
          'StyleGAN：高质量人脸生成',
          'CycleGAN：图像风格转换',
          'Pix2Pix：图像到图像的转换',
          'BigGAN：大规模高分辨率图像生成'
        ],
        industries: ['娱乐业', '医疗影像', '自动驾驶', '电商零售', '游戏开发', '艺术创作']
      }
    }
  ]

  // 鼠标位置跟踪
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // 滚动触发动画
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
        }
      })
    }, observerOptions)

    // 观察需要动画的元素
    const animateElements = document.querySelectorAll('.animate-on-scroll')
    animateElements.forEach((el) => observer.observe(el))

    return () => {
      animateElements.forEach((el) => observer.unobserve(el))
    }
  }, [])

  // 节点悬停效果
  const handleNodeHover = (nodeType) => {
    const nodes = document.querySelectorAll(`.${nodeType}-node .node-circle`)
    nodes.forEach(node => {
      node.style.transform = 'scale(1.1)'
      node.style.boxShadow = '0 0 20px currentColor'
    })
  }

  const handleNodeLeave = (nodeType) => {
    const nodes = document.querySelectorAll(`.${nodeType}-node .node-circle`)
    nodes.forEach(node => {
      node.style.transform = 'scale(1)'
      node.style.boxShadow = '0 0 0 0 currentColor'
    })
  }

  const handleCardClick = (card) => {
    if (selectedCard === card.id) {
      // 如果点击的是已选中的卡片，则关闭
      setIsAnimating(true)
      setTimeout(() => {
        setSelectedCard(null)
        setCardContent(null)
        setIsAnimating(false)
      }, 300)
    } else {
      // 选择新卡片
      setIsAnimating(true)
      setTimeout(() => {
        setSelectedCard(card.id)
        setCardContent(card.content)
        setIsAnimating(false)
      }, 150)
    }
  }

  const renderCardContent = (content) => {
    if (!content) return null

    return (
      <div className={`card-content-detail ${isAnimating ? 'animating' : ''}`}>
        <div className="content-overview">
          <h4>概述</h4>
          <p>{content.overview}</p>
        </div>

        {content.keyPoints && (
          <div className="content-section">
            <h4>关键要点</h4>
            <ul className="key-points-list">
              {content.keyPoints.map((point, index) => (
                <li key={index} className="key-point-item">
                  <span className="point-marker">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.architecture && (
          <div className="content-section">
            <h4>网络架构</h4>
            <div className="architecture-flow">
              {content.architecture.map((layer, index) => (
                <div key={index} className="architecture-layer">
                  <div className="layer-box">{layer}</div>
                  {index < content.architecture.length - 1 && (
                    <div className="layer-arrow">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {content.challenges && (
          <div className="content-section">
            <h4>训练挑战</h4>
            <div className="challenges-list">
              {content.challenges.map((challenge, index) => (
                <div key={index} className="challenge-item">
                  <span className="challenge-icon">⚠️</span>
                  <span>{challenge}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.solutions && (
          <div className="content-section">
            <h4>解决方案</h4>
            <div className="solutions-tags">
              {content.solutions.map((solution, index) => (
                <span key={index} className="solution-tag">{solution}</span>
              ))}
            </div>
          </div>
        )}

        {content.examples && (
          <div className="content-section">
            <h4>典型案例</h4>
            <div className="examples-list">
              {content.examples.map((example, index) => (
                <div key={index} className="example-item">
                  <span className="example-icon">🔥</span>
                  <span>{example}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.tips && (
          <div className="content-section">
            <h4>实用技巧</h4>
            <div className="tips-list">
              {content.tips.map((tip, index) => (
                <div key={index} className="tip-item">
                  <span className="tip-icon">💡</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.techniques && (
          <div className="content-section">
            <h4>关键技术</h4>
            <div className="techniques-tags">
              {content.techniques.map((technique, index) => (
                <span key={index} className="technique-tag">{technique}</span>
              ))}
            </div>
          </div>
        )}

        {content.industries && (
          <div className="content-section">
            <h4>应用行业</h4>
            <div className="industries-grid">
              {content.industries.map((industry, index) => (
                <div key={index} className="industry-item">{industry}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="overview-hero" ref={heroRef}>
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">生成对抗网络</h1>
          <p className="hero-subtitle">Generative Adversarial Network</p>
          <p className="hero-description">
            探索GAN的神秘世界，理解生成与对抗的处理原理，体验深度学习的魅力
          </p>
          
          <div className="hero-actions">
            <button 
              className="btn-primary" 
              onClick={() => navigate('/visualization')}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px) scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
              }}
            >
              开始探索
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => navigate('/image-generation')}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px) scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
              }}
            >
              直接体验
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="gan-architecture">
            <div className="generator-path">
              <div 
                className="flow-node noise-node"
                onMouseEnter={() => handleNodeHover('noise')}
                onMouseLeave={() => handleNodeLeave('noise')}
              >
                <div className="node-circle">
                  <span>随机噪声</span>
                  <small>z ~ N(0,1)</small>
                </div>
              </div>
              <div className="flow-arrow generator-arrow"></div>
              <div 
                className="flow-node generator-node"
                onMouseEnter={() => handleNodeHover('generator')}
                onMouseLeave={() => handleNodeLeave('generator')}
              >
                <div className="node-circle">
                  <span>生成器</span>
                  <small>G(z)</small>
                </div>
              </div>
              <div className="flow-arrow fake-arrow"></div>
              <div 
                className="flow-node fake-data-node"
                onMouseEnter={() => handleNodeHover('fake-data')}
                onMouseLeave={() => handleNodeLeave('fake-data')}
              >
                <div className="node-circle">
                  <span>伪造数据</span>
                  <small>x_fake</small>
                </div>
              </div>
            </div>
            
            <div className="discriminator-section">
              <div className="real-data-path">
                <div 
                  className="flow-node real-data-node"
                  onMouseEnter={() => handleNodeHover('real-data')}
                  onMouseLeave={() => handleNodeLeave('real-data')}
                >
                  <div className="node-circle">
                    <span>真实数据</span>
                    <small>x_real</small>
                  </div>
                </div>
                <div className="flow-arrow real-arrow"></div>
              </div>
              
              <div 
                className="flow-node discriminator-node"
                onMouseEnter={() => handleNodeHover('discriminator')}
                onMouseLeave={() => handleNodeLeave('discriminator')}
              >
                <div className="node-circle">
                  <span>判别器</span>
                  <small>D(x)</small>
                </div>
              </div>
              
              <div className="output-section">
                <div className="flow-arrow output-arrow"></div>
                <div 
                  className="flow-node output-node"
                  onMouseEnter={() => handleNodeHover('output')}
                  onMouseLeave={() => handleNodeLeave('output')}
                >
                  <div className="node-circle">
                    <span>真假判别</span>
                    <small>0 or 1</small>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="adversarial-feedback">
              <div className="feedback-arrow"></div>
              <div className="feedback-text">对抗训练反馈</div>
            </div>
          </div>
        </div>
      </div>

      <div className="knowledge-section animate-on-scroll" ref={knowledgeSectionRef}>
        <h2 className="section-title">深入了解 GAN</h2>
        <p className="section-subtitle">点击卡片探索生成对抗网络的核心概念</p>
        
        <div className="knowledge-cards-grid">
          {knowledgeCards.map((card) => (
            <div 
              key={card.id}
              className={`knowledge-card ${selectedCard === card.id ? 'selected' : ''}`}
              onClick={() => handleCardClick(card)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.4)'
              }}
              onMouseLeave={(e) => {
                if (selectedCard !== card.id) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'
                }
              }}
            >
              <div className="card-header">
                <div className="card-icon">{card.icon}</div>
                <div className="card-category">{card.category}</div>
              </div>
              <div className="card-body">
                <h3 className="card-title">{card.title}</h3>
                <p className="card-description">{card.description}</p>
              </div>
              <div className="card-footer">
                <span className="click-hint">
                  {selectedCard === card.id ? '点击收起' : '点击展开'}
                </span>
                <div className="expand-icon">
                  {selectedCard === card.id ? '−' : '+'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 内容详情面板 */}
        {selectedCard && (
          <div className="content-panel">
            <div className="content-header">
              <h2>
                {knowledgeCards.find(card => card.id === selectedCard)?.icon}
                {knowledgeCards.find(card => card.id === selectedCard)?.title}
              </h2>
              <button 
                className="close-btn"
                onClick={() => handleCardClick(knowledgeCards.find(card => card.id === selectedCard))}
              >
                ✕
              </button>
            </div>
            <div className="content-body">
              {renderCardContent(cardContent)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

