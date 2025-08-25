import React, { useState, useEffect } from 'react'
import GanNetwork3D from '../components/GanNetwork3D'
import './VisualizationPage.css'

export default function VisualizationPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingMetrics, setTrainingMetrics] = useState({
    epoch: 0,
    generatorLoss: 2.5,
    discriminatorLoss: 0.8,
    realAccuracy: 0.6,
    fakeAccuracy: 0.4
  })

  const trainingSteps = [
    {
      id: 0,
      title: '采样噪声 z',
      desc: '从高斯/均匀分布采样随机向量',
      detail: '生成器的输入是从标准正态分布 N(0,1) 中采样的随机噪声向量 z，维度通常为 100-512。'
    },
    {
      id: 1,
      title: '生成器 G',
      desc: '将 z 映射为伪造样本 x_fake',
      detail: '生成器网络 G(z) 通过多层神经网络将噪声向量转换为与真实数据相似的伪造样本。'
    },
    {
      id: 2,
      title: '判别器 D',
      desc: '判别 x_fake 与 x_real',
      detail: '判别器网络 D(x) 接收真实数据和伪造数据，输出 0-1 之间的概率值判断数据真假。'
    },
    {
      id: 3,
      title: '损失与梯度',
      desc: '反向传播，交替更新 G 与 D',
      detail: '计算生成器和判别器的损失函数，通过反向传播算法更新网络参数，实现对抗训练。'
    }
  ]

  useEffect(() => {
    let interval
    if (isTraining) {
      interval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % trainingSteps.length)
        setTrainingMetrics(prev => ({
          epoch: prev.epoch + 1,
          generatorLoss: Math.max(0.1, prev.generatorLoss + (Math.random() - 0.5) * 0.2),
          discriminatorLoss: Math.max(0.1, prev.discriminatorLoss + (Math.random() - 0.5) * 0.1),
          realAccuracy: Math.min(0.95, Math.max(0.5, prev.realAccuracy + (Math.random() - 0.5) * 0.1)),
          fakeAccuracy: Math.min(0.95, Math.max(0.05, prev.fakeAccuracy + (Math.random() - 0.5) * 0.1))
        }))
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isTraining, trainingSteps.length])

  return (
    <div className="section visualization-container">
      <div className="visualization-header">
        <h1>GAN 训练过程可视化</h1>
        <p className="text-muted">
          观察生成对抗网络的完整训练流程，理解生成器和判别器的对抗学习机制
        </p>
      </div>

      <div className="visualization-layout">
        <div className="network-3d-container">
          <GanNetwork3D 
            currentStep={currentStep}
            isTraining={isTraining}
            metrics={trainingMetrics}
          />
        </div>

        <div className="control-panel">
          <div className="training-controls">
            <button 
              className={`control-btn ${isTraining ? 'stop' : 'start'}`}
              onClick={() => setIsTraining(!isTraining)}
            >
              {isTraining ? '⏸️ 暂停训练' : '▶️ 开始训练'}
            </button>
            <button 
              className="control-btn reset"
              onClick={() => {
                setIsTraining(false)
                setCurrentStep(0)
                setTrainingMetrics({
                  epoch: 0,
                  generatorLoss: 2.5,
                  discriminatorLoss: 0.8,
                  realAccuracy: 0.6,
                  fakeAccuracy: 0.4
                })
              }}
            >
              🔄 重置
            </button>
          </div>

          <div className="metrics-panel">
            <h3>训练指标</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">训练轮次</span>
                <span className="metric-value">{trainingMetrics.epoch}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">生成器损失</span>
                <span className="metric-value">{trainingMetrics.generatorLoss.toFixed(3)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">判别器损失</span>
                <span className="metric-value">{trainingMetrics.discriminatorLoss.toFixed(3)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">真实数据准确率</span>
                <span className="metric-value">{(trainingMetrics.realAccuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">伪造数据准确率</span>
                <span className="metric-value">{(trainingMetrics.fakeAccuracy * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="step-info">
            <h3>当前步骤</h3>
            <div className="current-step">
              <div className="step-title">{trainingSteps[currentStep].title}</div>
              <div className="step-desc">{trainingSteps[currentStep].desc}</div>
              <div className="step-detail">{trainingSteps[currentStep].detail}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="training-timeline">
        <h3>训练流程</h3>
        <div className="timeline-steps">
          {trainingSteps.map((step, index) => (
            <div 
              key={step.id}
              className={`timeline-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => setCurrentStep(index)}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}















