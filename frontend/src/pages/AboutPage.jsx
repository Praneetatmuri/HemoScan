import React from 'react'
import { motion } from 'framer-motion'
import {
    Info, Heart, Code2, Shield, Users, Globe,
    Cpu, Database, Layers, Monitor, Smartphone, Cloud
} from 'lucide-react'

function AboutPage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">
                    <Info size={28} style={{ display: 'inline', marginRight: '12px', color: 'var(--primary)' }} />
                    About HemoScan AI
                </h1>
                <p className="page-subtitle">AI-powered anemia detection and risk analysis system</p>
            </div>

            <motion.div
                className="about-content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Overview */}
                <motion.div className="about-card" variants={itemVariants}>
                    <h3>
                        <Heart size={20} color="var(--primary)" />
                        Overview
                    </h3>
                    <p>
                        HemoScan AI is an intelligent anemia detection and risk analysis platform designed to enable
                        early screening, risk prediction, and preventive intervention using artificial intelligence.
                        The system leverages machine learning algorithms to analyze patient data such as hemoglobin levels,
                        age, gender, medical history, dietary habits, and symptoms to predict anemia severity and future
                        risk probability.
                    </p>
                    <p style={{ marginTop: '12px' }}>
                        The system provides instant classification (<strong>Normal / Mild / Moderate / Severe Anemia</strong>)
                        along with personalized recommendations and referral alerts.
                    </p>
                </motion.div>

                {/* Key Features */}
                <motion.div className="about-card" variants={itemVariants}>
                    <h3>
                        <Cpu size={20} color="var(--accent-cyan)" />
                        Key Features
                    </h3>
                    <ul>
                        <li>AI-based predictive engine using XGBoost & Random Forest ensemble</li>
                        <li>Comprehensive risk scoring module with 20+ health parameters</li>
                        <li>Dashboard for healthcare professionals with interactive analytics</li>
                        <li>Web interface for patient screening with quick and full modes</li>
                        <li>Alert and monitoring system for critical conditions</li>
                        <li>Personalized recommendations and referral guidance</li>
                        <li>Future risk forecasting at 3, 6, and 12-month intervals</li>
                    </ul>
                </motion.div>

                {/* Novelty */}
                <motion.div className="about-card" variants={itemVariants}>
                    <h3>
                        <Shield size={20} color="var(--accent-violet)" />
                        Novelty & Uniqueness
                    </h3>
                    <ul>
                        <li>Integrates AI-driven predictive modeling with risk severity scoring</li>
                        <li>Provides preventive alerts before condition becomes critical</li>
                        <li>Works as a low-cost digital screening tool for remote areas</li>
                        <li>Future integration capability with IoT hemoglobin sensors</li>
                        <li>Focuses on both detection AND risk forecasting, unlike traditional lab reports</li>
                        <li>Offers predictive analytics and personalized intervention recommendations</li>
                    </ul>
                </motion.div>

                {/* Impact */}
                <motion.div className="about-card" variants={itemVariants}>
                    <h3>
                        <Globe size={20} color="var(--accent-emerald)" />
                        Social & Business Impact
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                                🌍 Social Impact
                            </h4>
                            <ul>
                                <li>Early anemia detection reduces maternal and child mortality</li>
                                <li>Supports public health programs in underserved communities</li>
                                <li>Useful in rural healthcare camps and mobile screening</li>
                                <li>Promotes preventive healthcare awareness</li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                                💼 Business Impact
                            </h4>
                            <ul>
                                <li>Deployable in clinics, telemedicine platforms, and diagnostic centers</li>
                                <li>Scalable SaaS-based healthcare solution</li>
                                <li>Reduces diagnostic delays and healthcare costs</li>
                                <li>Partnership opportunities with hospitals and NGOs</li>
                            </ul>
                        </div>
                    </div>
                    <p style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(34, 197, 94, 0.08)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
                        <strong style={{ color: 'var(--severity-normal)' }}>SDG Alignment:</strong>{' '}
                        <span>This solution aligns with <strong>SDG 3 – Good Health & Well-being</strong></span>
                    </p>
                </motion.div>

                {/* Technology Stack */}
                <motion.div className="about-card" variants={itemVariants}>
                    <h3>
                        <Code2 size={20} color="var(--accent-orange)" />
                        Technology Architecture
                    </h3>
                    <div className="tech-stack-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                        {[
                            { icon: <Monitor size={16} />, label: 'Frontend', tech: 'React.js, Vite, Framer Motion' },
                            { icon: <Layers size={16} />, label: 'Backend', tech: 'Python, FastAPI, Uvicorn' },
                            { icon: <Cpu size={16} />, label: 'Machine Learning', tech: 'Scikit-learn, XGBoost' },
                            { icon: <Database size={16} />, label: 'Data Processing', tech: 'Pandas, NumPy, Joblib' },
                            { icon: <Smartphone size={16} />, label: 'UI Components', tech: 'Recharts, Lucide Icons' },
                            { icon: <Cloud size={16} />, label: 'Deployment', tech: 'AWS / Azure / Render ready' },
                        ].map((item, i) => (
                            <div key={i} className="tech-item">
                                <div style={{ color: 'var(--primary)' }}>{item.icon}</div>
                                <div>
                                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.label}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.tech}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Team */}
                <motion.div className="about-card" variants={itemVariants}>
                    <h3>
                        <Users size={20} color="var(--primary)" />
                        Team Plasma
                    </h3>
                    <p>
                        Built by <strong>Team Plasma</strong> — a team of 7 members passionate about
                        leveraging AI for accessible healthcare solutions. Our mission is to make anemia
                        screening fast, affordable, and available to everyone, especially in rural and
                        low-resource settings.
                    </p>
                </motion.div>

                {/* Disclaimer */}
                <motion.div className="about-card" variants={itemVariants} style={{ borderColor: 'rgba(234, 179, 8, 0.2)' }}>
                    <h3 style={{ color: 'var(--severity-mild)' }}>
                        <Shield size={20} />
                        Limitations & Disclaimer
                    </h3>
                    <ul>
                        <li>Requires quality dataset for high accuracy predictions</li>
                        <li>Not a replacement for full medical diagnosis — screening support tool only</li>
                        <li>Results should be interpreted by qualified healthcare professionals</li>
                        <li>Performance depends on the accuracy of input patient data</li>
                    </ul>
                </motion.div>
            </motion.div>
        </div>
    )
}

export default AboutPage
