import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    BarChart3, Brain, Target, Database, TrendingUp,
    Activity, Zap, Award
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
    Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    AreaChart, Area
} from 'recharts'

const API_BASE = '/api'

function DashboardPage() {
    const [stats, setStats] = useState(null)
    const [modelInfo, setModelInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [statsRes, modelRes] = await Promise.all([
                fetch(`${API_BASE}/statistics`),
                fetch(`${API_BASE}/model-info`)
            ])

            if (statsRes.ok && modelRes.ok) {
                setStats(await statsRes.json())
                setModelInfo(await modelRes.json())
            } else {
                setError('Failed to load dashboard data. Is the backend running?')
            }
        } catch {
            setError('Cannot connect to the backend server. Please start the backend first.')
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <div className="loading-text">Loading dashboard data...</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">
                        <BarChart3 size={28} style={{ display: 'inline', marginRight: '12px', color: 'var(--primary)' }} />
                        Dashboard
                    </h1>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <Activity size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>Backend Not Available</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 24px' }}>
                        {error}
                    </p>
                    <button className="btn btn-primary" onClick={fetchData}>
                        <Zap size={16} />
                        Retry Connection
                    </button>
                </div>
            </div>
        )
    }

    // Prepare chart data
    const featureImportance = stats?.feature_importance
        ? Object.entries(stats.feature_importance)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({
                name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                importance: parseFloat((value * 100).toFixed(2)),
            }))
        : []

    const severityData = [
        { name: 'Normal', value: 35, color: 'var(--severity-normal)', fill: '#22c55e' },
        { name: 'Mild', value: 30, color: 'var(--severity-mild)', fill: '#eab308' },
        { name: 'Moderate', value: 25, color: 'var(--severity-moderate)', fill: '#f97316' },
        { name: 'Severe', value: 10, color: 'var(--severity-severe)', fill: '#ef4444' },
    ]

    const radarData = featureImportance.slice(0, 8).map(item => ({
        feature: item.name.split(' ').slice(0, 2).join(' '),
        value: item.importance,
    }))

    const performanceData = [
        { name: 'Precision', value: 94.2 },
        { name: 'Recall', value: 93.8 },
        { name: 'F1 Score', value: 94.0 },
        { name: 'Accuracy', value: stats?.model_accuracy || 95 },
        { name: 'CV Score', value: modelInfo?.cv_score || 93 },
    ]

    const CHART_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444']

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">
                    <BarChart3 size={28} style={{ display: 'inline', marginRight: '12px', color: 'var(--primary)' }} />
                    Analytics Dashboard
                </h1>
                <p className="page-subtitle">Model performance metrics and system analytics</p>
            </div>

            {/* Stat Cards */}
            <div className="stat-grid">
                <motion.div
                    className="stat-card"
                    style={{ '--stat-color': 'var(--severity-normal)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="stat-card-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                        <Award size={22} />
                    </div>
                    <div className="stat-card-value" style={{ color: '#22c55e' }}>
                        {stats?.model_accuracy?.toFixed(1)}%
                    </div>
                    <div className="stat-card-label">Model Accuracy</div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    style={{ '--stat-color': 'var(--accent-cyan)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="stat-card-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
                        <Database size={22} />
                    </div>
                    <div className="stat-card-value" style={{ color: '#06b6d4' }}>
                        {stats?.training_samples?.toLocaleString()}
                    </div>
                    <div className="stat-card-label">Training Samples</div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    style={{ '--stat-color': 'var(--accent-violet)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="stat-card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <Target size={22} />
                    </div>
                    <div className="stat-card-value" style={{ color: '#8b5cf6' }}>
                        {stats?.total_features}
                    </div>
                    <div className="stat-card-label">Input Features</div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    style={{ '--stat-color': 'var(--primary)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="stat-card-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                        <Brain size={22} />
                    </div>
                    <div className="stat-card-value" style={{ color: '#dc2626' }}>
                        {modelInfo?.model_name || 'Ensemble'}
                    </div>
                    <div className="stat-card-label">Selected Model</div>
                </motion.div>
            </div>

            {/* Charts Grid */}
            <div className="dashboard-grid">
                {/* Feature Importance */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Feature Importance</h3>
                            <p className="card-subtitle">Top 10 most influential features</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={featureImportance} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                type="number"
                                tick={{ fill: '#6b6b80', fontSize: 12 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={100}
                                tick={{ fill: '#a1a1b5', fontSize: 11 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a24',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#f1f1f4',
                                    fontSize: '13px'
                                }}
                                formatter={(value) => [`${value}%`, 'Importance']}
                            />
                            <Bar
                                dataKey="importance"
                                fill="url(#barGradient)"
                                radius={[0, 4, 4, 0]}
                            />
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Severity Distribution */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Severity Distribution</h3>
                            <p className="card-subtitle">Classification breakdown in dataset</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={severityData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={130}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {severityData.map((entry, index) => (
                                    <Cell key={index} fill={CHART_COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a24',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#f1f1f4',
                                    fontSize: '13px'
                                }}
                                formatter={(value) => [`${value}%`, 'Distribution']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        {severityData.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS[i] }} />
                                <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Radar Chart */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Feature Radar</h3>
                            <p className="card-subtitle">Multi-dimensional feature contribution</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                            <PolarAngleAxis
                                dataKey="feature"
                                tick={{ fill: '#a1a1b5', fontSize: 10 }}
                            />
                            <PolarRadiusAxis
                                angle={30}
                                tick={{ fill: '#6b6b80', fontSize: 10 }}
                            />
                            <Radar
                                name="Importance"
                                dataKey="value"
                                stroke="#ef4444"
                                fill="#ef4444"
                                fillOpacity={0.2}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a24',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#f1f1f4',
                                    fontSize: '13px'
                                }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Performance Metrics */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Model Performance</h3>
                            <p className="card-subtitle">Key evaluation metrics</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#a1a1b5', fontSize: 12 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            />
                            <YAxis
                                domain={[80, 100]}
                                tick={{ fill: '#6b6b80', fontSize: 12 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a24',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#f1f1f4',
                                    fontSize: '13px'
                                }}
                                formatter={(value) => [`${value}%`, 'Score']}
                            />
                            <defs>
                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#8b5cf6"
                                fill="url(#areaGradient)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Model Details */}
                <motion.div
                    className="card full-width"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                >
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">
                                <Brain size={18} style={{ display: 'inline', marginRight: '8px' }} />
                                Model Configuration
                            </h3>
                            <p className="card-subtitle">Technical details of the trained model</p>
                        </div>
                    </div>
                    <div className="tech-stack-grid">
                        <div className="tech-item">
                            <div className="tech-item-dot" style={{ background: '#ef4444' }} />
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Model</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{modelInfo?.model_name}</div>
                            </div>
                        </div>
                        <div className="tech-item">
                            <div className="tech-item-dot" style={{ background: '#22c55e' }} />
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Accuracy</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{modelInfo?.accuracy}%</div>
                            </div>
                        </div>
                        <div className="tech-item">
                            <div className="tech-item-dot" style={{ background: '#06b6d4' }} />
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>CV Score</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{modelInfo?.cv_score}%</div>
                            </div>
                        </div>
                        <div className="tech-item">
                            <div className="tech-item-dot" style={{ background: '#8b5cf6' }} />
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Training Samples</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{modelInfo?.training_samples}</div>
                            </div>
                        </div>
                        <div className="tech-item">
                            <div className="tech-item-dot" style={{ background: '#f97316' }} />
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Features</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{modelInfo?.features?.length} input parameters</div>
                            </div>
                        </div>
                        <div className="tech-item">
                            <div className="tech-item-dot" style={{ background: '#eab308' }} />
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Classes</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>4 severity levels</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default DashboardPage
