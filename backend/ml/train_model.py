"""
Train the HemoScan AI anemia classification model.
Uses XGBoost, LightGBM, and Random Forest stacking ensemble.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
from sklearn.utils.class_weight import compute_sample_weight
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from imblearn.over_sampling import SMOTE
import joblib
import os
import json

# Base feature columns (from dataset)
BASE_FEATURE_COLUMNS = [
    'age', 'gender', 'hemoglobin', 'rbc_count', 'mcv', 'mch', 'mchc',
    'hematocrit', 'iron_level', 'ferritin', 'diet_quality', 'chronic_disease',
    'pregnancy', 'family_history_anemia', 'fatigue', 'pale_skin',
    'shortness_of_breath', 'dizziness', 'cold_hands_feet', 'bmi'
]

# Derived CBC clinical indices appended during engineering
DERIVED_FEATURE_COLUMNS = [
    'mentzer_index',   # MCV / RBC  (<13 thalassemia, >13 iron deficiency)
    'hb_rbc_ratio',    # Hb / RBC  (proportional to MCV)
    'mcv_mch_ratio',   # MCV / MCH  (hypochromia indicator)
    'mchc_mch_diff',   # MCHC - MCH (RBC saturation gap)
    'hct_hb_ratio',    # Hematocrit / Hb  (MCHC approximation)
]

FEATURE_COLUMNS = BASE_FEATURE_COLUMNS + DERIVED_FEATURE_COLUMNS

SEVERITY_LABELS = {0: 'Normal', 1: 'Mild Anemia', 2: 'Moderate Anemia', 3: 'Severe Anemia'}


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add derived CBC clinical indices as extra features."""
    df = df.copy()
    rbc_safe = df['rbc_count'].replace(0, np.nan).fillna(4.5)
    mch_safe = df['mch'].replace(0, np.nan).fillna(27)
    hb_safe  = df['hemoglobin'].replace(0, np.nan).fillna(12)

    df['mentzer_index'] = (df['mcv'] / rbc_safe).round(2)
    df['hb_rbc_ratio']  = (df['hemoglobin'] / rbc_safe).round(2)
    df['mcv_mch_ratio'] = (df['mcv'] / mch_safe).round(2)
    df['mchc_mch_diff'] = (df['mchc'] - df['mch']).round(2)
    df['hct_hb_ratio']  = (df['hematocrit'] / hb_safe).round(2)
    return df


def load_data():
    """Load and prepare the anemia dataset with feature engineering."""
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'anemia_dataset.csv')
    df = pd.read_csv(data_path)
    df = engineer_features(df)
    X = df[FEATURE_COLUMNS]
    y = df['anemia_severity']
    return X, y


def train_model():
    """Train the stacking ensemble and save it."""
    print("=" * 60)
    print("HemoScan AI - Model Training Pipeline")
    print("=" * 60)

    X, y = load_data()
    print(f"\n[DATA] Dataset loaded: {X.shape[0]} samples, {X.shape[1]} features")
    print(f"   Class distribution: {dict(y.value_counts().sort_index())}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # SMOTE to balance minority classes
    print("\n[SMOTE] Applying SMOTE for class balancing...")
    smote = SMOTE(random_state=42, k_neighbors=5)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
    print(f"   After SMOTE: {dict(pd.Series(y_train_res).value_counts().sort_index())}")

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_res)
    X_test_scaled  = scaler.transform(X_test)

    # -- Base learners ---------------------------------------------------------
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=18,
        min_samples_split=4,
        min_samples_leaf=1,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )

    xgb = XGBClassifier(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=2,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        eval_metric='mlogloss',
        use_label_encoder=False,
        n_jobs=-1
    )

    lgbm = LGBMClassifier(
        n_estimators=400,
        max_depth=7,
        learning_rate=0.05,
        num_leaves=63,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_samples=10,
        reg_alpha=0.1,
        reg_lambda=1.0,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
        verbose=-1
    )

    # -- Stacking ensemble -----------------------------------------------------
    stacking = StackingClassifier(
        estimators=[('rf', rf), ('xgb', xgb), ('lgbm', lgbm)],
        final_estimator=LogisticRegression(max_iter=1000, C=1.0, random_state=42),
        passthrough=False,
        cv=5,
        n_jobs=-1
    )

    # -- Train individually to pick best ---------------------------------------
    print("\n[TRAIN] Training models...")

    print("   Training Random Forest...")
    rf.fit(X_train_scaled, y_train_res)
    rf_acc = accuracy_score(y_test, rf.predict(X_test_scaled))
    print(f"   [OK] RF accuracy: {rf_acc:.4f}")

    print("   Training XGBoost...")
    xgb.fit(X_train_scaled, y_train_res)
    xgb_acc = accuracy_score(y_test, xgb.predict(X_test_scaled))
    print(f"   [OK] XGBoost accuracy: {xgb_acc:.4f}")

    print("   Training LightGBM...")
    lgbm.fit(X_train_scaled, y_train_res)
    lgbm_acc = accuracy_score(y_test, lgbm.predict(X_test_scaled))
    print(f"   [OK] LightGBM accuracy: {lgbm_acc:.4f}")

    print("   Training Stacking Ensemble...")
    stacking.fit(X_train_scaled, y_train_res)
    stacking_acc = accuracy_score(y_test, stacking.predict(X_test_scaled))
    print(f"   [OK] Stacking accuracy: {stacking_acc:.4f}")

    # Select best
    models = {
        'Random Forest': (rf, rf_acc),
        'XGBoost':       (xgb, xgb_acc),
        'LightGBM':      (lgbm, lgbm_acc),
        'Stacking':      (stacking, stacking_acc),
    }
    best_name = max(models, key=lambda k: models[k][1])
    best_model, best_acc = models[best_name]

    print(f"\n[BEST] Best Model: {best_name} ({best_acc:.4f})")

    # Evaluate
    y_pred = best_model.predict(X_test_scaled)
    print(f"\n[REPORT] Classification Report:")
    target_names = [SEVERITY_LABELS[i] for i in sorted(y.unique())]
    print(classification_report(y_test, y_pred, target_names=target_names))

    # Cross-validation on best
    cv_scores = cross_val_score(best_model, X_train_scaled, y_train_res, cv=5, scoring='accuracy')
    print(f"[CV] Cross-Validation Scores: {cv_scores.round(4)}")
    print(f"   Mean CV Score: {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

    # Feature importance from RF (or lgbm)
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
    else:
        importances = lgbm.feature_importances_

    importance_df = pd.DataFrame({
        'feature': FEATURE_COLUMNS,
        'importance': importances
    }).sort_values('importance', ascending=False)

    print(f"\n[IMPORTANCE] Feature Importance (Top 10):")
    for _, row in importance_df.head(10).iterrows():
        bar = '#' * int(row['importance'] * 50)
        print(f"   {row['feature']:25s} {row['importance']:.4f} {bar}")

    # Save
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(model_dir, exist_ok=True)

    model_path  = os.path.join(model_dir, 'hemoscan_model.joblib')
    scaler_path = os.path.join(model_dir, 'scaler.joblib')
    meta_path   = os.path.join(model_dir, 'model_metadata.json')

    joblib.dump(best_model, model_path)
    joblib.dump(scaler, scaler_path)

    metadata = {
        'model_name': best_name,
        'accuracy': float(best_acc),
        'cv_mean': float(cv_scores.mean()),
        'cv_std': float(cv_scores.std()),
        'features': FEATURE_COLUMNS,
        'classes': {str(k): v for k, v in SEVERITY_LABELS.items()},
        'feature_importance': {row['feature']: float(row['importance']) for _, row in importance_df.iterrows()},
        'training_samples': int(len(X_train_res)),
        'test_samples': int(len(X_test))
    }

    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[SAVE] Model saved to: {model_path}")
    print(f"[SAVE] Scaler saved to: {scaler_path}")
    print(f"[SAVE] Metadata saved to: {meta_path}")
    print("\n" + "=" * 60)
    print("[DONE] Training complete!")
    print("=" * 60)

    return best_model, scaler


if __name__ == '__main__':
    train_model()
