# 🩸 HemoScan AI – Anemia Detection & Risk Analysis System

> AI-powered early screening, risk prediction, and preventive intervention for anemia detection.

![License](https://img.shields.io/badge/License-MIT-red)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688)
![XGBoost](https://img.shields.io/badge/XGBoost-Ensemble-ff6600)
![Vite](https://img.shields.io/badge/Vite-6-646cff)

---

## 🌟 Overview

HemoScan AI is an intelligent anemia detection platform that leverages machine learning to analyze patient data — hemoglobin levels, age, gender, medical history, dietary habits, and symptoms — to predict anemia severity and future risk probability. It is designed for accessible healthcare in rural and low-resource settings.

### What it does

- **Instant Classification** — Normal / Mild / Moderate / Severe Anemia
- **Risk Scoring** — Comprehensive 0–100 risk score with categorized risk levels (Low → Critical)
- **Personalized Recommendations** — Diet, lifestyle, and medical referral guidance
- **Future Risk Forecasting** — 3, 6, and 12-month risk projections
- **Localized Diet Plans** — Multi-language (English, Hindi, Telugu, Tamil) food recommendations with meal plans and absorption tips
- **Clinical Dashboard** — Model performance metrics, feature importance charts, and analytics
- **PDF Export** — Download screening results as a formatted report

---

## 🏗️ Project Structure

```
HemoScan/
├── backend/                        # Python FastAPI Backend
│   ├── main.py                     # FastAPI server & API endpoints
│   ├── diet_engine.py              # Localized dietary recommendation engine
│   ├── requirements.txt            # Python dependencies
│   ├── data/
│   │   ├── generate_dataset.py     # Synthetic dataset generator
│   │   ├── anemia_dataset.csv      # Generated training data
│   │   ├── inspect_datasets.py     # Dataset inspection & comparison utility
│   │   ├── preprocess_kaggle.py    # Kaggle dataset preprocessing pipeline
│   │   └── kaggle_raw/             # Real-world CBC datasets (Kaggle)
│   │       ├── anemia.csv
│   │       ├── CBC data_for_meandeley_csv.csv
│   │       └── diagnosed_cbc_data_v4.csv
│   ├── ml/
│   │   ├── train_model.py          # ML training pipeline (stacking ensemble + SMOTE)
│   │   └── predictor.py            # Prediction, feature engineering & risk scoring
│   └── models/
│       ├── hemoscan_model.joblib   # Trained stacking ensemble model
│       ├── scaler.joblib           # Feature scaler
│       └── model_metadata.json     # Training metrics & metadata
├── frontend/                       # React + Vite Frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                # App entry point
│       ├── App.jsx                 # Router & layout
│       ├── index.css               # Design system & theming
│       ├── components/
│       │   └── Sidebar.jsx         # Navigation sidebar
│       ├── i18n/
│       │   ├── LanguageContext.jsx  # Language provider (React Context)
│       │   └── translations.js     # UI strings (EN, HI, TE, TA)
│       └── pages/
│           ├── LandingPage.jsx     # Hero, features, how-it-works
│           ├── ScreeningPage.jsx   # Quick & full screening forms + results
│           ├── DashboardPage.jsx   # Model stats & analytics charts
│           ├── DietPage.jsx        # Dietary recommendations & meal plans
│           └── AboutPage.jsx       # Project & team info
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Generate synthetic dataset & train the ML model
python data/generate_dataset.py
python ml/train_model.py

# (Optional) Inspect or preprocess Kaggle real-world datasets
python data/inspect_datasets.py
python data/preprocess_kaggle.py

# Start the API server
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Access the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## 🧠 Machine Learning

### Model Architecture

- **Stacking Ensemble** — Random Forest + XGBoost + LightGBM base learners with Logistic Regression meta-learner
- **25 input features** — 20 base clinical features + 5 derived CBC indices
- **4 severity classes**: Normal, Mild Anemia, Moderate Anemia, Severe Anemia
- **SMOTE** oversampling to correct class imbalance in training data
- **5-fold cross-validation** for robust evaluation
- **Feature scaling** via StandardScaler for normalized input

### Input Features

| Category | Features |
|----------|----------|
| Blood Parameters | Hemoglobin (g/dL), RBC Count (M/μL), MCV (fL), MCH (pg), MCHC (g/dL), Hematocrit (%) |
| Iron Markers | Iron Level (μg/dL), Ferritin (ng/mL) |
| Symptoms | Fatigue, Pale Skin, Shortness of Breath, Dizziness, Cold Hands & Feet |
| Demographics | Age, Gender, BMI |
| Medical History | Chronic Disease, Pregnancy, Family History of Anemia |
| Lifestyle | Diet Quality (Poor / Average / Good) |
| **Derived CBC Indices** | Mentzer Index (MCV/RBC), Hb/RBC Ratio, MCV/MCH Ratio, MCHC–MCH Diff, Hct/Hb Ratio |

> The 5 derived CBC indices are computed automatically from raw inputs during both training and inference — no extra data entry required.

### Risk Scoring Engine

The system computes a composite **0–100 risk score** based on:

- Prediction severity (0–40 pts)
- Hemoglobin deficit relative to gender-adjusted normals (0–20 pts)
- Age risk factors (0–10 pts)
- Symptom burden (0–15 pts)
- Medical history & lifestyle (0–15 pts)

Risk levels: **Low** (<20) · **Moderate** (20–39) · **High** (40–59) · **Very High** (60–79) · **Critical** (80+)

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API status & version info |
| `/api/health` | GET | Health check (model loaded status) |
| `/api/predict` | POST | Full analysis with all 20 parameters |
| `/api/quick-screen` | POST | Quick screening with minimal inputs (age, gender, hemoglobin, symptoms) |
| `/api/model-info` | GET | Model metadata, accuracy, and feature importance |
| `/api/statistics` | GET | Dashboard statistics for analytics charts |
| `/api/diet-recommendations` | POST | Localized diet plan based on severity & deficiencies |

---

## 🌐 Multi-Language Support

The entire UI and dietary recommendations are available in:

| Language | Code |
|----------|------|
| English | `en` |
| Hindi (हिन्दी) | `hi` |
| Telugu (తెలుగు) | `te` |
| Tamil (தமிழ்) | `ta` |

Language switching is available globally via the sidebar and applies to all pages including diet recommendations, food names, and preparation instructions.

---

## 🥗 Diet Recommendation Engine

A dedicated dietary engine provides personalized nutrition guidance:

- **Deficiency-aware** — detects low hemoglobin, iron, and ferritin from blood values
- **Region-specific foods** — includes Indian staples like Ragi, Moringa, Jaggery, Drumstick leaves
- **Categorized suggestions** — Iron-rich foods, Vitamin C boosters, Folate sources, B12 sources
- **Meal plans** — Breakfast, lunch, snack, and dinner suggestions
- **Absorption tips** — Enhancers (Vitamin C, cooking in iron vessels) and inhibitors (tea/coffee near meals)
- **Pregnancy-specific** — Special nutritional guidance for pregnant women

---

## 🖥️ Pages & Features

| Page | Description |
|------|-------------|
| **Landing** | Hero section, feature highlights, how-it-works steps, call-to-action |
| **Screening** | Quick mode (6 fields) or Full mode (20 fields), animated results with severity gauge, risk breakdown, alerts, and PDF export |
| **Dashboard** | Model accuracy stats, feature importance bar chart, severity distribution pie chart, radar chart, performance metrics |
| **Diet** | Personalized food recommendations, meal planner, absorption tips — all multilingual |
| **About** | Project info, team details, tech stack, and SDG alignment |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite 6, React Router 6, Framer Motion, Recharts, Lucide Icons, jsPDF |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic |
| **ML** | Scikit-learn, XGBoost, LightGBM, imbalanced-learn (SMOTE), Pandas, NumPy, Joblib |
| **Data** | Synthetic generator + real-world Kaggle CBC datasets |
| **i18n** | React Context API with custom translation system |

---

## 🎯 SDG Alignment

This project aligns with **UN Sustainable Development Goal 3: Good Health & Well-being**:

- Early anemia detection in rural and low-resource settings
- Reduced dependency on expensive lab infrastructure
- Fast triage support for healthcare providers
- Preventive healthcare through personalized dietary guidance
- Multilingual access to bridge language barriers in healthcare

---

## 👥 Team Plasma

Built by **Team Plasma** for the hackathon project.

---

## ⚠️ Disclaimer

HemoScan AI is a **screening support tool** and is **NOT** a substitute for professional medical diagnosis. All results should be reviewed and interpreted by qualified healthcare professionals. Do not make treatment decisions based solely on this tool's output.

---

© 2026 Team Plasma | HemoScan AI
