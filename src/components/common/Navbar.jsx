import React from 'react'
import { NavLink } from 'react-router-dom'
import './Navbar.css'

const navItems = [
  { path: '/', icon: '🏠', text: '概述' },
  { path: '/visualization', icon: '📊', text: '训练可视化' },
  { path: '/image-generation', icon: '🎨', text: '代码实现' },
  { path: '/comparative-analysis', icon: '🚀', text: 'GAN应用' },
  { path: '/toolbox', icon: '🎮', text: 'GAN变体' },

]

export default function Navbar({ isCollapsed, setIsCollapsed }) {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="brand" onClick={() => setIsCollapsed(!isCollapsed)}>
        <span className="logo">GAN</span>
        <span className="title">GAN 可视化实验室</span>
      </div>
      <nav>
        {navItems.map(item => (
          <NavLink 
            key={item.path}
            to={item.path} 
            end={item.path === '/'}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.text}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

