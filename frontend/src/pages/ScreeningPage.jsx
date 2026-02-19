import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Stethoscope, Zap, Send, RotateCcw, AlertTriangle, CheckCircle,
    ChevronDown, ChevronUp, TrendingUp, Shield, Droplets, Activity,
    Download, UtensilsCrossed
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import { useLanguage } from '../i18n/LanguageContext'

const API_BASE = '/api'

function ScreeningPage() {
    const [searchParams] = useSearchParams()
    const isQuickMode = searchParams.get('mode') === 'quick'
    const { t } = useLanguage()
    const navigate = useNavigate()

    const [mode, setMode] = useState(isQuickMode ? 'quick' : 'full')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [showAdvanced, setShowAdvanced] = useState(false)

    const [formData, setFormData] = useState({
        age: '', gender: 0, hemoglobin: '', rbc_count: 4.5, mcv: 85,
        mch: 29, mchc: 33, hematocrit: 40, iron_level: 80, ferritin: 100,
        diet_quality: 1, chronic_disease: 0, pregnancy: 0,
        family_history_anemia: 0, fatigue: 0, pale_skin: 0,
        shortness_of_breath: 0, dizziness: 0, cold_hands_feet: 0, bmi: 24,
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
                let errorMsg = `Server error (${res.status})`
                try {
                    const errData = await res.json()
                    if (typeof errData.detail === 'string') {
                        errorMsg = errData.detail
                    } else if (Array.isArray(errData.detail)) {
                        errorMsg = errData.detail.map(e => {
                            const field = e.loc ? e.loc[e.loc.length - 1] : 'field'
                            return `${field}: ${e.msg}`
                        }).join('; ')
                    }
                } catch (_) {
                    // non-JSON error body — keep status-code message
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

    // === PDF Report Generation ===
    const generatePDF = () => {
        if (!result) return

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        let y = 20

        // Header
        doc.setFillColor(220, 38, 38)
        doc.rect(0, 0, pageWidth, 35, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('HemoScan AI', 14, 18)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('Anemia Detection & Risk Analysis Report', 14, 26)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32)

        y = 45

        // Patient Info
        doc.setTextColor(50, 50, 50)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Patient Information', 14, y)
        y += 8
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Age: ${formData.age} years`, 14, y)
        doc.text(`Gender: ${formData.gender === 0 ? 'Female' : 'Male'}`, 80, y)
        y += 6
        doc.text(`Hemoglobin: ${formData.hemoglobin} g/dL`, 14, y)
        doc.text(`BMI: ${formData.bmi}`, 80, y)
        y += 6
        if (mode === 'full') {
            doc.text(`RBC Count: ${formData.rbc_count} M/uL`, 14, y)
            doc.text(`Iron Level: ${formData.iron_level} ug/dL`, 80, y)
            y += 6
            doc.text(`Ferritin: ${formData.ferritin} ng/mL`, 14, y)
            doc.text(`Hematocrit: ${formData.hematocrit}%`, 80, y)
            y += 6
            doc.text(`MCV: ${formData.mcv} fL`, 14, y)
            doc.text(`MCH: ${formData.mch} pg`, 80, y)
            doc.text(`MCHC: ${formData.mchc} g/dL`, 146, y)
            y += 6
        }

        // Divider
        y += 4
        doc.setDrawColor(220, 38, 38)
        doc.setLineWidth(0.5)
        doc.line(14, y, pageWidth - 14, y)
        y += 10

        // Classification Result
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Classification Result', 14, y)
        y += 8

        // Severity with color
        const severityColors = {
            'Normal': [34, 197, 94],
            'Mild Anemia': [234, 179, 8],
            'Moderate Anemia': [249, 115, 22],
            'Severe Anemia': [239, 68, 68],
        }
        const sColor = severityColors[result.severity_label] || [100, 100, 100]
        doc.setFontSize(16)
        doc.setTextColor(sColor[0], sColor[1], sColor[2])
        doc.setFont('helvetica', 'bold')
        doc.text(`${result.severity_label}`, 14, y)
        y += 8

        doc.setFontSize(10)
        doc.setTextColor(50, 50, 50)
        doc.setFont('helvetica', 'normal')
        doc.text(`Risk Score: ${result.risk_score}/100`, 14, y)
        doc.text(`Confidence: ${result.confidence?.toFixed(1)}%`, 80, y)
        doc.text(`Model Accuracy: ${result.model_accuracy?.toFixed(1)}%`, 146, y)
        y += 8
        doc.text(`Risk Level: ${result.risk_level}`, 14, y)
        y += 10

        // Probabilities
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Classification Probabilities', 14, y)
        y += 7
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        if (result.probabilities) {
            Object.entries(result.probabilities).forEach(([label, prob]) => {
                const c = severityColors[label] || [100, 100, 100]
                doc.setFillColor(c[0], c[1], c[2])
                doc.rect(14, y - 3, (prob / 100) * 100, 5, 'F')
                doc.setTextColor(50, 50, 50)
                doc.text(`${label}: ${prob}%`, 120, y)
                y += 8
            })
        }
        y += 4

        // Risk Factors
        if (result.risk_factors && result.risk_factors.length > 0) {
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(50, 50, 50)
            doc.text('Risk Factor Analysis', 14, y)
            y += 7

            // Table header
            doc.setFillColor(240, 240, 240)
            doc.rect(14, y - 4, pageWidth - 28, 7, 'F')
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.text('Parameter', 16, y)
            doc.text('Value', 70, y)
            doc.text('Normal Range', 105, y)
            doc.text('Status', 160, y)
            y += 7

            doc.setFont('helvetica', 'normal')
            result.risk_factors.forEach(factor => {
                if (y > 270) {
                    doc.addPage()
                    y = 20
                }
                doc.text(factor.name || '', 16, y)
                doc.text(String(factor.value || ''), 70, y)
                doc.text(factor.normal_range || '', 105, y)
                const statusColor = factor.status === 'normal' ? [34, 197, 94]
                    : factor.status === 'low' ? [239, 68, 68] : [249, 115, 22]
                doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
                doc.text(factor.status || '', 160, y)
                doc.setTextColor(50, 50, 50)
                y += 6
            })
            y += 6
        }

        // Future Risk
        if (result.future_risk) {
            if (y > 240) { doc.addPage(); y = 20 }
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('Future Risk Forecast', 14, y)
            y += 7
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text(`3 Months: ${result.future_risk['3_months']}%`, 14, y)
            doc.text(`6 Months: ${result.future_risk['6_months']}%`, 70, y)
            doc.text(`12 Months: ${result.future_risk['12_months']}%`, 126, y)
            y += 6
            doc.text(`Trend: ${result.future_risk.trend}`, 14, y)
            doc.text(`Preventable: ${result.future_risk.preventable ? 'Yes' : 'No'}`, 70, y)
            y += 10
        }

        // Recommendations
        if (result.recommendations && result.recommendations.length > 0) {
            if (y > 230) { doc.addPage(); y = 20 }
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('Recommendations', 14, y)
            y += 7
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            result.recommendations.forEach((rec, i) => {
                if (y > 270) { doc.addPage(); y = 20 }
                doc.setFont('helvetica', 'bold')
                doc.text(`${i + 1}. ${rec.title}`, 14, y)
                y += 5
                doc.setFont('helvetica', 'normal')
                const lines = doc.splitTextToSize(rec.text, pageWidth - 32)
                doc.text(lines, 20, y)
                y += lines.length * 4.5 + 3
            })
            y += 4
        }

        // Alerts
        if (result.alerts && result.alerts.length > 0) {
            if (y > 250) { doc.addPage(); y = 20 }
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(239, 68, 68)
            doc.text('ALERTS', 14, y)
            y += 7
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            result.alerts.forEach(alert => {
                if (y > 270) { doc.addPage(); y = 20 }
                doc.setTextColor(239, 68, 68)
                doc.text(`! ${alert.message}`, 14, y)
                y += 5
                if (alert.action) {
                    doc.setTextColor(100, 100, 100)
                    doc.text(`  Action: ${alert.action}`, 14, y)
                    y += 5
                }
            })
        }

        // Footer
        const totalPages = doc.internal.getNumberOfPages()
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p)
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text('HemoScan AI - Screening support tool. NOT a substitute for professional medical diagnosis.', 14, 288)
            doc.text(`Page ${p} of ${totalPages}`, pageWidth - 30, 288)
        }

        // Save
        const filename = `HemoScan_Report_${formData.age}y_${formData.gender === 0 ? 'F' : 'M'}_${new Date().toISOString().slice(0, 10)}.pdf`
        doc.save(filename)
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
                    {t('screeningTitle')}
                </h1>
                <p className="page-subtitle">{t('screeningSubtitle')}</p>
            </div>

            {/* Mode Tabs */}
            <div className="tabs" id="screening-mode-tabs">
                <button
                    className={`tab ${mode === 'quick' ? 'active' : ''}`}
                    onClick={() => { setMode('quick'); setResult(null); }}
                    id="tab-quick"
                >
                    <Zap size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    {t('quickScreenTab')}
                </button>
                <button
                    className={`tab ${mode === 'full' ? 'active' : ''}`}
                    onClick={() => { setMode('full'); setResult(null); }}
                    id="tab-full"
                >
                    <Activity size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    {t('fullAnalysisTab')}
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
                        {/* Basic Info */}
                        <div className="card" style={{ marginBottom: '24px' }}>
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title">{t('patientInfo')}</h3>
                                    <p className="card-subtitle">
                                        {mode === 'quick' ? t('quickScreenDesc') : t('fullAnalysisDesc')}
                                    </p>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">
                                        {t('age')} <span className="form-label-required">*</span>
                                    </label>
                                    <input
                                        type="number" className="form-input"
                                        value={formData.age}
                                        onChange={e => handleChange('age', e.target.value)}
                                        placeholder="e.g. 25" min="1" max="120" required id="input-age"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        {t('gender')} <span className="form-label-required">*</span>
                                    </label>
                                    <div className="toggle-group">
                                        <button type="button" className={`toggle-btn ${formData.gender === 0 ? 'active' : ''}`}
                                            onClick={() => handleChange('gender', 0)} id="btn-female">{t('female')}</button>
                                        <button type="button" className={`toggle-btn ${formData.gender === 1 ? 'active' : ''}`}
                                            onClick={() => handleChange('gender', 1)} id="btn-male">{t('male')}</button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        {t('hemoglobin')} <span className="form-label-required">*</span>
                                    </label>
                                    <input
                                        type="number" className="form-input"
                                        value={formData.hemoglobin}
                                        onChange={e => handleChange('hemoglobin', e.target.value)}
                                        placeholder="e.g. 12.5" step="0.1" min="1" max="25" required id="input-hemoglobin"
                                    />
                                    <span className="form-hint">{t('hemoglobinHint')}</span>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('dietQuality')}</label>
                                    <select className="form-select" value={formData.diet_quality}
                                        onChange={e => handleChange('diet_quality', parseInt(e.target.value))} id="select-diet">
                                        <option value={0}>{t('dietPoor')}</option>
                                        <option value={1}>{t('dietAverage')}</option>
                                        <option value={2}>{t('dietGood')}</option>
                                    </select>
                                </div>

                                {formData.gender === 0 && (
                                    <div className="form-group">
                                        <label className="form-label">{t('pregnancy')}</label>
                                        <div className="toggle-group">
                                            <button type="button" className={`toggle-btn ${formData.pregnancy === 0 ? 'active' : ''}`}
                                                onClick={() => handleChange('pregnancy', 0)}>{t('no')}</button>
                                            <button type="button" className={`toggle-btn ${formData.pregnancy === 1 ? 'active' : ''}`}
                                                onClick={() => handleChange('pregnancy', 1)}>{t('yes')}</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Symptoms */}
                        <div className="card" style={{ marginBottom: '24px' }}>
                            <div className="card-header">
                                <h3 className="card-title">{t('symptoms')}</h3>
                            </div>
                            <div className="checkbox-group">
                                {[
                                    { key: 'fatigue', label: t('fatigue') },
                                    { key: 'pale_skin', label: t('paleSkin') },
                                    { key: 'dizziness', label: t('dizziness') },
                                    ...(mode === 'full' ? [
                                        { key: 'shortness_of_breath', label: t('shortnessOfBreath') },
                                        { key: 'cold_hands_feet', label: t('coldHandsFeet') },
                                    ] : [])
                                ].map(symptom => (
                                    <label key={symptom.key} className="checkbox-label">
                                        <input
                                            type="checkbox" className="checkbox-input"
                                            checked={formData[symptom.key] === 1}
                                            onChange={e => handleChange(symptom.key, e.target.checked ? 1 : 0)}
                                            id={`check-${symptom.key}`}
                                        />
                                        {symptom.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Full Mode: Lab values */}
                        {mode === 'full' && (
                            <>
                                <div className="card" style={{ marginBottom: '24px' }}>
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <Droplets size={18} style={{ display: 'inline', marginRight: '8px', color: 'var(--primary)' }} />
                                            {t('bloodPanelValues')}
                                        </h3>
                                        <button type="button" className="btn btn-ghost btn-sm"
                                            onClick={() => setShowAdvanced(!showAdvanced)} id="btn-toggle-advanced">
                                            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            {showAdvanced ? t('less') : t('more')}
                                        </button>
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">{t('rbcCount')}</label>
                                            <input type="number" className="form-input" value={formData.rbc_count}
                                                onChange={e => handleChange('rbc_count', e.target.value)} step="0.01" id="input-rbc" />
                                            <span className="form-hint">{t('rbcHint')}</span>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('ironLevel')}</label>
                                            <input type="number" className="form-input" value={formData.iron_level}
                                                onChange={e => handleChange('iron_level', e.target.value)} step="0.1" id="input-iron" />
                                            <span className="form-hint">{t('ironHint')}</span>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('ferritin')}</label>
                                            <input type="number" className="form-input" value={formData.ferritin}
                                                onChange={e => handleChange('ferritin', e.target.value)} step="0.1" id="input-ferritin" />
                                            <span className="form-hint">{t('ferritinHint')}</span>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('hematocrit')}</label>
                                            <input type="number" className="form-input" value={formData.hematocrit}
                                                onChange={e => handleChange('hematocrit', e.target.value)} step="0.1" id="input-hematocrit" />
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {showAdvanced && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: '20px' }}>
                                                <div className="section-divider">
                                                    <div className="section-divider-line"></div>
                                                    <span className="section-divider-text">{t('advancedParameters')}</span>
                                                    <div className="section-divider-line"></div>
                                                </div>
                                                <div className="form-grid">
                                                    <div className="form-group">
                                                        <label className="form-label">{t('mcv')}</label>
                                                        <input type="number" className="form-input" value={formData.mcv}
                                                            onChange={e => handleChange('mcv', e.target.value)} step="0.1" id="input-mcv" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">{t('mch')}</label>
                                                        <input type="number" className="form-input" value={formData.mch}
                                                            onChange={e => handleChange('mch', e.target.value)} step="0.1" id="input-mch" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">{t('mchc')}</label>
                                                        <input type="number" className="form-input" value={formData.mchc}
                                                            onChange={e => handleChange('mchc', e.target.value)} step="0.1" id="input-mchc" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">{t('bmi')}</label>
                                                        <input type="number" className="form-input" value={formData.bmi}
                                                            onChange={e => handleChange('bmi', e.target.value)} step="0.1" id="input-bmi" />
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
                                            {t('medicalHistory')}
                                        </h3>
                                    </div>
                                    <div className="checkbox-group">
                                        <label className="checkbox-label">
                                            <input type="checkbox" className="checkbox-input"
                                                checked={formData.chronic_disease === 1}
                                                onChange={e => handleChange('chronic_disease', e.target.checked ? 1 : 0)} id="check-chronic" />
                                            {t('chronicDisease')}
                                        </label>
                                        <label className="checkbox-label">
                                            <input type="checkbox" className="checkbox-input"
                                                checked={formData.family_history_anemia === 1}
                                                onChange={e => handleChange('family_history_anemia', e.target.checked ? 1 : 0)} id="check-family-history" />
                                            {t('familyHistory')}
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Error */}
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
                                {t('reset')}
                            </button>
                            <button type="submit" className="btn btn-primary btn-lg"
                                disabled={loading || !formData.age || !formData.hemoglobin} id="btn-analyze">
                                {loading ? (
                                    <>
                                        <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                                        {t('analyzing')}
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        {mode === 'quick' ? t('quickScreenTab') : t('runFullAnalysis')}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.form>
                ) : (
                    <motion.div
                        key="results" className="results-container"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    >
                        {/* Result Action Buttons */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={handleReset} id="btn-new-screening">
                                <RotateCcw size={16} />
                                {t('newScreening')}
                            </button>
                            <button className="btn btn-primary" onClick={generatePDF} id="btn-download-pdf">
                                <Download size={16} />
                                {t('downloadReport')}
                            </button>
                        </div>

                        {/* Alerts */}
                        {result.alerts && result.alerts.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                {result.alerts.map((alert, i) => (
                                    <motion.div key={i} className={`alert alert-${alert.level}`}
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
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

                        {/* Severity + Probabilities */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                            <div className="severity-display"
                                style={{ '--result-color': severityColorMap[result.severity_label] || 'var(--primary)' }}>
                                <div className="severity-ring" style={{ '--result-color': severityColorMap[result.severity_label] }}>
                                    <div>
                                        <div className="severity-score" style={{ color: severityColorMap[result.severity_label] }}>
                                            {result.risk_score}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('riskScore')}</div>
                                    </div>
                                </div>
                                <div className="severity-label" style={{ color: severityColorMap[result.severity_label] }}>
                                    {result.severity_label}
                                </div>
                                <div className="severity-confidence">
                                    <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                    {result.confidence.toFixed(1)}% {t('confidence')} • {t('modelAccuracyLabel')}: {result.model_accuracy.toFixed(1)}%
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">{t('classificationProbabilities')}</h3>
                                </div>
                                <div className="prob-bar-container">
                                    {Object.entries(result.probabilities).map(([label, prob]) => {
                                        const color = severityColorMap[label] || 'var(--text-muted)'
                                        return (
                                            <div key={label} className="prob-bar-item">
                                                <span className="prob-bar-label">{label}</span>
                                                <div className="prob-bar-track">
                                                    <motion.div className="prob-bar-fill" style={{ background: color }}
                                                        initial={{ width: 0 }} animate={{ width: `${prob}%` }}
                                                        transition={{ duration: 1, delay: 0.3 }} />
                                                </div>
                                                <span className="prob-bar-value" style={{ color }}>{prob}%</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div style={{ marginTop: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('overallRisk')}</span>
                                        <span className={`badge ${badgeClassMap[result.severity_label]}`}>{result.risk_level}</span>
                                    </div>
                                    <div className="risk-score-bar">
                                        <motion.div className="risk-score-fill" style={{
                                            background: `linear-gradient(90deg, var(--severity-normal), ${result.risk_score > 60 ? 'var(--severity-severe)' :
                                                result.risk_score > 30 ? 'var(--severity-moderate)' : 'var(--severity-mild)'})`
                                        }} initial={{ width: 0 }} animate={{ width: `${result.risk_score}%` }}
                                            transition={{ duration: 1.5, delay: 0.5 }} />
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
                                        {t('riskFactorAnalysis')}
                                    </h3>
                                </div>
                                <table className="risk-factors-table">
                                    <thead>
                                        <tr>
                                            <th>{t('parameter')}</th>
                                            <th>{t('value')}</th>
                                            <th>{t('normalRange')}</th>
                                            <th>{t('status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.risk_factors.map((factor, i) => (
                                            <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}>
                                                <td style={{ fontWeight: 500 }}>{factor.name}</td>
                                                <td>{factor.value}</td>
                                                <td style={{ color: 'var(--text-muted)' }}>{factor.normal_range}</td>
                                                <td>
                                                    <span className={`status-dot ${factor.status}`}>
                                                        {factor.status === 'normal' ? t('normal') : factor.status === 'low' ? t('low') : t('high')}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Future Risk + Recommendations */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                            {result.future_risk && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <TrendingUp size={18} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-orange)' }} />
                                            {t('futureRiskForecast')}
                                        </h3>
                                        <span className={`badge ${result.future_risk.preventable ? 'badge-normal' : 'badge-moderate'}`}>
                                            {result.future_risk.preventable ? t('preventable') : t('monitor')}
                                        </span>
                                    </div>
                                    <div className="future-risk-bars">
                                        {[
                                            { label: t('months3'), value: result.future_risk['3_months'] },
                                            { label: t('months6'), value: result.future_risk['6_months'] },
                                            { label: t('months12'), value: result.future_risk['12_months'] },
                                        ].map((item, i) => {
                                            const color = item.value > 60 ? 'var(--severity-severe)' :
                                                item.value > 30 ? 'var(--severity-moderate)' :
                                                    item.value > 15 ? 'var(--severity-mild)' : 'var(--severity-normal)'
                                            return (
                                                <div key={i} className="future-risk-bar">
                                                    <motion.div className="future-risk-bar-fill"
                                                        style={{ background: `linear-gradient(180deg, ${color}, ${color}88)`, width: '100%' }}
                                                        initial={{ height: 0 }} animate={{ height: `${Math.max(15, item.value)}%` }}
                                                        transition={{ duration: 1, delay: 0.8 + i * 0.2 }}>
                                                        <div className="future-risk-bar-value" style={{ color }}>{item.value}%</div>
                                                    </motion.div>
                                                    <div className="future-risk-bar-label">{item.label}</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                        {t('trend')}: <span style={{ color: result.future_risk.trend === 'increasing' ? 'var(--severity-moderate)' : 'var(--severity-normal)' }}>
                                            {result.future_risk.trend === 'increasing' ? t('increasing') : t('stable')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {result.recommendations && result.recommendations.length > 0 && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <CheckCircle size={18} style={{ display: 'inline', marginRight: '8px', color: 'var(--severity-normal)' }} />
                                            {t('recommendations')}
                                        </h3>
                                    </div>
                                    <div className="recommendation-list">
                                        {result.recommendations.map((rec, i) => (
                                            <motion.div key={i} className="recommendation-item"
                                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.8 + i * 0.15 }}>
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

                        {/* Diet Recommendations CTA */}
                        <motion.div
                            className="card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(6, 182, 212, 0.08))',
                                borderColor: 'rgba(34, 197, 94, 0.25)',
                                textAlign: 'center', padding: '32px 24px', marginBottom: '24px',
                            }}
                        >
                            <UtensilsCrossed size={32} style={{ color: 'var(--severity-normal)', marginBottom: '12px' }} />
                            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px' }}>
                                {t('dietRecommendations') || 'Diet Recommendations'}
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', maxWidth: '400px', margin: '0 auto 16px' }}>
                                {t('viewDietDesc') || 'Get personalized, region-specific food suggestions based on your screening results'}
                            </p>
                            <button
                                onClick={() => navigate('/diet', { state: { result, formData } })}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    padding: '12px 28px', borderRadius: '10px', border: 'none',
                                    background: 'linear-gradient(135deg, #22c55e, #06b6d4)',
                                    color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                                    fontFamily: 'var(--font-body)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
                                }}
                                onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.4)' }}
                                onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(34, 197, 94, 0.3)' }}
                            >
                                <UtensilsCrossed size={18} />
                                {t('viewDietPlan') || 'View Diet Plan →'}
                            </button>
                        </motion.div>

                        {/* Disclaimer */}
                        <div className="card" style={{ borderColor: 'rgba(234, 179, 8, 0.2)' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <AlertTriangle size={20} color="var(--severity-mild)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px', color: 'var(--severity-mild)' }}>
                                        {t('medicalDisclaimer')}
                                    </h4>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                        {t('disclaimerText')}
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
