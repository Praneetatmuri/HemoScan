import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Activity, Home, Stethoscope, BarChart3, Info, Heart } from 'lucide-react'

function Sidebar({ isOpen, onClose }) {
    const location = useLocation()

    const navItems = [
        { path: '/screening', icon: Stethoscope, label: 'Patient Screening' },
        { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
        { path: '/about', icon: Info, label: 'About' },
    ]

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
            <div className="sidebar-header">
                <NavLink to="/" className="sidebar-logo" onClick={onClose}>
                    <div className="sidebar-logo-icon">
                        <Heart size={20} color="white" />
                    </div>
                    <span className="sidebar-logo-text">HemoScan</span>
                    <span className="sidebar-logo-badge">AI</span>
                </NavLink>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-label">Navigation</div>

                <NavLink
                    to="/"
                    className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
                    onClick={onClose}
                    id="nav-home"
                >
                    <Home size={18} className="nav-item-icon" />
                    <span>Home</span>
                </NavLink>

                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                        id={`nav-${item.path.slice(1)}`}
                    >
                        <item.icon size={18} className="nav-item-icon" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                <div className="nav-section-label" style={{ marginTop: '16px' }}>Quick Actions</div>

                <NavLink
                    to="/screening?mode=quick"
                    className="nav-item"
                    onClick={onClose}
                    id="nav-quick-screen"
                >
                    <Activity size={18} className="nav-item-icon" />
                    <span>Quick Screen</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ marginBottom: '4px' }}>HemoScan AI v1.0</div>
                    <div>© 2026 Team Plasma</div>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
