"""
HemoScan AI Prediction Engine
Handles model loading, prediction, and risk scoring.
"""

import joblib
import numpy as np
import json
import os
from typing import Dict, Any, List, Tuple

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')

FEATURE_COLUMNS = [
    'age', 'gender', 'hemoglobin', 'rbc_count', 'mcv', 'mch', 'mchc',
    'hematocrit', 'iron_level', 'ferritin', 'diet_quality', 'chronic_disease',
    'pregnancy', 'family_history_anemia', 'fatigue', 'pale_skin',
    'shortness_of_breath', 'dizziness', 'cold_hands_feet', 'bmi',
    # Derived CBC clinical indices
    'mentzer_index', 'hb_rbc_ratio', 'mcv_mch_ratio', 'mchc_mch_diff', 'hct_hb_ratio',
]


def _engineer_features(d: dict) -> dict:
    """Compute derived CBC clinical indices from raw patient values."""
    rbc  = d.get('rbc_count', 0) or 4.5
    mch  = d.get('mch', 0) or 27.0
    hb   = d.get('hemoglobin', 0) or 12.0
    mcv  = d.get('mcv', 0)
    mchc = d.get('mchc', 0)
    hct  = d.get('hematocrit', 0)
    d['mentzer_index'] = round(mcv / rbc, 2)
    d['hb_rbc_ratio']  = round(hb / rbc, 2)
    d['mcv_mch_ratio'] = round(mcv / mch, 2)
    d['mchc_mch_diff'] = round(mchc - mch, 2)
    d['hct_hb_ratio']  = round(hct / hb, 2)
    return d

SEVERITY_LABELS = {0: 'Normal', 1: 'Mild Anemia', 2: 'Moderate Anemia', 3: 'Severe Anemia'}
SEVERITY_COLORS = {0: '#22c55e', 1: '#eab308', 2: '#f97316', 3: '#ef4444'}


class HemoScanPredictor:
    """Main prediction engine for anemia detection and risk scoring."""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.metadata = None
        self._load_model()
    
    def _load_model(self):
        """Load trained model, scaler, and metadata."""
        model_path = os.path.join(MODEL_DIR, 'hemoscan_model.joblib')
        scaler_path = os.path.join(MODEL_DIR, 'scaler.joblib')
        meta_path = os.path.join(MODEL_DIR, 'model_metadata.json')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                "Model not found. Please run train_model.py first."
            )
        
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        
        with open(meta_path, 'r') as f:
            self.metadata = json.load(f)
    
    def predict(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make prediction and generate comprehensive risk analysis.
        
        Args:
            patient_data: Dictionary with patient features
            
        Returns:
            Dictionary with prediction, risk score, and recommendations
        """
        # Prepare features
        patient_data = _engineer_features(dict(patient_data))
        features = np.array([[patient_data.get(col, 0) for col in FEATURE_COLUMNS]])
        features_scaled = self.scaler.transform(features)
        
        # Get prediction and probabilities
        prediction = int(self.model.predict(features_scaled)[0])
        probabilities = self.model.predict_proba(features_scaled)[0]
        
        # Calculate risk score (0-100)
        risk_score = self._calculate_risk_score(patient_data, prediction, probabilities)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(patient_data, prediction, risk_score)
        
        # Generate alerts
        alerts = self._generate_alerts(patient_data, prediction, risk_score)
        
        # Risk factors analysis
        risk_factors = self._analyze_risk_factors(patient_data)
        
        # Future risk probability
        future_risk = self._predict_future_risk(patient_data, prediction, risk_score)
        
        return {
            'severity': prediction,
            'severity_label': SEVERITY_LABELS[prediction],
            'severity_color': SEVERITY_COLORS[prediction],
            'confidence': float(max(probabilities)) * 100,
            'probabilities': {
                SEVERITY_LABELS[i]: round(float(p) * 100, 2)
                for i, p in enumerate(probabilities)
            },
            'risk_score': risk_score,
            'risk_level': self._get_risk_level(risk_score),
            'recommendations': recommendations,
            'alerts': alerts,
            'risk_factors': risk_factors,
            'future_risk': future_risk,
            'model_accuracy': self.metadata.get('accuracy', 0) * 100
        }
    
    def _calculate_risk_score(self, data: Dict, prediction: int, probs: np.ndarray) -> float:
        """Calculate comprehensive risk score (0-100)."""
        score = 0
        
        # Base score from prediction severity (0-40 points)
        score += prediction * 13.3
        
        # Hemoglobin contribution (0-20 points)
        hb = data.get('hemoglobin', 14)
        gender = data.get('gender', 0)
        normal_hb = 13.5 if gender == 1 else 12.0
        if hb < normal_hb:
            hb_deficit = (normal_hb - hb) / normal_hb
            score += min(20, hb_deficit * 40)
        
        # Age risk (0-10 points)
        age = data.get('age', 30)
        if age < 5 or age > 65:
            score += 8
        elif age < 12 or age > 50:
            score += 5
        
        # Symptom burden (0-15 points)
        symptoms = ['fatigue', 'pale_skin', 'shortness_of_breath', 'dizziness', 'cold_hands_feet']
        symptom_count = sum(data.get(s, 0) for s in symptoms)
        score += symptom_count * 3
        
        # Medical history (0-15 points)
        if data.get('chronic_disease', 0):
            score += 5
        if data.get('pregnancy', 0):
            score += 5
        if data.get('family_history_anemia', 0):
            score += 5
        
        # Diet quality penalty
        diet = data.get('diet_quality', 1)
        if diet == 0:
            score += 5
        elif diet == 1:
            score += 2
        
        # Iron and ferritin
        if data.get('iron_level', 80) < 50:
            score += 5
        if data.get('ferritin', 100) < 30:
            score += 5
        
        return min(100, round(score, 1))
    
    def _get_risk_level(self, score: float) -> str:
        """Categorize risk level from score."""
        if score < 20:
            return 'Low'
        elif score < 40:
            return 'Moderate'
        elif score < 60:
            return 'High'
        elif score < 80:
            return 'Very High'
        else:
            return 'Critical'
    
    def _generate_recommendations(self, data: Dict, prediction: int, risk_score: float) -> List[Dict]:
        """Generate personalized recommendations."""
        recs = []
        
        if prediction == 0 and risk_score < 20:
            recs.append({
                'type': 'info',
                'icon': '✅',
                'title': 'Healthy Status',
                'text': 'Your blood parameters are within normal range. Continue maintaining a balanced diet rich in iron and vitamins.'
            })
        else:
            # Diet recommendations
            if data.get('diet_quality', 1) < 2:
                recs.append({
                    'type': 'diet',
                    'icon': '🥗',
                    'title': 'Improve Dietary Iron Intake',
                    'text': 'Include iron-rich foods: spinach, lentils, red meat, fortified cereals, beans, and dark chocolate. Pair with Vitamin C sources for better absorption.'
                })
            
            # Hemoglobin-specific
            hb = data.get('hemoglobin', 14)
            if hb < 10:
                recs.append({
                    'type': 'urgent',
                    'icon': '🏥',
                    'title': 'Seek Immediate Medical Attention',
                    'text': f'Your hemoglobin level ({hb} g/dL) is critically low. Please consult a hematologist immediately for proper treatment.'
                })
            elif hb < 12:
                recs.append({
                    'type': 'medical',
                    'icon': '👨‍⚕️',
                    'title': 'Medical Consultation Recommended',
                    'text': f'Your hemoglobin ({hb} g/dL) is below optimal. Schedule a visit with your healthcare provider for a complete blood panel.'
                })
            
            # Iron supplementation
            if data.get('iron_level', 80) < 60 or data.get('ferritin', 100) < 30:
                recs.append({
                    'type': 'supplement',
                    'icon': '💊',
                    'title': 'Consider Iron Supplementation',
                    'text': 'Your iron stores appear low. Consult your doctor about iron supplements. Take them with Vitamin C on an empty stomach for best absorption.'
                })
            
            # Pregnancy specific
            if data.get('pregnancy', 0):
                recs.append({
                    'type': 'pregnancy',
                    'icon': '🤰',
                    'title': 'Prenatal Anemia Management',
                    'text': 'Anemia during pregnancy requires careful monitoring. Ensure regular prenatal checkups and consider folic acid + iron supplementation as advised by your OB-GYN.'
                })
            
            # Lifestyle
            symptoms = ['fatigue', 'dizziness', 'shortness_of_breath']
            if any(data.get(s, 0) for s in symptoms):
                recs.append({
                    'type': 'lifestyle',
                    'icon': '🏃',
                    'title': 'Manage Symptoms',
                    'text': 'Rest when fatigued, stay hydrated, avoid sudden position changes, and engage in light physical activity. Avoid strenuous exercise until hemoglobin levels improve.'
                })
            
            # Follow-up
            if prediction >= 1:
                recs.append({
                    'type': 'followup',
                    'icon': '📅',
                    'title': 'Schedule Follow-Up Testing',
                    'text': f'Recommended re-testing in {"2 weeks" if prediction >= 3 else "1 month" if prediction >= 2 else "3 months"}. Track hemoglobin trends over time.'
                })
        
        return recs
    
    def _generate_alerts(self, data: Dict, prediction: int, risk_score: float) -> List[Dict]:
        """Generate alerts for critical conditions."""
        alerts = []
        
        if prediction == 3:
            alerts.append({
                'level': 'critical',
                'message': '🚨 CRITICAL: Severe anemia detected. Immediate medical intervention recommended.',
                'action': 'Refer to hematologist immediately'
            })
        
        if data.get('hemoglobin', 14) < 7:
            alerts.append({
                'level': 'emergency',
                'message': '⚠️ EMERGENCY: Hemoglobin critically low. Blood transfusion may be required.',
                'action': 'Emergency department referral'
            })
        
        if risk_score >= 80:
            alerts.append({
                'level': 'high',
                'message': '🔴 HIGH RISK: Multiple risk factors identified. Comprehensive evaluation needed.',
                'action': 'Complete blood count + iron studies recommended'
            })
        
        if data.get('pregnancy', 0) and prediction >= 2:
            alerts.append({
                'level': 'warning',
                'message': '⚠️ Moderate-to-severe anemia during pregnancy. Close monitoring required.',
                'action': 'Refer to high-risk obstetrics'
            })
        
        return alerts
    
    def _analyze_risk_factors(self, data: Dict) -> List[Dict]:
        """Analyze individual risk factors."""
        factors = []
        
        # Hemoglobin
        hb = data.get('hemoglobin', 14)
        gender = data.get('gender', 0)
        normal_range = (13.5, 17.5) if gender == 1 else (12.0, 16.0)
        factors.append({
            'name': 'Hemoglobin',
            'value': f'{hb} g/dL',
            'normal_range': f'{normal_range[0]}-{normal_range[1]} g/dL',
            'status': 'normal' if normal_range[0] <= hb <= normal_range[1] else 'low' if hb < normal_range[0] else 'high',
            'impact': 'high'
        })
        
        # Iron Level
        iron = data.get('iron_level', 80)
        factors.append({
            'name': 'Iron Level',
            'value': f'{iron} μg/dL',
            'normal_range': '60-170 μg/dL',
            'status': 'normal' if 60 <= iron <= 170 else 'low' if iron < 60 else 'high',
            'impact': 'high'
        })
        
        # Ferritin
        ferritin = data.get('ferritin', 100)
        factors.append({
            'name': 'Ferritin',
            'value': f'{ferritin} ng/mL',
            'normal_range': '20-250 ng/mL',
            'status': 'normal' if 20 <= ferritin <= 250 else 'low' if ferritin < 20 else 'high',
            'impact': 'medium'
        })
        
        # RBC
        rbc = data.get('rbc_count', 4.5)
        rbc_range = (4.5, 5.5) if gender == 1 else (4.0, 5.0)
        factors.append({
            'name': 'RBC Count',
            'value': f'{rbc} M/μL',
            'normal_range': f'{rbc_range[0]}-{rbc_range[1]} M/μL',
            'status': 'normal' if rbc_range[0] <= rbc <= rbc_range[1] else 'low' if rbc < rbc_range[0] else 'high',
            'impact': 'medium'
        })
        
        # BMI
        bmi = data.get('bmi', 24)
        factors.append({
            'name': 'BMI',
            'value': f'{bmi}',
            'normal_range': '18.5-24.9',
            'status': 'normal' if 18.5 <= bmi <= 24.9 else 'low' if bmi < 18.5 else 'high',
            'impact': 'low'
        })
        
        return factors
    
    def _predict_future_risk(self, data: Dict, current_prediction: int, risk_score: float) -> Dict:
        """Estimate future anemia risk probability."""
        base_risk = risk_score / 100
        
        # Modifiers
        modifiers = 0
        if data.get('family_history_anemia', 0):
            modifiers += 0.1
        if data.get('chronic_disease', 0):
            modifiers += 0.1
        if data.get('diet_quality', 1) == 0:
            modifiers += 0.1
        if data.get('pregnancy', 0):
            modifiers += 0.05
        
        age = data.get('age', 30)
        if age > 60:
            modifiers += 0.08
        elif age < 5:
            modifiers += 0.08
        
        three_month = min(0.95, base_risk * 0.8 + modifiers * 0.5)
        six_month = min(0.95, base_risk * 0.9 + modifiers * 0.7)
        twelve_month = min(0.95, base_risk + modifiers)
        
        return {
            '3_months': round(three_month * 100, 1),
            '6_months': round(six_month * 100, 1),
            '12_months': round(twelve_month * 100, 1),
            'trend': 'increasing' if current_prediction > 0 else 'stable',
            'preventable': risk_score < 60
        }
    
    def get_model_info(self) -> Dict:
        """Get model information and metadata."""
        return {
            'model_name': self.metadata.get('model_name', 'Unknown'),
            'accuracy': round(self.metadata.get('accuracy', 0) * 100, 2),
            'cv_score': round(self.metadata.get('cv_mean', 0) * 100, 2),
            'features': self.metadata.get('features', []),
            'training_samples': self.metadata.get('training_samples', 0),
            'feature_importance': self.metadata.get('feature_importance', {})
        }
