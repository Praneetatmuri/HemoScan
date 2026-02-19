"""
Train the HemoScan AI anemia classification model.
Uses XGBoost and Random Forest ensemble for robust predictions.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from xgboost import XGBClassifier
import joblib
import os
import json

# Feature columns used for prediction
FEATURE_COLUMNS = [
    'age', 'gender', 'hemoglobin', 'rbc_count', 'mcv', 'mch', 'mchc',
    'hematocrit', 'iron_level', 'ferritin', 'diet_quality', 'chronic_disease',
    'pregnancy', 'family_history_anemia', 'fatigue', 'pale_skin',
    'shortness_of_breath', 'dizziness', 'cold_hands_feet', 'bmi'
]

SEVERITY_LABELS = {0: 'Normal', 1: 'Mild Anemia', 2: 'Moderate Anemia', 3: 'Severe Anemia'}


def load_data():
    """Load and prepare the anemia dataset."""
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'anemia_dataset.csv')
    df = pd.read_csv(data_path)
    
    X = df[FEATURE_COLUMNS]
    y = df['anemia_severity']
    
    return X, y


def train_model():
    """Train the ensemble model and save it."""
    print("=" * 60)
    print("HemoScan AI - Model Training Pipeline")
    print("=" * 60)
    
    # Load data
    X, y = load_data()
    print(f"\n📊 Dataset loaded: {X.shape[0]} samples, {X.shape[1]} features")
    print(f"   Class distribution: {dict(y.value_counts().sort_index())}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Define models
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    xgb = XGBClassifier(
        n_estimators=200,
        max_depth=8,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric='mlogloss',
        use_label_encoder=False
    )
    
    # Ensemble
    ensemble = VotingClassifier(
        estimators=[('rf', rf), ('xgb', xgb)],
        voting='soft'
    )
    
    # Train
    print("\n🔄 Training models...")
    
    print("   Training Random Forest...")
    rf.fit(X_train_scaled, y_train)
    rf_acc = accuracy_score(y_test, rf.predict(X_test_scaled))
    print(f"   ✅ Random Forest accuracy: {rf_acc:.4f}")
    
    print("   Training XGBoost...")
    xgb.fit(X_train_scaled, y_train)
    xgb_acc = accuracy_score(y_test, xgb.predict(X_test_scaled))
    print(f"   ✅ XGBoost accuracy: {xgb_acc:.4f}")
    
    print("   Training Ensemble...")
    ensemble.fit(X_train_scaled, y_train)
    ensemble_acc = accuracy_score(y_test, ensemble.predict(X_test_scaled))
    print(f"   ✅ Ensemble accuracy: {ensemble_acc:.4f}")
    
    # Select best model
    models = {'Random Forest': (rf, rf_acc), 'XGBoost': (xgb, xgb_acc), 'Ensemble': (ensemble, ensemble_acc)}
    best_name = max(models, key=lambda k: models[k][1])
    best_model, best_acc = models[best_name]
    
    print(f"\n🏆 Best Model: {best_name} ({best_acc:.4f})")
    
    # Evaluate
    y_pred = best_model.predict(X_test_scaled)
    
    print(f"\n📋 Classification Report:")
    target_names = [SEVERITY_LABELS[i] for i in sorted(y.unique())]
    report = classification_report(y_test, y_pred, target_names=target_names)
    print(report)
    
    # Cross-validation
    cv_scores = cross_val_score(best_model, X_train_scaled, y_train, cv=5, scoring='accuracy')
    print(f"🔄 Cross-Validation Scores: {cv_scores.round(4)}")
    print(f"   Mean CV Score: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    
    # Feature importance (from Random Forest)
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
    else:
        importances = rf.feature_importances_
    
    importance_df = pd.DataFrame({
        'feature': FEATURE_COLUMNS,
        'importance': importances
    }).sort_values('importance', ascending=False)
    
    print(f"\n📊 Feature Importance (Top 10):")
    for _, row in importance_df.head(10).iterrows():
        bar = '█' * int(row['importance'] * 50)
        print(f"   {row['feature']:25s} {row['importance']:.4f} {bar}")
    
    # Save model and scaler
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'hemoscan_model.joblib')
    scaler_path = os.path.join(model_dir, 'scaler.joblib')
    meta_path = os.path.join(model_dir, 'model_metadata.json')
    
    joblib.dump(best_model, model_path)
    joblib.dump(scaler, scaler_path)
    
    # Save metadata
    metadata = {
        'model_name': best_name,
        'accuracy': float(best_acc),
        'cv_mean': float(cv_scores.mean()),
        'cv_std': float(cv_scores.std()),
        'features': FEATURE_COLUMNS,
        'classes': {str(k): v for k, v in SEVERITY_LABELS.items()},
        'feature_importance': {row['feature']: float(row['importance']) for _, row in importance_df.iterrows()},
        'training_samples': int(len(X_train)),
        'test_samples': int(len(X_test))
    }
    
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n💾 Model saved to: {model_path}")
    print(f"💾 Scaler saved to: {scaler_path}")
    print(f"💾 Metadata saved to: {meta_path}")
    print("\n" + "=" * 60)
    print("✅ Training complete!")
    print("=" * 60)
    
    return best_model, scaler


if __name__ == '__main__':
    train_model()
