import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import LandingPage from './pages/LandingPage'
import ScreeningPage from './pages/ScreeningPage'
import DashboardPage from './pages/DashboardPage'
import AboutPage from './pages/AboutPage'

function AppLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = React.useState(false)

    return (
        <div className="app-layout">
            <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                id="mobile-menu-toggle"
            >
                ☰
            </button>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main-content">
                {children}
            </main>
        </div>
    )
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/screening" element={
                    <AppLayout><ScreeningPage /></AppLayout>
                } />
                <Route path="/dashboard" element={
                    <AppLayout><DashboardPage /></AppLayout>
                } />
                <Route path="/about" element={
                    <AppLayout><AboutPage /></AppLayout>
                } />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
