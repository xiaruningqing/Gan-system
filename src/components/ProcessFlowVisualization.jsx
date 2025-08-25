import React, { useState, useEffect, useCallback, useMemo } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { gsap } from 'gsap'

// 自定义节点组件 - 数据输入节点
const DataInputNode = ({ data, isConnectable }) => {
  return (
    <div className={`process-node data-input ${data.isActive ? 'active' : ''}`}>
      <div className="node-header">
        <span className="node-icon">📊</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-content">
        <div className="data-preview">
          {data.isActive && (
            <div className="data-animation">
              <div className="data-particle"></div>
              <div className="data-particle"></div>
              <div className="data-particle"></div>
            </div>
          )}
          <span className="data-type">{data.dataType}</span>
        </div>
      </div>
      <div className="node-status">
        {data.isActive ? '🟢 活跃' : '⚪ 等待'}
      </div>
    </div>
  )
}

// 自定义节点组件 - 网络处理节点
const NetworkNode = ({ data, isConnectable }) => {
  return (
    <div className={`process-node network ${data.isActive ? 'active' : ''} ${data.networkType}`}>
      <div className="node-header">
        <span className="node-icon">{data.networkType === 'generator' ? '🎨' : '🔍'}</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-content">
        <div className="network-layers">
          {data.layers && data.layers.map((layer, index) => (
            <div key={index} className={`layer ${data.isActive ? 'processing' : ''}`}>
              <div className="layer-neurons">
                {Array.from({ length: layer.neurons }, (_, i) => (
                  <div key={i} className="neuron"></div>
                ))}
              </div>
              <span className="layer-label">{layer.name}</span>
            </div>
          ))}
        </div>
        {data.isActive && (
          <div className="processing-indicator">
            <div className="processing-bar"></div>
          </div>
        )}
      </div>
      <div className="node-metrics">
        {data.metrics && (
          <>
            <div className="metric">
              <span>Loss: {data.metrics.loss}</span>
            </div>
            <div className="metric">
              <span>Acc: {data.metrics.accuracy}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// 自定义节点组件 - 输出节点
const OutputNode = ({ data, isConnectable }) => {
  return (
    <div className={`process-node output ${data.isActive ? 'active' : ''} ${data.outputType || ''}`}>
      <div className="node-header">
        <span className="node-icon">{data.icon || '🖼️'}</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-content">
        {/* 图像输出预览 */}
        {data.outputType === 'image' && (
          <div className="output-preview">
            <div className="generated-image-display">
              <div className="image-frame">
                <div className="image-grid">
                  {data.generatedImage && data.generatedImage.map((row, rowIndex) => (
                    <div key={rowIndex} className="pixel-row">
                      {row.split('').map((pixel, pixelIndex) => (
                        <div 
                          key={pixelIndex} 
                          className={`pixel-cell ${pixel === '█' ? 'solid' : pixel === '▓' ? 'medium' : 'light'}`}
                          style={{
                            animationDelay: data.isActive ? `${(rowIndex * 12 + pixelIndex) * 8}ms` : '0ms'
                          }}
                        ></div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="image-overlay">
                  <div className="generation-status">
                    {data.isActive ? (
                      <div className="status-active">
                        <span className="status-icon">✨</span>
                        <span className="status-text">数字 {data.digit}</span>
                      </div>
                    ) : (
                      <div className="status-waiting">
                        <span className="status-icon">⏳</span>
                        <span className="status-text">等待生成</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {data.isActive && (
                <div className="generation-metrics">
                  <div className="metric-item">
                    <span className="metric-icon">📊</span>
                    <span className="metric-label">质量</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill" 
                        style={{ width: `${(data.quality || 0.8) * 100}%` }}
                      ></div>
                    </div>
                    <span className="metric-value">{Math.round((data.quality || 0.8) * 100)}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-icon">⚡</span>
                    <span className="metric-label">速度</span>
                    <span className="metric-value">12ms</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 判别结果输出 */}
        {data.outputType === 'decision' && (
          <div className="decision-preview">
            <div className="decision-container">
              <div className="decision-frame">
                <div className={`decision-result ${data.isActive ? 'active' : ''}`}>
                  <div className="result-display">
                    <div className="result-icon-wrapper">
                      <div className="result-icon">
                        {data.isActive ? '✅' : '🔍'}
                      </div>
                      {data.isActive && (
                        <div className="result-pulse"></div>
                      )}
                    </div>
                    <div className="result-content">
                      <div className="result-label">
                        {data.isActive ? (data.result === 'real' ? '识别为真实图像' : '成功生成图像') : '分析中...'}
                      </div>
                      {data.isActive && (
                        <div className="result-details">
                          <div className="confidence-display">
                            <span className="confidence-label">置信度</span>
                            <div className="confidence-bar">
                              <div 
                                className="confidence-fill" 
                                style={{ width: `${Math.round((data.confidence || 0.85) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="confidence-value">{Math.round((data.confidence || 0.85) * 100)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {data.isActive && (
                  <div className="analysis-animation">
                    <div className="scan-line"></div>
                    <div className="analysis-particles">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="particle" style={{ animationDelay: `${i * 0.2}s` }}></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {data.isActive && (
                <div className="decision-metrics">
                  <div className="metric-item">
                    <span className="metric-icon">🎯</span>
                    <span className="metric-label">准确率</span>
                    <span className="metric-value">{data.metrics?.['准确率'] || '85%'}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-icon">⚡</span>
                    <span className="metric-label">响应</span>
                    <span className="metric-value">{data.metrics?.['响应时间'] || '12ms'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 处理指标 */}
        {data.isActive && data.metrics && (
          <div className="node-metrics">
            {Object.entries(data.metrics).map(([key, value]) => (
              <div key={key} className="metric">
                <span className="metric-label">{key}:</span>
                <span className="metric-value">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="node-status">
        <div className={`status-indicator ${data.isActive ? 'active' : 'inactive'}`}>
          <div className="status-dot"></div>
          <span>{data.isActive ? '✅ 完成' : '⏳ 等待'}</span>
        </div>
      </div>
    </div>
  )
}

// 自定义边组件 - 数据流边
const DataFlowEdge = ({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  data,
  style = {},
  markerEnd 
}) => {
  // 创建平滑的贝塞尔曲线路径
  const controlPointX = (sourceX + targetX) / 2
  const controlPointY1 = sourceY
  const controlPointY2 = targetY
  
  const edgePath = `M${sourceX},${sourceY} C${controlPointX},${controlPointY1} ${controlPointX},${controlPointY2} ${targetX},${targetY}`
  
  // 合并样式
  const edgeStyle = {
    stroke: data?.isActive ? (data?.color || '#7c4dff') : (data?.color || '#7c4dff'),
    strokeWidth: data?.isActive ? 10 : 7,
    fill: 'none',
    opacity: data?.isActive ? 1 : 0.8,
    strokeDasharray: data?.isActive ? 'none' : '15,8',
    filter: data?.isActive ? `drop-shadow(0 0 16px ${data?.color || '#7c4dff'})` : `drop-shadow(0 0 10px ${data?.color || '#7c4dff'})`,
    ...style
  }
  
  return (
    <g>
      <defs>
        <marker
          id={`arrowhead-${id}`}
          markerWidth="20"
          markerHeight="20"
          refX="18"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={data?.isActive ? (data?.color || '#7c4dff') : '#666'}
            opacity={data?.isActive ? 1 : 0.3}
          />
        </marker>
      </defs>
      
      <path
        id={id}
        style={edgeStyle}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={`url(#arrowhead-${id})`}
      />
      
      {data?.isActive && (
        <>
          <circle r="5" fill={data?.color || '#7c4dff'} className="data-flow-particle">
            <animateMotion dur="2s" repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
          
          {/* 数据流标签 */}
          {data?.label && (
            <text
              x={(sourceX + targetX) / 2}
              y={(sourceY + targetY) / 2 - 10}
              textAnchor="middle"
              fontSize="11"
              fill={data?.color || '#7c4dff'}
              className="edge-label"
            >
              {data.label}
            </text>
          )}
        </>
      )}
    </g>
  )
}

// 节点类型映射
const nodeTypes = {
  dataInput: DataInputNode,
  network: NetworkNode,
  output: OutputNode,
}

// 边类型映射
const edgeTypes = {
  dataFlow: DataFlowEdge,
}

export default function ProcessFlowVisualization({ 
  currentStep, 
  isTraining, 
  trainingData,
  isFullscreen = false,
  onExitFullscreen,
  onStepChange 
}) {
  // 初始节点配置
  const initialNodes = useMemo(() => [
    {
      id: 'noise-input',
      type: 'dataInput',
      position: { x: 50, y: 200 },
      data: {
        label: '噪声输入',
        dataType: 'Random Noise (z)',
        isActive: false,
      },
    },
    {
      id: 'real-data',
      type: 'dataInput',
      position: { x: 50, y: 400 },
      data: {
        label: '真实数据',
        dataType: 'Real Images',
        isActive: false,
      },
    },
    {
      id: 'generator',
      type: 'network',
      position: { x: 300, y: 150 },
      data: {
        label: '生成器 (G)',
        networkType: 'generator',
        isActive: false,
        layers: [
          { name: 'Input', neurons: 8 },
          { name: 'Hidden1', neurons: 12 },
          { name: 'Hidden2', neurons: 16 },
          { name: 'Output', neurons: 10 },
        ],
        metrics: {
          loss: '0.000',
          accuracy: '0%',
        },
      },
    },
    {
      id: 'discriminator',
      type: 'network',
      position: { x: 600, y: 300 },
      data: {
        label: '判别器 (D)',
        networkType: 'discriminator',
        isActive: false,
        layers: [
          { name: 'Input', neurons: 10 },
          { name: 'Hidden1', neurons: 8 },
          { name: 'Hidden2', neurons: 4 },
          { name: 'Output', neurons: 1 },
        ],
        metrics: {
          loss: '0.000',
          accuracy: '0%',
        },
      },
    },
    {
      id: 'fake-output',
      type: 'output',
      position: { x: 550, y: 100 },
      data: {
        label: '生成图像',
        icon: '🖼️',
        outputType: 'image',
        isActive: false,
        generatedImage: [
          "  ▓▓▓▓▓▓  ",
          " ▓      ▓ ",
          "▓        ▓",
          "▓        ▓",
          "▓        ▓",
          "▓        ▓",
          "▓        ▓",
          " ▓      ▓ ",
          "  ▓▓▓▓▓▓  "
        ],
        digit: '?',
        quality: 0.75,
        metrics: {
          '分辨率': '28x28',
          '格式': 'PNG'
        }
      },
    },
    {
      id: 'decision-output',
      type: 'output',
      position: { x: 850, y: 300 },
      data: {
        label: '判别结果',
        icon: '🔍',
        outputType: 'decision',
        isActive: false,
        result: 'unknown',
        confidence: 0.85,
        metrics: {
          '准确率': '85%',
          '响应时间': '12ms'
        }
      },
    },
  ], [])

  // 初始边配置
  const initialEdges = useMemo(() => [
    {
      id: 'noise-to-generator',
      source: 'noise-input',
      target: 'generator',
      type: 'dataFlow',
      animated: false,
      style: { 
        stroke: '#4caf50', 
        strokeWidth: 8,
        strokeDasharray: '15,8',
        filter: 'drop-shadow(0 0 12px #4caf50)',
        opacity: 0.8
      },
      data: { 
        isActive: false,
        label: '噪声输入',
        color: '#4caf50'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#4caf50',
        width: 24,
        height: 24
      },
    },
    {
      id: 'generator-to-fake',
      source: 'generator',
      target: 'fake-output',
      type: 'dataFlow',
      animated: false,
      style: { 
        stroke: '#7c4dff', 
        strokeWidth: 8,
        strokeDasharray: '15,8',
        filter: 'drop-shadow(0 0 12px #7c4dff)',
        opacity: 0.8
      },
      data: { 
        isActive: false,
        label: '生成图像',
        color: '#7c4dff'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#7c4dff',
        width: 24,
        height: 24
      },
    },
    {
      id: 'fake-to-discriminator',
      source: 'fake-output',
      target: 'discriminator',
      type: 'dataFlow',
      animated: false,
      style: { 
        stroke: '#ff9800', 
        strokeWidth: 8,
        strokeDasharray: '15,8',
        filter: 'drop-shadow(0 0 12px #ff9800)',
        opacity: 0.8
      },
      data: { 
        isActive: false,
        label: '生成样本',
        color: '#ff9800'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#ff9800',
        width: 24,
        height: 24
      },
    },
    {
      id: 'real-to-discriminator',
      source: 'real-data',
      target: 'discriminator',
      type: 'dataFlow',
      animated: false,
      style: { 
        stroke: '#26c6da', 
        strokeWidth: 8,
        strokeDasharray: '15,8',
        filter: 'drop-shadow(0 0 12px #26c6da)',
        opacity: 0.8
      },
      data: { 
        isActive: false,
        label: '真实样本',
        color: '#26c6da'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#26c6da',
        width: 24,
        height: 24
      },
    },
    {
      id: 'discriminator-to-decision',
      source: 'discriminator',
      target: 'decision-output',
      type: 'dataFlow',
      animated: false,
      style: { 
        stroke: '#e91e63', 
        strokeWidth: 8,
        strokeDasharray: '15,8',
        filter: 'drop-shadow(0 0 12px #e91e63)',
        opacity: 0.8
      },
      data: { 
        isActive: false,
        label: '判别结果',
        color: '#e91e63'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#e91e63',
        width: 24,
        height: 24
      },
    },
  ], [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [animationComplete, setAnimationComplete] = useState(false)

  // 根据当前步骤更新节点和边的状态
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const newNode = { ...node }
        
        switch (currentStep) {
          case 0: // 采样噪声
            newNode.data = {
              ...newNode.data,
              isActive: node.id === 'noise-input',
            }
            break
          case 1: // 生成器处理
            newNode.data = {
              ...newNode.data,
              isActive: ['noise-input', 'generator'].includes(node.id),
            }
            if (node.id === 'generator' && trainingData) {
              newNode.data.metrics = {
                loss: trainingData.generatorLoss || '0.000',
                accuracy: '0%',
              }
            }
            break
          case 2: // 判别器处理
            newNode.data = {
              ...newNode.data,
              isActive: ['generator', 'fake-output', 'real-data', 'discriminator'].includes(node.id),
            }
            // 更新生成图像输出
            if (node.id === 'fake-output') {
              if (trainingData?.resultImage) {
                newNode.data.generatedImage = trainingData.resultImage
                newNode.data.digit = Math.floor(Math.random() * 10)
                newNode.data.quality = 0.9 + Math.random() * 0.1
              } else {
                newNode.data.generatedImage = [
                  "  ████████  ",
                  " ██      ██ ",
                  "██        ██",
                  "██   ██   ██",
                  "██        ██",
                  "██   ██   ██",
                  "██        ██",
                  " ██      ██ ",
                  "  ████████  "
                ]
                newNode.data.digit = Math.floor(Math.random() * 10)
                newNode.data.quality = 0.85 + Math.random() * 0.15
              }
            }
            if (node.id === 'discriminator' && trainingData) {
              newNode.data.metrics = {
                loss: '0.523',
                accuracy: '87%',
              }
            }
            break
          case 3: // 损失计算和更新
            newNode.data = {
              ...newNode.data,
              isActive: ['discriminator', 'decision-output'].includes(node.id),
            }
            // 更新判别结果输出
            if (node.id === 'decision-output') {
              newNode.data.result = Math.random() > 0.6 ? 'real' : 'fake'
              newNode.data.confidence = 0.8 + Math.random() * 0.2
              newNode.data.metrics = {
                '准确率': `${Math.round((0.85 + Math.random() * 0.15) * 100)}%`,
                '响应时间': `${Math.round(8 + Math.random() * 12)}ms`
              }
            }
            break
          default:
            newNode.data = {
              ...newNode.data,
              isActive: false,
            }
        }
        
        return newNode
      })
    )

    setEdges((eds) =>
      eds.map((edge) => {
        const newEdge = { ...edge }
        const isActive = (() => {
          switch (currentStep) {
            case 0:
              return edge.id === 'noise-to-generator'
            case 1:
              return ['noise-to-generator', 'generator-to-fake'].includes(edge.id)
            case 2:
              return ['fake-to-discriminator', 'real-to-discriminator'].includes(edge.id)
            case 3:
              return edge.id === 'discriminator-to-decision'
            default:
              return false
          }
        })()
        
        newEdge.data = { 
          ...newEdge.data,
          isActive: isActive 
        }
        newEdge.animated = isActive
        
        // 更新边的样式
        if (isActive) {
          newEdge.style = {
            ...newEdge.style,
            strokeWidth: 12,
            strokeDasharray: 'none',
            stroke: newEdge.data.color,
            filter: `drop-shadow(0 0 20px ${newEdge.data.color})`,
            opacity: 1
          }
          newEdge.animated = true
        } else {
          newEdge.style = {
            ...newEdge.style,
            strokeWidth: 8,
            strokeDasharray: '15,8',
            stroke: newEdge.data.color,
            filter: `drop-shadow(0 0 12px ${newEdge.data.color})`,
            opacity: 0.8
          }
          newEdge.animated = false
        }
        
        return newEdge
      })
    )
  }, [currentStep, trainingData, setNodes, setEdges])

  // 检测动画完成并自动退出全屏
  useEffect(() => {
    if (isFullscreen && currentStep >= 4) {
      // 动画完成后延迟2秒退出全屏
      const timer = setTimeout(() => {
        setAnimationComplete(true)
        if (onExitFullscreen) {
          onExitFullscreen()
        }
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [currentStep, isFullscreen, onExitFullscreen])

  // 处理连接
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // 处理节点点击
  const onNodeClick = useCallback((event, node) => {
    if (onStepChange) {
      // 根据点击的节点确定步骤
      const stepMap = {
        'noise-input': 0,
        'generator': 1,
        'discriminator': 2,
        'decision-output': 3,
      }
      const step = stepMap[node.id]
      if (step !== undefined) {
        onStepChange(step)
      }
    }
  }, [onStepChange])

  return (
    <div className={`process-flow-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="flow-header">
        <h3>GAN 处理流程图</h3>
        <div className="flow-legend">
          <div className="legend-item">
            <div className="legend-color data-input"></div>
            <span>数据输入</span>
          </div>
          <div className="legend-item">
            <div className="legend-color generator"></div>
            <span>生成器</span>
          </div>
          <div className="legend-item">
            <div className="legend-color discriminator"></div>
            <span>判别器</span>
          </div>
          <div className="legend-item">
            <div className="legend-color output"></div>
            <span>输出结果</span>
          </div>
        </div>
      </div>
      
      <div className="react-flow-wrapper" style={{ height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{
            padding: 0.2,
            minZoom: 0.5,
            maxZoom: 2
          }}
          defaultZoom={0.8}
          minZoom={0.3}
          maxZoom={3}
          attributionPosition="bottom-left"
          connectionLineStyle={{
            strokeWidth: 4,
            stroke: '#7c4dff',
            filter: 'drop-shadow(0 0 8px #7c4dff)'
          }}
        >
          <Controls 
            showZoom={true}
            showFitView={true}
            showInteractive={true}
            position="bottom-left"
          />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'dataInput': return '#4caf50'
                case 'network': return node.data.networkType === 'generator' ? '#7c4dff' : '#26c6da'
                case 'output': return '#ffa726'
                default: return '#ccc'
              }
            }}
            position="top-right"
            zoomable={true}
            pannable={true}
            style={{
              height: 150,
              width: 200,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px'
            }}
          />
          <Background variant="dots" gap={16} size={2} color="#666" />
        </ReactFlow>
      </div>
      
      <div className="flow-controls">
        <div className="step-indicators">
          {['噪声采样', '生成器', '判别器', '损失计算'].map((stepName, index) => (
            <div 
              key={index}
              className={`step-indicator ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => onStepChange && onStepChange(index)}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-name">{stepName}</div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        /* 输出节点专用样式 */
        .process-node.output {
          background: transparent;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 2px solid transparent;
          transition: all 0.3s ease;
          min-width: 220px;
          border-left: 4px solid #ffa726;
        }
        
        .process-node.output.active {
          border-color: #ffa726;
          box-shadow: 0 8px 32px rgba(255, 167, 38, 0.3);
          transform: scale(1.02);
        }
        
        .process-node.output.image {
          border-left-color: #4caf50;
          background: rgba(76, 175, 80, 0.1);
          border: 2px solid rgba(76, 175, 80, 0.3);
        }
        
        .process-node.output.image.active {
          background: rgba(76, 175, 80, 0.15);
          border-color: #4caf50;
          box-shadow: 0 8px 32px rgba(76, 175, 80, 0.4);
        }
        
        .process-node.output.decision {
          border-left-color: #e91e63;
          background: rgba(233, 30, 99, 0.1);
          border: 2px solid rgba(233, 30, 99, 0.3);
        }
        
        .process-node.output.decision.active {
          background: rgba(233, 30, 99, 0.15);
          border-color: #e91e63;
          box-shadow: 0 8px 32px rgba(233, 30, 99, 0.4);
        }
        
        /* 图像输出预览 */
        .output-preview {
          text-align: center;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .generated-image-display {
          background: linear-gradient(135deg, rgba(124, 77, 255, 0.1) 0%, rgba(63, 81, 181, 0.1) 100%);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(124, 77, 255, 0.2);
        }
        
        .image-frame {
          position: relative;
          display: inline-block;
          background: transparent;
          padding: 12px;
          border-radius: 8px;
          border: 2px solid rgba(76, 175, 80, 0.4);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
          margin-bottom: 12px;
          backdrop-filter: blur(8px);
        }
        
        .image-grid {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        
        .pixel-row {
          display: flex;
          gap: 1px;
        }
        
        .pixel-cell {
          width: 6px;
          height: 6px;
          border-radius: 1px;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .pixel-cell.solid {
          background: #212529;
          animation: pixelEnhance 2s ease-in-out infinite;
        }
        
        .pixel-cell.medium {
          background: #6c757d;
        }
        
        .pixel-cell.light {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
        }
        
        @keyframes pixelEnhance {
          0%, 100% { 
            box-shadow: none; 
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 6px rgba(33, 37, 41, 0.8);
            transform: scale(1.1);
          }
        }
        
        .image-overlay {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 6px;
          padding: 6px 10px;
          backdrop-filter: blur(4px);
        }
        
        .generation-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .status-active {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #28a745;
        }
        
        .status-waiting {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #6c757d;
        }
        
        .status-icon {
          font-size: 14px;
        }
        
        .status-text {
          font-size: 11px;
          font-weight: 600;
        }
        
        .generation-metrics {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .metric-item {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(124, 77, 255, 0.1);
          border: 1px solid rgba(124, 77, 255, 0.2);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          backdrop-filter: blur(4px);
        }
        
        .metric-icon {
          font-size: 12px;
        }
        
        .metric-label {
          color: #495057;
          font-weight: 500;
        }
        
        .metric-bar {
          width: 40px;
          height: 4px;
          background: #e9ecef;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .metric-fill {
          height: 100%;
          background: linear-gradient(90deg, #28a745, #20c997);
          border-radius: 2px;
          transition: width 0.5s ease;
        }
        
        .metric-value {
          color: #212529;
          font-weight: 600;
          font-family: monospace;
        }
        
        /* 判别结果预览 */
        .decision-preview {
          text-align: center;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .decision-container {
          background: linear-gradient(135deg, rgba(233, 30, 99, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(233, 30, 99, 0.2);
        }
        
        .decision-frame {
          position: relative;
          background: transparent;
          border-radius: 8px;
          border: 2px solid rgba(233, 30, 99, 0.4);
          box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
          padding: 16px;
          margin-bottom: 12px;
          backdrop-filter: blur(8px);
        }
        
        .decision-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .result-display {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .result-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .result-icon {
          font-size: 28px;
          z-index: 2;
          position: relative;
        }
        
        .result-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(40, 167, 69, 0.2);
          animation: pulseEffect 2s ease-in-out infinite;
        }
        
        @keyframes pulseEffect {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.7;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 0.3;
          }
        }
        
        .result-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .result-label {
          font-size: 14px;
          font-weight: 600;
          color: #212529;
        }
        
        .result-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .confidence-display {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .confidence-label {
          font-size: 11px;
          color: #6c757d;
          font-weight: 500;
        }
        
        .confidence-bar {
          width: 60px;
          height: 4px;
          background: #e9ecef;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .confidence-fill {
          height: 100%;
          background: linear-gradient(90deg, #dc3545, #fd7e14);
          border-radius: 2px;
          transition: width 0.5s ease;
        }
        
        .confidence-value {
          font-size: 11px;
          color: #212529;
          font-weight: 600;
          font-family: monospace;
        }
        
        .analysis-animation {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .scan-line {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(220, 53, 69, 0.2), transparent);
          animation: scanAnalysis 3s ease-in-out infinite;
        }
        
        @keyframes scanAnalysis {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .analysis-particles {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #dc3545;
          border-radius: 50%;
          animation: particleFloat 2s ease-in-out infinite;
        }
        
        .particle:nth-child(1) { top: -20px; left: -10px; }
        .particle:nth-child(2) { top: -15px; left: 10px; }
        .particle:nth-child(3) { top: 5px; left: -15px; }
        .particle:nth-child(4) { top: 10px; left: 15px; }
        .particle:nth-child(5) { top: 20px; left: -5px; }
        .particle:nth-child(6) { top: 15px; left: 5px; }
        
        @keyframes particleFloat {
          0%, 100% { 
            opacity: 0.3;
            transform: translateY(0px);
          }
          50% { 
            opacity: 1;
            transform: translateY(-10px);
          }
        }
        
        .decision-metrics {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .decision-metrics .metric-item {
          background: rgba(233, 30, 99, 0.1);
          border: 1px solid rgba(233, 30, 99, 0.2);
        }
        
        /* 节点指标 */
        .node-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
          justify-content: center;
        }
        
        .metric {
          background: #e3f2fd;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .metric-label {
          color: #1976d2;
          font-weight: 500;
        }
        
        .metric-value {
          color: #333;
          font-family: monospace;
        }
        
        /* 状态指示器 */
        .node-status {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid #eee;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          color: #666;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ccc;
          transition: all 0.3s ease;
        }
        
        .status-indicator.active .status-dot {
          background: #4caf50;
          animation: statusPulse 1.5s ease-in-out infinite;
        }
        
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .status-indicator.inactive .status-dot {
          background: #ccc;
        }
        
        /* 增强连接线视觉效果 */
        .react-flow__edge-path {
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        
        .react-flow__edge.animated .react-flow__edge-path {
          stroke-dasharray: 20;
          animation: dashdraw 2s linear infinite;
        }
        
        @keyframes dashdraw {
          to {
            stroke-dashoffset: -40;
          }
        }
        
        /* 全屏模式下增强连接线可见性 */
        .process-flow-container.fullscreen .react-flow__edge-path {
          stroke-width: 12px !important;
          filter: drop-shadow(0 0 20px currentColor) !important;
          opacity: 1 !important;
        }
        
        .process-flow-container.fullscreen .react-flow__edge.animated .react-flow__edge-path {
          stroke-width: 16px !important;
          filter: drop-shadow(0 0 30px currentColor) drop-shadow(0 0 60px currentColor) !important;
        }
        
        .react-flow__edge-text {
          font-size: 12px;
          font-weight: 600;
          text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
          fill: white;
        }
        
        .react-flow__controls {
          background: rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          backdrop-filter: blur(8px);
        }
        
        .react-flow__controls-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          transition: all 0.3s ease;
        }
        
        .react-flow__controls-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }
        
        .react-flow__minimap {
          background: rgba(0, 0, 0, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          backdrop-filter: blur(8px);
        }
        
        /* 全屏样式 */
        .process-flow-container.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          background: #000000;
          padding: 20px;
          box-sizing: border-box;
        }
        
        .process-flow-container.fullscreen .react-flow-wrapper {
          height: calc(100vh - 160px) !important;
          border-radius: 12px;
          overflow: visible;
          box-shadow: 0 20px 60px rgba(255, 255, 255, 0.1);
          background: rgba(20, 20, 20, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        .process-flow-container.fullscreen .flow-header {
          margin-bottom: 15px;
        }
        
        .process-flow-container.fullscreen .flow-header h3 {
          color: white;
          font-size: 2.2rem;
          text-align: center;
          margin-bottom: 15px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
        }
        
        .process-flow-container.fullscreen .flow-legend {
          justify-content: center;
          background: rgba(255, 255, 255, 0.15);
          padding: 12px;
          border-radius: 10px;
          backdrop-filter: blur(10px);
          margin-bottom: 15px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .process-flow-container.fullscreen .legend-item span {
          color: white;
          font-weight: 600;
        }
        
        /* 全屏模式下节点增强 */
        .process-flow-container.fullscreen .process-node {
          transform: scale(1.1);
          box-shadow: 0 8px 32px rgba(255, 255, 255, 0.2) !important;
          border-width: 3px !important;
        }
        
        .process-flow-container.fullscreen .process-node.active {
          transform: scale(1.2);
          box-shadow: 0 12px 48px rgba(255, 255, 255, 0.4) !important;
        }
        
        .process-flow-container.fullscreen .react-flow__controls {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .process-flow-container.fullscreen .react-flow__minimap {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        /* 全屏时的退出提示 */
        .process-flow-container.fullscreen::after {
          content: "按 ESC 键退出全屏";
          position: absolute;
          top: 20px;
          right: 20px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}
