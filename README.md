# GAN 可视化实验室

一个基于 React 和 Three.js 的生成对抗网络（GAN）可视化学习平台，专为16:9宽屏显示优化。

## 功能特性

- 🎯 **GAN 概述** - 交互式3D可视化展示GAN架构
- 🔄 **训练过程可视化** - 动态展示GAN训练流程
- 🖼️ **图像生成演示** - 模拟GAN图像生成过程
- 📊 **对比分析** - 比较不同GAN变体（DCGAN、WGAN、CycleGAN）
- 🛠️ **参数工具箱** - 调整训练超参数
- 📺 **视频教学** - 集成教学视频资源

## 技术栈

- **前端框架**: React 19 + Vite
- **3D渲染**: Three.js + @react-three/fiber + @react-three/drei
- **路由**: React Router DOM
- **样式**: CSS3 + CSS Grid + Flexbox
- **构建工具**: Vite + ESLint

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── components/
│   ├── common/
│   │   ├── Navbar.jsx          # 导航栏组件
│   │   └── Navbar.css
│   └── Gan3dModel.jsx          # GAN 3D模型组件
├── pages/
│   ├── Overview.jsx            # 概述页面
│   ├── VisualizationPage.jsx   # 训练可视化
│   ├── ImageGeneration.jsx     # 图像生成
│   ├── ComparativeAnalysis.jsx # 对比分析
│   ├── Toolbox.jsx            # 工具箱
│   └── VideoTutorial.jsx      # 视频教学
├── App.jsx                    # 主应用组件
├── App.css                    # 全局样式
└── main.jsx                   # 应用入口
```

## 16:9 优化特性

- 响应式网格布局，充分利用宽屏空间
- 侧边导航栏适配宽屏比例
- 3D可视化组件优化视角和布局
- 视频内容原生16:9比例支持
- 断点响应式设计，兼容不同屏幕尺寸

## 开发说明

本项目采用现代React开发模式：
- 使用函数组件和Hooks
- CSS变量统一主题色彩
- 模块化组件设计
- 响应式布局适配

## 许可证

MIT License


