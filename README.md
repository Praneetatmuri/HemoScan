# 🩸 HemoScan AI – Anemia Detection & Risk Analysis System

> AI-powered early screening, risk prediction, and preventive intervention for anemia detection.

![License](https://img.shields.io/badge/License-MIT-red)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688)

## 🌟 Overview

HemoScan AI is an intelligent anemia detection platform that leverages machine learning to analyze patient data (hemoglobin levels, age, gender, medical history, dietary habits, symptoms) to predict anemia severity and future risk probability. The system provides:

- **Instant Classification**: Normal / Mild / Moderate / Severe Anemia
- **Risk Scoring**: Comprehensive 0-100 risk score
- **Personalized Recommendations**: Diet, lifestyle, and medical referral guidance
- **Future Risk Forecasting**: 3, 6, and 12-month risk projections
- **Clinical Dashboard**: Analytics and model performance metrics

## 🏗️ Architecture

```
HemoScan/
├── backend/                    # Python FastAPI Backend
│   ├── main.py                 # FastAPI server & API endpoints
│   ├── requirements.txt        # Python dependencies
│   ├── data/
│   │   ├── generate_dataset.py # Synthetic dataset generator
│   │   └── anemia_dataset.csv  # Generated training data
│   ├── ml/
│   │   ├── train_model.py      # ML training pipeline
│   │   └── predictor.py        # Prediction engine
│   └── models/
│       ├── hemoscan_model.joblib
│       ├── scaler.joblib
│       └── model_metadata.json
├── frontend/                   # React Frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css           # Design system
│       ├── components/
│       │   └── Sidebar.jsx
│       └── pages/
│           ├── LandingPage.jsx
│           ├── ScreeningPage.jsx
│           ├── DashboardPage.jsx
│           └── AboutPage.jsx
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Generate dataset & train model
python data/generate_dataset.py
python ml/train_model.py

# Start backend server
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Access the App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🧠 Machine Learning

### Model Architecture
- **Random Forest** (200 trees) + **XGBoost** ensemble
- **20 input features**: hemoglobin, RBC count, iron level, ferritin, MCV, MCH, MCHC, hematocrit, age, gender, BMI, diet quality, symptoms, medical history
- **4 severity classes**: Normal, Mild, Moderate, Severe
- **Cross-validated** with 5-fold CV

### Key Features
| Feature | Description |
|---------|-------------|
| Hemoglobin | Primary anemia indicator (g/dL) |
| Iron Level | Serum iron (μg/dL) |
| Ferritin | Iron stores (ng/mL) |
| Hematocrit | Blood composition (%) |
| RBC Count | Red blood cells (M/μL) |
| MCV/MCH/MCHC | Red cell indices |
| Symptoms | Fatigue, pallor, dizziness, etc. |
| Demographics | Age, gender, BMI |
| Medical History | Chronic disease, pregnancy, family history |

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/predict` | POST | Full analysis with all 20 parameters |
| `/api/quick-screen` | POST | Quick screen with minimal parameters |
| `/api/model-info` | GET | Model metadata and accuracy |
| `/api/statistics` | GET | Dashboard statistics |

## 🎯 SDG Alignment

This project aligns with **UN SDG 3: Good Health & Well-being**, enabling:
- Early detection in rural/low-resource settings
- Reduced dependency on expensive lab infrastructure
- Fast triage support for healthcare providers
- Preventive healthcare initiatives

## 👥 Team Plasma

Built by **Team Plasma** (7 members) for the hackathon project.

## ⚠️ Disclaimer

HemoScan AI is a **screening support tool** and is NOT a substitute for professional medical diagnosis. Results should be interpreted by qualified healthcare professionals.

---

© 2026 Team Plasma | HemoScan AI
