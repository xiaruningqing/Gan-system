import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // 你同样可以将错误日志上报给服务器
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级后的 UI 并渲染
      return (
        <div style={{
          padding: '30px',
          margin: '20px',
          border: '2px solid #4facfe',
          borderRadius: '12px',
          backgroundColor: 'rgba(79, 172, 254, 0.1)',
          color: '#1a365d',
          textAlign: 'center',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔧</div>
          <h2 style={{ color: '#1a365d', marginBottom: '15px' }}>流程正在优化中</h2>
          <p style={{ color: '#4a5568', marginBottom: '20px', maxWidth: '400px' }}>
            我们正在改进处理流程的稳定性。请稍后再试，或者尝试重新启动流程。
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null })
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4facfe',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🔄 重试流程
            </button>
            <button 
              onClick={() => {
                window.location.reload()
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🏠 刷新页面
            </button>
          </div>
          {this.props.showDetails && (
            <details style={{ marginTop: '20px', textAlign: 'left', width: '100%' }}>
              <summary style={{ cursor: 'pointer', color: '#4a5568' }}>技术详情</summary>
              <pre style={{ 
                fontSize: '11px', 
                overflow: 'auto', 
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                marginTop: '10px',
                color: '#495057'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
