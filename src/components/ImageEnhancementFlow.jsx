import React, { useState, useEffect, useCallback, useMemo } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'

// 图像增强专用节点组件 - 输入节点
const ImageInputNode = ({ data, isConnectable }) => {
  return (
    <div className={`enhancement-node input ${data.isActive ? 'active' : ''}`}>
      <div className="node-header">
        <span className="node-icon">📷</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-content">
        <div className="image-preview">
          {data.imageData && (
            <div className="preview-container">
              <div className="image-display">
                {data.imageData.map((row, rowIndex) => (
                  <div key={rowIndex} className="pixel-row">
                    {row.split('').map((pixel, pixelIndex) => (
                      <div 
                        key={pixelIndex} 
                        className={`pixel ${pixel === '█' ? 'dark' : pixel === '▓' ? 'medium' : 'light'}`}
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="image-info">
                <div className="resolution">分辨率: {data.resolution || '64x64'}</div>
                <div className="quality">质量: {Math.round((data.quality || 0.4) * 100)}%</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="node-status">
        {data.isActive ? '✅ 已加载' : '⏳ 等待'}
      </div>
    </div>
  )
}

// 图像增强专用节点组件 - 处理节点
const ProcessingNode = ({ data, isConnectable }) => {
  return (
    <div className={`enhancement-node processing ${data.isActive ? 'active' : ''} ${data.processingType || ''}`}>
      <div className="node-header">
        <span className="node-icon">{data.icon || '⚙️'}</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-content">
        <div className="processing-display">
          {data.isActive && (
            <div className="processing-animation">
              <div className="processing-bars">
                {Array.from({ length: 5 }, (_, i) => (
                  <div 
                    key={i} 
                    className="processing-bar"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
              <div className="processing-text">处理中...</div>
            </div>
          )}
          {!data.isActive && (
            <div className="waiting-state">
              <div className="waiting-icon">⏸️</div>
              <div className="waiting-text">等待处理</div>
            </div>
          )}
        </div>
        
        {data.isActive && data.parameters && (
          <div className="processing-params">
            {Object.entries(data.parameters).map(([key, value]) => (
              <div key={key} className="param">
                <span className="param-name">{key}:</span>
                <span className="param-value">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="node-status">
        {data.isActive ? '🔄 处理中' : '⏳ 等待'}
      </div>
    </div>
  )
}

// 图像增强专用节点组件 - 输出节点
const EnhancedOutputNode = ({ data, isConnectable }) => {
  return (
    <div className={`enhancement-node output ${data.isActive ? 'active' : ''}`}>
      <div className="node-header">
        <span className="node-icon">🖼️</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-content">
        <div className="output-preview">
          {data.enhancedImage && (
            <div className="enhanced-container">
              <div className="image-display enhanced">
                {data.enhancedImage.map((row, rowIndex) => (
                  <div key={rowIndex} className="pixel-row">
                    {row.split('').map((pixel, pixelIndex) => (
                      <div 
                        key={pixelIndex} 
                        className={`pixel enhanced ${pixel === '█' ? 'dark' : pixel === '▓' ? 'medium' : 'light'}`}
                        style={{
                          animationDelay: data.isActive ? `${(rowIndex * 16 + pixelIndex) * 5}ms` : '0ms'
                        }}
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="enhancement-metrics">
                <div className="metric">
                  <span className="metric-label">分辨率提升:</span>
                  <span className="metric-value">{data.resolutionGain || '4x'}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">质量提升:</span>
                  <span className="metric-value">{Math.round(((data.qualityAfter || 0.9) - (data.qualityBefore || 0.4)) * 100)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">PSNR:</span>
                  <span className="metric-value">{data.psnr || '28.5'} dB</span>
                </div>
              </div>
            </div>
          )}
          {!data.enhancedImage && (
            <div className="placeholder-output">
              <div className="placeholder-grid">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="placeholder-row">
                    {Array.from({ length: 16 }, (_, j) => (
                      <div key={j} className="placeholder-pixel"></div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="placeholder-text">等待增强...</div>
            </div>
          )}
        </div>
      </div>
      <div className="node-status">
        {data.isActive ? '✅ 增强完成' : '⏳ 等待'}
      </div>
    </div>
  )
}

// 自定义边组件
const EnhancementEdge = ({ id, sourceX, sourceY, targetX, targetY, data }) => {
  const edgePath = `M${sourceX},${sourceY} L${targetX},${targetY}`
  
  return (
    <g>
      <path
        id={id}
        style={{
          stroke: data?.isActive ? '#4caf50' : '#ccc',
          strokeWidth: data?.isActive ? 3 : 2,
          strokeDasharray: data?.isActive ? '5,5' : 'none',
          animation: data?.isActive ? 'flowAnimation 2s linear infinite' : 'none',
        }}
        d={edgePath}
        markerEnd="url(#arrowhead)"
      />
      {data?.isActive && (
        <circle
          r="4"
          fill="#4caf50"
          style={{
            animation: 'moveAlongPath 2s linear infinite',
            offsetPath: `path('${edgePath}')`,
          }}
        />
      )}
    </g>
  )
}

export default function ImageEnhancementFlow({ currentStep = 0, onStepChange, enhancementData }) {
  // 节点类型配置
  const nodeTypes = useMemo(() => ({
    imageInput: ImageInputNode,
    processing: ProcessingNode,
    enhancedOutput: EnhancedOutputNode,
  }), [])

  // 边类型配置
  const edgeTypes = useMemo(() => ({
    enhancement: EnhancementEdge,
  }), [])

  // 初始节点配置
  const initialNodes = useMemo(() => [
    {
      id: 'low-res-input',
      type: 'imageInput',
      position: { x: 50, y: 150 },
      data: {
        label: '低分辨率输入',
        isActive: false,
        imageData: [
          "▓▓▓▓▓▓▓▓",
          "▓      ▓",
          "▓  ▓▓  ▓",
          "▓      ▓",
          "▓  ▓▓  ▓",
          "▓      ▓",
          "▓      ▓",
          "▓▓▓▓▓▓▓▓"
        ],
        resolution: '64x64',
        quality: 0.4,
      },
    },
    {
      id: 'preprocessing',
      type: 'processing',
      position: { x: 300, y: 50 },
      data: {
        label: '预处理',
        icon: '🔧',
        processingType: 'preprocess',
        isActive: false,
        parameters: {
          '去噪': 'Gaussian',
          '标准化': 'Z-score',
          '对比度': '+15%'
        }
      },
    },
    {
      id: 'generator',
      type: 'processing',
      position: { x: 550, y: 150 },
      data: {
        label: 'SRGAN生成器',
        icon: '🎯',
        processingType: 'generator',
        isActive: false,
        parameters: {
          '网络': 'ResNet',
          '层数': '16',
          '上采样': '4x'
        }
      },
    },
    {
      id: 'discriminator',
      type: 'processing',
      position: { x: 550, y: 300 },
      data: {
        label: '判别器',
        icon: '🔍',
        processingType: 'discriminator',
        isActive: false,
        parameters: {
          '网络': 'VGG',
          '层数': '19',
          '损失': 'Perceptual'
        }
      },
    },
    {
      id: 'postprocessing',
      type: 'processing',
      position: { x: 800, y: 50 },
      data: {
        label: '后处理',
        icon: '✨',
        processingType: 'postprocess',
        isActive: false,
        parameters: {
          '锐化': 'Unsharp Mask',
          '色彩': 'Enhanced',
          '细节': 'Preserved'
        }
      },
    },
    {
      id: 'high-res-output',
      type: 'enhancedOutput',
      position: { x: 1050, y: 150 },
      data: {
        label: '高分辨率输出',
        isActive: false,
        enhancedImage: null,
        resolutionGain: '4x',
        qualityBefore: 0.4,
        qualityAfter: 0.92,
        psnr: '28.5'
      },
    },
  ], [])

  // 初始边配置
  const initialEdges = useMemo(() => [
    {
      id: 'input-to-preprocess',
      source: 'low-res-input',
      target: 'preprocessing',
      type: 'smoothstep',
      animated: false,
      style: { 
        stroke: '#2196f3', 
        strokeWidth: 3,
        strokeDasharray: '10,5'
      },
      data: { 
        isActive: false,
        label: '输入处理',
        color: '#2196f3'
      },
      markerEnd: { 
        type: MarkerType.ArrowClosed, 
        color: '#2196f3',
        width: 18,
        height: 18
      },
    },
    {
      id: 'preprocess-to-generator',
      source: 'preprocessing',
      target: 'generator',
      type: 'smoothstep',
      animated: false,
      style: { 
        stroke: '#ff9800', 
        strokeWidth: 3,
        strokeDasharray: '10,5'
      },
      data: { 
        isActive: false,
        label: '特征提取',
        color: '#ff9800'
      },
      markerEnd: { 
        type: MarkerType.ArrowClosed, 
        color: '#ff9800',
        width: 18,
        height: 18
      },
    },
    {
      id: 'generator-to-discriminator',
      source: 'generator',
      target: 'discriminator',
      type: 'smoothstep',
      animated: false,
      style: { 
        stroke: '#9c27b0', 
        strokeWidth: 3,
        strokeDasharray: '10,5'
      },
      data: { 
        isActive: false,
        label: '质量评估',
        color: '#9c27b0'
      },
      markerEnd: { 
        type: MarkerType.ArrowClosed, 
        color: '#9c27b0',
        width: 18,
        height: 18
      },
    },
    {
      id: 'generator-to-postprocess',
      source: 'generator',
      target: 'postprocessing',
      type: 'smoothstep',
      animated: false,
      style: { 
        stroke: '#4caf50', 
        strokeWidth: 3,
        strokeDasharray: '10,5'
      },
      data: { 
        isActive: false,
        label: '图像生成',
        color: '#4caf50'
      },
      markerEnd: { 
        type: MarkerType.ArrowClosed, 
        color: '#4caf50',
        width: 18,
        height: 18
      },
    },
    {
      id: 'postprocess-to-output',
      source: 'postprocessing',
      target: 'high-res-output',
      type: 'smoothstep',
      animated: false,
      style: { 
        stroke: '#f44336', 
        strokeWidth: 3,
        strokeDasharray: '10,5'
      },
      data: { 
        isActive: false,
        label: '输出优化',
        color: '#f44336'
      },
      markerEnd: { 
        type: MarkerType.ArrowClosed, 
        color: '#f44336',
        width: 18,
        height: 18
      },
    },
  ], [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // 根据当前步骤更新节点和边的状态
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const newNode = { ...node }
        
        switch (currentStep) {
          case 0: // 输入图像
            newNode.data = {
              ...newNode.data,
              isActive: node.id === 'low-res-input',
            }
            break
          case 1: // 预处理
            newNode.data = {
              ...newNode.data,
              isActive: ['low-res-input', 'preprocessing'].includes(node.id),
            }
            break
          case 2: // SRGAN生成
            newNode.data = {
              ...newNode.data,
              isActive: ['preprocessing', 'generator', 'discriminator'].includes(node.id),
            }
            break
          case 3: // 后处理
            newNode.data = {
              ...newNode.data,
              isActive: ['generator', 'postprocessing'].includes(node.id),
            }
            break
          case 4: // 输出结果
            newNode.data = {
              ...newNode.data,
              isActive: ['postprocessing', 'high-res-output'].includes(node.id),
            }
            // 更新输出图像
            if (node.id === 'high-res-output') {
              newNode.data.enhancedImage = [
                "████████████████",
                "██            ██",
                "██  ████████  ██",
                "██  ██    ██  ██",
                "██  ██    ██  ██",
                "██  ████████  ██",
                "██            ██",
                "██  ████████  ██",
                "██  ██    ██  ██",
                "██  ██    ██  ██",
                "██  ████████  ██",
                "████████████████"
              ]
              newNode.data.qualityAfter = 0.92
              newNode.data.psnr = (28.5 + Math.random() * 2).toFixed(1)
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
        
        switch (currentStep) {
          case 0:
            newEdge.data = { ...newEdge.data, isActive: false }
            break
          case 1:
            newEdge.data = { 
              ...newEdge.data, 
              isActive: edge.id === 'input-to-preprocess' 
            }
            break
          case 2:
            newEdge.data = { 
              ...newEdge.data, 
              isActive: ['input-to-preprocess', 'preprocess-to-generator', 'generator-to-discriminator'].includes(edge.id)
            }
            break
          case 3:
            newEdge.data = { 
              ...newEdge.data, 
              isActive: ['preprocess-to-generator', 'generator-to-postprocess'].includes(edge.id)
            }
            break
          case 4:
            newEdge.data = { 
              ...newEdge.data, 
              isActive: ['generator-to-postprocess', 'postprocess-to-output'].includes(edge.id)
            }
            break
          default:
            newEdge.data = { ...newEdge.data, isActive: false }
        }
        
        return newEdge
      })
    )
  }, [currentStep, setNodes, setEdges])

  // 节点点击处理
  const onNodeClick = useCallback((event, node) => {
    if (onStepChange) {
      const stepMap = {
        'low-res-input': 0,
        'preprocessing': 1,
        'generator': 2,
        'postprocessing': 3,
        'high-res-output': 4,
      }
      const step = stepMap[node.id]
      if (step !== undefined) {
        onStepChange(step)
      }
    }
  }, [onStepChange])

  return (
    <div className="image-enhancement-flow">
      <div className="flow-header">
        <h3>GAN图像增强处理流程</h3>
        <div className="flow-description">
          Super-Resolution GAN (SRGAN) 图像超分辨率增强技术
        </div>
        <div className="flow-legend">
          <div className="legend-item">
            <div className="legend-color input"></div>
            <span>输入图像</span>
          </div>
          <div className="legend-item">
            <div className="legend-color processing"></div>
            <span>处理模块</span>
          </div>
          <div className="legend-item">
            <div className="legend-color output"></div>
            <span>增强输出</span>
          </div>
        </div>
      </div>
      
      <div className="react-flow-wrapper" style={{ height: '500px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'imageInput': return '#2196f3'
                case 'processing': return '#ff9800'
                case 'enhancedOutput': return '#4caf50'
                default: return '#ccc'
              }
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
      
      <div className="flow-controls">
        <div className="step-indicators">
          {['输入图像', '预处理', 'SRGAN生成', '后处理', '输出结果'].map((stepName, index) => (
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
        .image-enhancement-flow {
          width: 100%;
          height: 700px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .flow-header {
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .flow-header h3 {
          margin: 0 0 8px 0;
          color: white;
          font-size: 24px;
          font-weight: 600;
        }
        
        .flow-description {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          margin-bottom: 15px;
        }
        
        .flow-legend {
          display: flex;
          gap: 20px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
        }
        
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
        
        .legend-color.input { background: #2196f3; }
        .legend-color.processing { background: #ff9800; }
        .legend-color.output { background: #4caf50; }
        
        /* 增强节点样式 */
        .enhancement-node {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 2px solid transparent;
          transition: all 0.3s ease;
          min-width: 200px;
        }
        
        .enhancement-node.active {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          transform: scale(1.02);
        }
        
        .enhancement-node.input {
          border-left: 4px solid #2196f3;
        }
        
        .enhancement-node.input.active {
          border-color: #2196f3;
          box-shadow: 0 8px 32px rgba(33, 150, 243, 0.3);
        }
        
        .enhancement-node.processing {
          border-left: 4px solid #ff9800;
        }
        
        .enhancement-node.processing.active {
          border-color: #ff9800;
          box-shadow: 0 8px 32px rgba(255, 152, 0, 0.3);
        }
        
        .enhancement-node.output {
          border-left: 4px solid #4caf50;
        }
        
        .enhancement-node.output.active {
          border-color: #4caf50;
          box-shadow: 0 8px 32px rgba(76, 175, 80, 0.3);
        }
        
        .node-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        
        .node-icon {
          font-size: 20px;
        }
        
        .node-title {
          font-weight: 600;
          color: #333;
          font-size: 16px;
        }
        
        /* 图像预览样式 */
        .image-preview, .output-preview {
          text-align: center;
          min-height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .preview-container, .enhanced-container {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
        }
        
        .image-display {
          display: inline-block;
          background: white;
          padding: 6px;
          border-radius: 4px;
          border: 2px solid #e0e0e0;
          margin-bottom: 8px;
        }
        
        .image-display.enhanced {
          border-color: #4caf50;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
        }
        
        .pixel-row {
          display: block;
          white-space: nowrap;
          height: 8px;
          line-height: 8px;
        }
        
        .pixel {
          display: inline-block;
          width: 3px;
          height: 3px;
          margin: 0.5px;
          border-radius: 1px;
          transition: all 0.3s ease;
        }
        
        .pixel.enhanced {
          width: 2px;
          height: 2px;
          margin: 0.25px;
        }
        
        .pixel.dark {
          background: #333;
        }
        
        .pixel.medium {
          background: #999;
        }
        
        .pixel.light {
          background: #f0f0f0;
        }
        
        .pixel.enhanced.dark {
          background: #222;
          animation: pixelEnhance 2s ease-in-out infinite;
        }
        
        @keyframes pixelEnhance {
          0%, 100% { box-shadow: none; }
          50% { box-shadow: 0 0 3px rgba(76, 175, 80, 0.8); }
        }
        
        .image-info, .enhancement-metrics {
          display: flex;
          gap: 12px;
          justify-content: center;
          font-size: 11px;
        }
        
        .resolution, .quality, .metric {
          background: #e3f2fd;
          padding: 4px 8px;
          border-radius: 4px;
          color: #1976d2;
        }
        
        .metric-label {
          font-weight: 500;
        }
        
        .metric-value {
          color: #333;
          font-family: monospace;
        }
        
        /* 处理动画样式 */
        .processing-display {
          text-align: center;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .processing-animation {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .processing-bars {
          display: flex;
          gap: 4px;
          justify-content: center;
        }
        
        .processing-bar {
          width: 4px;
          height: 20px;
          background: #ff9800;
          border-radius: 2px;
          animation: processingPulse 1.5s ease-in-out infinite;
        }
        
        @keyframes processingPulse {
          0%, 100% { height: 20px; opacity: 0.6; }
          50% { height: 30px; opacity: 1; }
        }
        
        .processing-text {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }
        
        .waiting-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #999;
        }
        
        .waiting-icon {
          font-size: 24px;
        }
        
        .waiting-text {
          font-size: 12px;
        }
        
        .processing-params {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
          justify-content: center;
        }
        
        .param {
          background: #fff3e0;
          padding: 3px 6px;
          border-radius: 3px;
          font-size: 10px;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        
        .param-name {
          color: #f57c00;
          font-weight: 500;
        }
        
        .param-value {
          color: #333;
          font-family: monospace;
        }
        
        /* 占位符样式 */
        .placeholder-output {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #999;
        }
        
        .placeholder-grid {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: white;
          padding: 4px;
          border-radius: 3px;
          border: 1px solid #ddd;
        }
        
        .placeholder-row {
          display: flex;
          gap: 1px;
        }
        
        .placeholder-pixel {
          width: 2px;
          height: 2px;
          background: #f0f0f0;
          border-radius: 1px;
        }
        
        .placeholder-text {
          font-size: 11px;
          color: #999;
        }
        
        .node-status {
          font-size: 12px;
          color: #666;
          text-align: center;
          padding-top: 8px;
          border-top: 1px solid #eee;
        }
        
        /* 流程控制样式 */
        .flow-controls {
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }
        
        .step-indicators {
          display: flex;
          justify-content: center;
          gap: 12px;
        }
        
        .step-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 80px;
        }
        
        .step-indicator:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .step-indicator.active {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }
        
        .step-indicator.completed {
          background: rgba(76, 175, 80, 0.3);
        }
        
        .step-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }
        
        .step-indicator.active .step-number {
          background: #4caf50;
        }
        
        .step-indicator.completed .step-number {
          background: #4caf50;
        }
        
        .step-name {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
