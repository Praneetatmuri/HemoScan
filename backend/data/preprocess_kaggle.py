"""
Preprocess Kaggle anemia datasets into the HemoScan training schema.

Sources used:
  1. diagnosed_cbc_data_v4.csv  (1281 rows, labeled CBC data – primary)
  2. anemia.csv                 (1421 rows, binary anemia label – supplement)

Output: backend/data/anemia_dataset.csv  (replaces synthetic data)
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)
OUT_PATH = os.path.join(os.path.dirname(__file__), 'anemia_dataset.csv')
KAGGLE_DIR = os.path.join(os.path.dirname(__file__), 'kaggle_raw')

# ─────────────────────────────────────────────────────────────────────────────
# 1. Load primary dataset: diagnosed_cbc_data_v4.csv
# ─────────────────────────────────────────────────────────────────────────────
df1 = pd.read_csv(os.path.join(KAGGLE_DIR, 'diagnosed_cbc_data_v4.csv'))

SEVERITY_MAP_DIAG = {
    'Healthy': 0,
    'Normocytic normochromic anemia': 1,
    'Normocytic hypochromic anemia': 2,
    'Iron deficiency anemia': 2,
    'Other microcytic anemia': 3,
    'Macrocytic anemia': 3,
    'Thrombocytopenia': 3,
    'Leukemia': 3,
    'Leukemia with thrombocytopenia': 3,
}
df1['anemia_severity'] = df1['Diagnosis'].map(SEVERITY_MAP_DIAG)
df1 = df1.dropna(subset=['anemia_severity'])
df1['anemia_severity'] = df1['anemia_severity'].astype(int)

# Map available CBC columns to our schema
df1 = df1.rename(columns={
    'HGB': 'hemoglobin',
    'RBC': 'rbc_count',
    'MCV': 'mcv',
    'MCH': 'mch',
    'MCHC': 'mchc',
    'HCT': 'hematocrit',
})

# ─────────────────────────────────────────────────────────────────────────────
# 2. Load supplementary dataset: anemia.csv (binary label)
# ─────────────────────────────────────────────────────────────────────────────
df2 = pd.read_csv(os.path.join(KAGGLE_DIR, 'anemia.csv'))

# Result: 0=no anemia → Normal; 1=anemia → Mild by default
df2['anemia_severity'] = df2['Result'].apply(lambda x: 0 if x == 0 else 1)
df2 = df2.rename(columns={
    'Hemoglobin': 'hemoglobin',
    'MCH': 'mch',
    'MCHC': 'mchc',
    'MCV': 'mcv',
    'Gender': 'gender',
})

# ─────────────────────────────────────────────────────────────────────────────
# 3. Combine: pick available columns and align to full schema
# ─────────────────────────────────────────────────────────────────────────────
FULL_COLS = [
    'age', 'gender', 'hemoglobin', 'rbc_count', 'mcv', 'mch', 'mchc',
    'hematocrit', 'iron_level', 'ferritin', 'diet_quality', 'chronic_disease',
    'pregnancy', 'family_history_anemia', 'fatigue', 'pale_skin',
    'shortness_of_breath', 'dizziness', 'cold_hands_feet', 'bmi',
    'anemia_severity'
]

def augment_missing_features(df, severity_col='anemia_severity'):
    """
    Impute missing features using severity-conditioned realistic distributions
    based on medical literature:
      - Severity 0 (Normal) : healthy baseline
      - Severity 1 (Mild)   : slightly reduced iron/ferritin
      - Severity 2 (Moderate): notably low iron/ferritin, more symptoms
      - Severity 3 (Severe) : critically low values, high symptom burden
    """
    N = len(df)
    sev = df[severity_col].values

    if 'age' not in df.columns:
        df['age'] = np.clip(np.random.normal(35, 18, N).astype(int), 1, 90)

    if 'gender' not in df.columns:
        df['gender'] = np.random.choice([0, 1], N)

    if 'rbc_count' not in df.columns:
        base = np.where(df['gender']==1, 5.0, 4.4)
        rbc_adj = np.where(sev==0, 0, np.where(sev==1, -0.3, np.where(sev==2, -0.8, -1.3)))
        df['rbc_count'] = np.round(np.clip(base + rbc_adj + np.random.normal(0, 0.3, N), 2.0, 6.5), 2)

    if 'hematocrit' not in df.columns:
        df['hematocrit'] = np.round(np.clip(df['hemoglobin'] * 3 + np.random.normal(0, 1.5, N), 15, 55), 1)

    # Iron level: severity-conditioned
    iron_base  = np.where(sev==0, 90, np.where(sev==1, 65, np.where(sev==2, 40, 20)))
    iron_std   = np.where(sev==0, 20, np.where(sev==1, 18, np.where(sev==2, 15, 12)))
    df['iron_level'] = np.round(np.clip(iron_base + np.random.normal(0, iron_std, N), 5, 200), 1)

    # Ferritin: severity-conditioned
    ferr_base  = np.where(sev==0, 110, np.where(sev==1, 60, np.where(sev==2, 20, 8)))
    ferr_std   = np.where(sev==0, 40,  np.where(sev==1, 25, np.where(sev==2, 10, 5)))
    df['ferritin'] = np.round(np.clip(ferr_base + np.random.normal(0, ferr_std, N), 1, 500), 1)

    # Diet quality: worse for higher severity
    diet_probs = {0:[0.15,0.45,0.40], 1:[0.30,0.45,0.25], 2:[0.45,0.40,0.15], 3:[0.60,0.30,0.10]}
    diet = np.zeros(N, dtype=int)
    for s_val, probs in diet_probs.items():
        mask = sev == s_val
        if mask.sum() > 0:
            diet[mask] = np.random.choice([0,1,2], mask.sum(), p=probs)
    df['diet_quality'] = diet

    df['chronic_disease']        = np.random.choice([0,1], N, p=[0.75,0.25])
    df['family_history_anemia']  = np.random.choice([0,1], N, p=[0.70,0.30])

    # Pregnancy: only female (gender==0)
    df['pregnancy'] = np.where(
        df['gender']==0,
        np.random.choice([0,1], N, p=[0.85,0.15]),
        0
    )

    # Symptoms: severity-conditioned probabilities
    symptom_probs = {
        'fatigue':             {0:0.15, 1:0.45, 2:0.75, 3:0.92},
        'pale_skin':           {0:0.10, 1:0.35, 2:0.65, 3:0.88},
        'shortness_of_breath': {0:0.08, 1:0.25, 2:0.55, 3:0.80},
        'dizziness':           {0:0.10, 1:0.30, 2:0.60, 3:0.82},
        'cold_hands_feet':     {0:0.12, 1:0.28, 2:0.50, 3:0.70},
    }
    for symptom, probs in symptom_probs.items():
        p_arr = np.array([probs[s] for s in sev])
        df[symptom] = (np.random.rand(N) < p_arr).astype(int)

    df['bmi'] = np.round(np.clip(np.random.normal(24, 5, N), 14, 45), 1)

    return df


# ── Process df1 ──────────────────────────────────────────────────────────────
df1 = augment_missing_features(df1)
df1 = df1[[c for c in FULL_COLS if c in df1.columns]]
for col in FULL_COLS:
    if col not in df1.columns:
        df1[col] = 0
df1 = df1[FULL_COLS]

# ── Process df2 ──────────────────────────────────────────────────────────────
# df2 already has gender, hemoglobin, mch, mchc, mcv, anemia_severity
df2 = augment_missing_features(df2)
df2 = df2[[c for c in FULL_COLS if c in df2.columns]]
for col in FULL_COLS:
    if col not in df2.columns:
        df2[col] = 0
df2 = df2[FULL_COLS]

# ── Combine ───────────────────────────────────────────────────────────────────
combined = pd.concat([df1, df2], ignore_index=True)

# Ensure correct types
combined['age']      = combined['age'].astype(int)
combined['gender']   = combined['gender'].astype(int)
combined['anemia_severity'] = combined['anemia_severity'].astype(int)

# Clip all numeric to valid ranges
combined['hemoglobin']  = combined['hemoglobin'].clip(4.0, 20.0)
combined['rbc_count']   = combined['rbc_count'].clip(2.0, 6.5)
combined['mcv']         = combined['mcv'].clip(50, 130)
combined['mch']         = combined['mch'].clip(10, 50)
combined['mchc']        = combined['mchc'].clip(20, 45)
combined['hematocrit']  = combined['hematocrit'].clip(10, 60)
combined['iron_level']  = combined['iron_level'].clip(5, 200)
combined['ferritin']    = combined['ferritin'].clip(1, 500)
combined['bmi']         = combined['bmi'].clip(14, 45)

# Drop rows with any null
combined = combined.dropna()

# Shuffle
combined = combined.sample(frac=1, random_state=42).reset_index(drop=True)

# ── Save ──────────────────────────────────────────────────────────────────────
combined.to_csv(OUT_PATH, index=False)

print(f'\nDataset saved to: {OUT_PATH}')
print(f'Shape: {combined.shape}')
print(f'\nSeverity distribution:')
labels = {0:'Normal', 1:'Mild', 2:'Moderate', 3:'Severe'}
for v, lbl in labels.items():
    cnt = (combined['anemia_severity'] == v).sum()
    print(f'  {lbl}: {cnt} ({cnt/len(combined)*100:.1f}%)')
print('\nFeature sample:')
print(combined.head(5).to_string())
