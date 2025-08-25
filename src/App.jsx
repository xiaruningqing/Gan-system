import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import Overview from './pages/Overview'
import ComparativeAnalysis from './pages/ComparativeAnalysis'
import VisualizationPage from './pages/VisualizationPage'
import Toolbox from './pages/Toolbox'
import ImageGeneration from './pages/ImageGeneration'


import './App.css'

function AppContent() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const location = useLocation()
  const isOverviewPage = location.pathname === '/'

  return (
    <div className="App">
      <Navbar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <main className={`main-content ${isSidebarCollapsed ? 'collapsed' : ''} ${isOverviewPage ? 'overview-page' : ''}`}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/comparative-analysis" element={<ComparativeAnalysis />} />
          <Route path="/visualization" element={<VisualizationPage />} />
          <Route path="/toolbox" element={<Toolbox />} />
          <Route path="/image-generation" element={<ImageGeneration />} />


        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App

