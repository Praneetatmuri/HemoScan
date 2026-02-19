import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Stethoscope, Zap, Send, RotateCcw, AlertTriangle, CheckCircle,
    ChevronDown, ChevronUp, TrendingUp, Shield, Droplets, Activity
} from 'lucide-react'

const API_BASE = '/api'

function ScreeningPage() {
    const [searchParams] = useSearchParams()
    const isQuickMode = searchParams.get('mode') === 'quick'

    const [mode, setMode] = useState(isQuickMode ? 'quick' : 'full')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        age: '',
        gender: 0,
        hemoglobin: '',
        rbc_count: 4.5,
        mcv: 85,
        mch: 29,
        mchc: 33,
        hematocrit: 40,
        iron_level: 80,
        ferritin: 100,
        diet_quality: 1,
        chronic_disease: 0,
        pregnancy: 0,
        family_history_anemia: 0,
        fatigue: 0,
        pale_skin: 0,
        shortness_of_breath: 0,
        dizziness: 0,
        cold_hands_feet: 0,
        bmi: 24,
    })

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const endpoint = mode === 'quick' ? `${API_BASE}/quick-screen` : `${API_BASE}/predict`
            const payload = mode === 'quick'
                ? {
                    age: parseInt(formData.age),
                    gender: formData.gender,
                    hemoglobin: parseFloat(formData.hemoglobin),
                    fatigue: formData.fatigue,
                    pale_skin: formData.pale_skin,
                    dizziness: formData.dizziness,
                    diet_quality: formData.diet_quality,
                    pregnancy: formData.pregnancy,
                }
                : {
                    ...formData,
                    age: parseInt(formData.age),
                    hemoglobin: parseFloat(formData.hemoglobin),
                    rbc_count: parseFloat(formData.rbc_count),
                    mcv: parseFloat(formData.mcv),
                    mch: parseFloat(formData.mch),
                    mchc: parseFloat(formData.mchc),
                    hematocrit: parseFloat(formData.hematocrit),
                    iron_level: parseFloat(formData.iron_level),
                    ferritin: parseFloat(formData.ferritin),
                    bmi: parseFloat(formData.bmi),
                }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const errData = await res.json()
                let errorMsg = 'Prediction failed'
                if (typeof errData.detail === 'string') {
                    errorMsg = errData.detail
                } else if (Array.isArray(errData.detail)) {
                    errorMsg = errData.detail.map(e => {
                        const field = e.loc ? e.loc[e.loc.length - 1] : 'field'
                        return `${field}: ${e.msg}`
                    }).join('; ')
                }
                throw new Error(errorMsg)
            }

            const data = await res.json()
            setResult(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setResult(null)
        setError(null)
        setFormData({
            age: '', gender: 0, hemoglobin: '', rbc_count: 4.5, mcv: 85,
            mch: 29, mchc: 33, hematocrit: 40, iron_level: 80, ferritin: 100,
            diet_quality: 1, chronic_disease: 0, pregnancy: 0,
            family_history_anemia: 0, fatigue: 0, pale_skin: 0,
            shortness_of_breath: 0, dizziness: 0, cold_hands_feet: 0, bmi: 24,
        })
    }

    const severityColorMap = {
        'Normal': 'var(--severity-normal)',
        'Mild Anemia': 'var(--severity-mild)',
        'Moderate Anemia': 'var(--severity-moderate)',
        'Severe Anemia': 'var(--severity-severe)',
    }

    const badgeClassMap = {
        'Normal': 'badge-normal',
        'Mild Anemia': 'badge-mild',
        'Moderate Anemia': 'badge-moderate',
        'Severe Anemia': 'badge-severe',
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">
                    <Stethoscope size={28} style={{ display: 'inline', marginRight: '12px', color: 'var(--primary)' }} />
                    Patient Screening
                </h1>
                <p className="page-subtitle">Enter patient data for AI-powered anemia detection and risk analysis</p>
            </div>

            {/* Mode Tabs */}
            <div className="tabs" id="screening-mode-tabs">
                <button
                    className={`tab ${mode === 'quick' ? 'active' : ''}`}
                    onClick={() => { setMode('quick'); setResult(null); }}
                    id="tab-quick"
                >
                    <Zap size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Quick Screen
                </button>
                <button
                    className={`tab ${mode === 'full' ? 'active' : ''}`}
                    onClick={() => { setMode('full'); setResult(null); }}
                    id="tab-full"
                >
                    <Activity size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Full Analysis
                </button>
            </div>

            <AnimatePresence mode="wait">
                {!result ? (
                    <motion.form
                        key="form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleSubmit}
                    >
                        {/* Basic Info Section */}
                        <div className="card" style={{ marginBottom: '24px' }}>
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title">Patient Information</h3>
                                    <p className="card-subtitle">
                                        {mode === 'quick' ? 'Enter basic parameters for quick screening' : 'Enter comprehensive patient data for full analysis'}
                                    </p>
                                </div>
                            </div>

                            <div className="form-grid">
                                {/* Age */}
                                <div className="form-group">
                                    <label className="form-label">
                                        Age <span className="form-label-required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.age}
                                        onChange={e => handleChange('age', e.target.value)}
                                        placeholder="e.g. 25"
                                        min="1"
                                        max="120"
                                        required
                                        id="input-age"
                                    />
                                </div>

                                {/* Gender */}
                                <div className="form-group">
                                    <label className="form-label">
                                        Gender <span className="form-label-required">*</span>
                                    </label>
                                    <div className="toggle-group">
                                        <button
                                            type="button"
                                            className={`toggle-btn ${formData.gender === 0 ? 'active' : ''}`}
                                            onClick={() => handleChange('gender', 0)}
                                            id="btn-female"
                                        >
                                            Female
                                        </button>
                                        <button
                                            type="button"
                                            className={`toggle-btn ${formData.gender === 1 ? 'active' : ''}`}
                                            onClick={() => handleChange('gender', 1)}
                                            id="btn-male"
                                        >
                                            Male
                                        </button>
                                    </div>
                                </div>

                                {/* Hemoglobin */}
                                <div className="form-group">
                                    <label className="form-label">
                                        Hemoglobin (g/dL) <span className="form-label-required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.hemoglobin}
                                        onChange={e => handleChange('hemoglobin', e.target.value)}
                                        placeholder="e.g. 12.5"
                                        step="0.1"
                                        min="1"
                                        max="25"
                                        required
                                        id="input-hemoglobin"
                                    />
                                    <span className="form-hint">Normal: Male 13.5-17.5, Female 12-16 g/dL</span>
                                </div>

                                {/* Diet Quality */}
                                <div className="form-group">
                                    <label className="form-label">Diet Quality</label>
                                    <select
                                        className="form-select"
                                        value={formData.diet_quality}
                                        onChange={e => handleChange('diet_quality', parseInt(e.target.value))}
                                        id="select-diet"
                                    >
                                        <option value={0}>Poor</option>
                                        <option value={1}>Average</option>
                                        <option value={2}>Good</option>
                                    </select>
                                </div>

                                {/* Pregnancy (only for female) */}
                                {formData.gender === 0 && (
                                    <div className="form-group">
                                        <label className="form-label">Pregnancy</label>
                                        <div className="toggle-group">
                                            <button
                                                type="button"
                                                className={`toggle-btn ${formData.pregnancy === 0 ? 'active' : ''}`}
                                                onClick={() => handleChange('pregnancy', 0)}
                                            >
                                                No
                                            </button>
                                            <button
                                                type="button"
                                                className={`toggle-btn ${formData.pregnancy === 1 ? 'active' : ''}`}
                                                onClick={() => handleChange('pregnancy', 1)}
                                            >
                                                Yes
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Symptoms */}
                        <div className="card" style={{ marginBottom: '24px' }}>
                            <div className="card-header">
                                <h3 className="card-title">Symptoms</h3>
                            </div>
                            <div className="checkbox-group">
                                {[
                                    { key: 'fatigue', label: 'Fatigue / Weakness' },
                                    { key: 'pale_skin', label: 'Pale Skin' },
                                    { key: 'dizziness', label: 'Dizziness / Lightheadedness' },
                                    ...(mode === 'full' ? [
                                        { key: 'shortness_of_breath', label: 'Shortness of Breath' },
                                        { key: 'cold_hands_feet', label: 'Cold Hands & Feet' },
                                    ] : [])
                                ].map(symptom => (
                                    <label key={symptom.key} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            className="checkbox-input"
                                            checked={formData[symptom.key] === 1}
                                            onChange={e => handleChange(symptom.key, e.target.checked ? 1 : 0)}
                                            id={`check-${symptom.key}`}
                                        />
                                        {symptom.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Full Mode: Lab values and medical history */}
                        {mode === 'full' && (
                            <>
                                <div className="card" style={{ marginBottom: '24px' }}>
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <Droplets size={18} style={{ display: 'inline', marginRight: '8px', color: 'var(--primary)' }} />
                                            Blood Panel Values
                                        </h3>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setShowAdvanced(!showAdvanced)}
                                            id="btn-toggle-advanced"
                                        >
                                            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            {showAdvanced ? 'Less' : 'More'}
                                        </button>
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">RBC Count (M/μL)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.rbc_count}
                                                onChange={e => handleChange('rbc_count', e.target.value)}
                                                step="0.01"
                                                id="input-rbc"
                                            />
                                            <span className="form-hint">Normal: 4.0-5.5 M/μL</span>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Iron Level (μg/dL)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.iron_level}
                                                onChange={e => handleChange('iron_level', e.target.value)}
                                                step="0.1"
                                                id="input-iron"
                                            />
                                            <span className="form-hint">Normal: 60-170 μg/dL</span>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Ferritin (ng/mL)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.ferritin}
                                                onChange={e => handleChange('ferritin', e.target.value)}
                                                step="0.1"
                                                id="input-ferritin"
                                            />
                                            <span className="form-hint">Normal: 20-250 ng/mL</span>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Hematocrit (%)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.hematocrit}
                                                onChange={e => handleChange('hematocrit', e.target.value)}
                                                step="0.1"
                                                id="input-hematocrit"
                                            />
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {showAdvanced && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                style={{ overflow: 'hidden', marginTop: '20px' }}
                                            >
                                                <div className="section-divider">
                                                    <div className="section-divider-line"></div>
                                                    <span className="section-divider-text">Advanced Parameters</span>
                                                    <div className="section-divider-line"></div>
                                                </div>

                                                <div className="form-grid">
                                                    <div className="form-group">
                                                        <label className="form-label">MCV (fL)</label>
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            value={formData.mcv}
                                                            onChange={e => handleChange('mcv', e.target.value)}
                                                            step="0.1"
                                                            id="input-mcv"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">MCH (pg)</label>
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            value={formData.mch}
                                                            onChange={e => handleChange('mch', e.target.value)}
                                                            step="0.1"
                                                            id="input-mch"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">MCHC (g/dL)</label>
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            value={formData.mchc}
                                                            onChange={e => handleChange('mchc', e.target.value)}
                                                            step="0.1"
                                                            id="input-mchc"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">BMI</label>
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            value={formData.bmi}
                                                            onChange={e => handleChange('bmi', e.target.value)}
                                                            step="0.1"
                                                            id="input-bmi"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Medical History */}
                                <div className="card" style={{ marginBottom: '24px' }}>
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <Shield size={18} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-violet)' }} />
                                            Medical History
                                        </h3>
                                    </div>
                                    <div className="checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                checked={formData.chronic_disease === 1}
                                                onChange={e => handleChange('chronic_disease', e.target.checked ? 1 : 0)}
                                                id="check-chronic"
                                            />
                                            Chronic Disease
                                        </label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                checked={formData.family_history_anemia === 1}
                                                onChange={e => handleChange('family_history_anemia', e.target.checked ? 1 : 0)}
                                                id="check-family-history"
                                            />
                                            Family History of Anemia
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="alert alert-critical" style={{ marginBottom: '24px' }}>
                                <AlertTriangle size={18} style={{ display: 'inline', marginRight: '8px' }} />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={handleReset} id="btn-reset">
                                <RotateCcw size={16} />
                                Reset
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={loading || !formData.age || !formData.hemoglobin}
                                id="btn-analyze"
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        {mode === 'quick' ? 'Quick Screen' : 'Run Full Analysis'}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.form>
                ) : (
                    <motion.div
                        key="results"
                        className="results-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {/* Result Header */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={handleReset} id="btn-new-screening">
                                <RotateCcw size={16} />
                                New Screening
                            </button>
                        </div>

                        {/* Alerts */}
                        {result.alerts && result.alerts.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                {result.alerts.map((alert, i) => (
                                    <motion.div
                                        key={i}
                                        className={`alert alert-${alert.level}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        {alert.message}
                                        {alert.action && (
                                            <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.8 }}>
                                                Action: {alert.action}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Severity + Risk Score */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                            {/* Severity Display */}
                            <div
                                className="severity-display"
                                style={{ '--result-color': severityColorMap[result.severity_label] || 'var(--primary)' }}
                            >
                                <div className="severity-ring" style={{ '--result-color': severityColorMap[result.severity_label] }}>
                                    <div>
                                        <div className="severity-score" style={{ color: severityColorMap[result.severity_label] }}>
                                            {result.risk_score}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Risk Score</div>
                                    </div>
                                </div>
                                <div className="severity-label" style={{ color: severityColorMap[result.severity_label] }}>
                                    {result.severity_label}
                                </div>
                                <div className="severity-confidence">
                                    <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                    {result.confidence.toFixed(1)}% confidence • Model accuracy: {result.model_accuracy.toFixed(1)}%
                                </div>
                            </div>

                            {/* Probability Breakdown */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Classification Probabilities</h3>
                                </div>
                                <div className="prob-bar-container">
                                    {Object.entries(result.probabilities).map(([label, prob]) => {
                                        const color = severityColorMap[label] || 'var(--text-muted)'
                                        return (
                                            <div key={label} className="prob-bar-item">
                                                <span className="prob-bar-label">{label}</span>
                                                <div className="prob-bar-track">
                                                    <motion.div
                                                        className="prob-bar-fill"
                                                        style={{ background: color }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${prob}%` }}
                                                        transition={{ duration: 1, delay: 0.3 }}
                                                    />
                                                </div>
                                                <span className="prob-bar-value" style={{ color }}>{prob}%</span>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Risk Level Bar */}
                                <div style={{ marginTop: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Overall Risk</span>
                                        <span className={`badge ${badgeClassMap[result.severity_label]}`}>
                                            {result.risk_level}
                                        </span>
                                    </div>
                                    <div className="risk-score-bar">
                                        <motion.div
                                            className="risk-score-fill"
                                            style={{
                                                background: `linear-gradient(90deg, var(--severity-normal), ${result.risk_score > 60 ? 'var(--severity-severe)' :
                                                    result.risk_score > 30 ? 'var(--severity-moderate)' : 'var(--severity-mild)'
                                                    })`,
                                            }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${result.risk_score}%` }}
                                            transition={{ duration: 1.5, delay: 0.5 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Risk Factors */}
                        {result.risk_factors && (
                            <div className="card" style={{ marginBottom: '24px' }}>
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <Activity size={18} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-cyan)' }} />
                                        Risk Factor Analysis
                                    </h3>
                                </div>
                                <table className="risk-factors-table">
                                    <thead>
                                        <tr>
                                            <th>Parameter</th>
                                            <th>Value</th>
                                            <th>Normal Range</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.risk_factors.map((factor, i) => (
                                            <motion.tr
                                                key={i}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.5 + i * 0.1 }}
                                            >
                                                <td style={{ fontWeight: 500 }}>{factor.name}</td>
                                                <td>{factor.value}</td>
                                                <td style={{ color: 'var(--text-muted)' }}>{factor.normal_range}</td>
                                                <td>
                                                    <span className={`status-dot ${factor.status}`}>
                                                        {factor.status === 'normal' ? 'Normal' : factor.status === 'low' ? 'Low' : 'High'}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Future Risk + Recommendations Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                            {/* Future Risk */}
                            {result.future_risk && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <TrendingUp size={18} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-orange)' }} />
                                            Future Risk Forecast
                                        </h3>
                                        <span className={`badge ${result.future_risk.preventable ? 'badge-normal' : 'badge-moderate'}`}>
                                            {result.future_risk.preventable ? 'Preventable' : 'Monitor'}
                                        </span>
                                    </div>
                                    <div className="future-risk-bars">
                                        {[
                                            { label: '3 Months', value: result.future_risk['3_months'] },
                                            { label: '6 Months', value: result.future_risk['6_months'] },
                                            { label: '12 Months', value: result.future_risk['12_months'] },
                                        ].map((item, i) => {
                                            const color = item.value > 60 ? 'var(--severity-severe)' :
                                                item.value > 30 ? 'var(--severity-moderate)' :
                                                    item.value > 15 ? 'var(--severity-mild)' : 'var(--severity-normal)'
                                            return (
                                                <div key={i} className="future-risk-bar">
                                                    <motion.div
                                                        className="future-risk-bar-fill"
                                                        style={{ background: `linear-gradient(180deg, ${color}, ${color}88)`, width: '100%' }}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${Math.max(15, item.value)}%` }}
                                                        transition={{ duration: 1, delay: 0.8 + i * 0.2 }}
                                                    >
                                                        <div className="future-risk-bar-value" style={{ color }}>
                                                            {item.value}%
                                                        </div>
                                                    </motion.div>
                                                    <div className="future-risk-bar-label">{item.label}</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                        Trend: <span style={{ color: result.future_risk.trend === 'increasing' ? 'var(--severity-moderate)' : 'var(--severity-normal)' }}>
                                            {result.future_risk.trend === 'increasing' ? '↗ Increasing' : '→ Stable'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {result.recommendations && result.recommendations.length > 0 && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <CheckCircle size={18} style={{ display: 'inline', marginRight: '8px', color: 'var(--severity-normal)' }} />
                                            Recommendations
                                        </h3>
                                    </div>
                                    <div className="recommendation-list">
                                        {result.recommendations.map((rec, i) => (
                                            <motion.div
                                                key={i}
                                                className="recommendation-item"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.8 + i * 0.15 }}
                                            >
                                                <div className="recommendation-icon">{rec.icon}</div>
                                                <div className="recommendation-content">
                                                    <h4>{rec.title}</h4>
                                                    <p>{rec.text}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Disclaimer */}
                        <div className="card" style={{ borderColor: 'rgba(234, 179, 8, 0.2)' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <AlertTriangle size={20} color="var(--severity-mild)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px', color: 'var(--severity-mild)' }}>
                                        Medical Disclaimer
                                    </h4>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                        HemoScan AI is a screening support tool and is NOT a substitute for professional medical diagnosis.
                                        Results should be interpreted by qualified healthcare professionals. Always consult a doctor for
                                        medical decisions. This system is designed for initial screening and risk assessment only.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ScreeningPage
