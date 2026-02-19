"""
HemoScan AI - FastAPI Backend Server
Main API for anemia detection and risk analysis.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import uvicorn
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml.predictor import HemoScanPredictor

# Initialize FastAPI app
app = FastAPI(
    title="HemoScan AI",
    description="AI-powered Anemia Detection & Risk Analysis System",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize predictor
predictor = None

@app.on_event("startup")
async def startup():
    global predictor
    try:
        predictor = HemoScanPredictor()
        print("✅ HemoScan AI Model loaded successfully!")
    except FileNotFoundError as e:
        print(f"⚠️ {e}")
        print("Please run: python ml/train_model.py first")


class PatientData(BaseModel):
    """Patient input data schema."""
    age: int = Field(..., ge=1, le=120, description="Patient age in years")
    gender: int = Field(..., ge=0, le=1, description="0=Female, 1=Male")
    hemoglobin: float = Field(..., ge=1, le=25, description="Hemoglobin level (g/dL)")
    rbc_count: float = Field(4.5, ge=1, le=8, description="Red Blood Cell count (M/μL)")
    mcv: float = Field(85, ge=40, le=130, description="Mean Corpuscular Volume (fL)")
    mch: float = Field(29, ge=10, le=50, description="Mean Corpuscular Hemoglobin (pg)")
    mchc: float = Field(33, ge=20, le=45, description="Mean Corpuscular Hemoglobin Concentration (g/dL)")
    hematocrit: float = Field(40, ge=10, le=60, description="Hematocrit (%)")
    iron_level: float = Field(80, ge=5, le=200, description="Iron level (μg/dL)")
    ferritin: float = Field(100, ge=1, le=500, description="Ferritin level (ng/mL)")
    diet_quality: int = Field(1, ge=0, le=2, description="0=Poor, 1=Average, 2=Good")
    chronic_disease: int = Field(0, ge=0, le=1, description="Has chronic disease")
    pregnancy: int = Field(0, ge=0, le=1, description="Is pregnant")
    family_history_anemia: int = Field(0, ge=0, le=1, description="Family history of anemia")
    fatigue: int = Field(0, ge=0, le=1, description="Experiencing fatigue")
    pale_skin: int = Field(0, ge=0, le=1, description="Has pale skin")
    shortness_of_breath: int = Field(0, ge=0, le=1, description="Shortness of breath")
    dizziness: int = Field(0, ge=0, le=1, description="Experiencing dizziness")
    cold_hands_feet: int = Field(0, ge=0, le=1, description="Cold hands and feet")
    bmi: float = Field(24, ge=10, le=50, description="Body Mass Index")


class QuickScreenData(BaseModel):
    """Simplified screening data for quick check."""
    age: int = Field(..., ge=1, le=120)
    gender: int = Field(..., ge=0, le=1)
    hemoglobin: float = Field(..., ge=1, le=25)
    fatigue: int = Field(0, ge=0, le=1)
    pale_skin: int = Field(0, ge=0, le=1)
    dizziness: int = Field(0, ge=0, le=1)
    diet_quality: int = Field(1, ge=0, le=2)
    pregnancy: int = Field(0, ge=0, le=1)


@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "name": "HemoScan AI",
        "version": "1.0.0",
        "status": "active",
        "description": "AI-powered Anemia Detection & Risk Analysis System"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": predictor is not None
    }


@app.post("/api/predict")
async def predict(patient: PatientData):
    """
    Full anemia prediction with comprehensive risk analysis.
    Returns severity classification, risk score, recommendations, and alerts.
    """
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please train the model first.")
    
    try:
        result = predictor.predict(patient.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/quick-screen")
async def quick_screen(data: QuickScreenData):
    """
    Quick screening endpoint with minimal required data.
    Fills in default values for missing fields.
    """
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please train the model first.")
    
    try:
        # Build full patient data with defaults
        patient_data = {
            'age': data.age,
            'gender': data.gender,
            'hemoglobin': data.hemoglobin,
            'rbc_count': 4.5,
            'mcv': 85,
            'mch': 29,
            'mchc': 33,
            'hematocrit': data.hemoglobin * 3,
            'iron_level': 80,
            'ferritin': 100,
            'diet_quality': data.diet_quality,
            'chronic_disease': 0,
            'pregnancy': data.pregnancy,
            'family_history_anemia': 0,
            'fatigue': data.fatigue,
            'pale_skin': data.pale_skin,
            'shortness_of_breath': 0,
            'dizziness': data.dizziness,
            'cold_hands_feet': 0,
            'bmi': 24
        }
        
        result = predictor.predict(patient_data)
        result['screening_mode'] = 'quick'
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/model-info")
async def model_info():
    """Get information about the loaded model."""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    
    return predictor.get_model_info()


@app.get("/api/statistics")
async def get_statistics():
    """Get dashboard statistics."""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    
    model_data = predictor.get_model_info()
    return {
        'model_accuracy': model_data['accuracy'],
        'total_features': len(model_data['features']),
        'training_samples': model_data['training_samples'],
        'severity_classes': 4,
        'feature_importance': model_data['feature_importance']
    }


if __name__ == '__main__':
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
