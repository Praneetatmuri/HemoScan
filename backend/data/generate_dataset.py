"""
Generate a synthetic anemia dataset for training the HemoScan AI model.
This creates realistic patient data with features relevant to anemia detection.
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)

N = 5000  # Number of samples

def generate_dataset():
    """Generate synthetic anemia dataset with realistic distributions."""
    
    data = {
        'age': np.random.randint(1, 90, N),
        'gender': np.random.choice([0, 1], N),  # 0=Female, 1=Male
    }
    
    df = pd.DataFrame(data)
    
    # Hemoglobin (g/dL) - key indicator
    # Normal: Male 13.5-17.5, Female 12-16
    # Generate based on gender with some variance
    hemoglobin = np.where(
        df['gender'] == 1,
        np.random.normal(14.5, 2.5, N),  # Male
        np.random.normal(13.0, 2.8, N)   # Female
    )
    # Ensure some low values for anemia cases
    hemoglobin = np.clip(hemoglobin, 4.0, 18.5)
    df['hemoglobin'] = np.round(hemoglobin, 1)
    
    # Red Blood Cell Count (million cells/mcL)
    df['rbc_count'] = np.round(np.random.normal(4.5, 0.8, N), 2)
    df['rbc_count'] = np.clip(df['rbc_count'], 2.0, 6.5)
    
    # Mean Corpuscular Volume (MCV) - fL
    df['mcv'] = np.round(np.random.normal(85, 12, N), 1)
    df['mcv'] = np.clip(df['mcv'], 50, 120)
    
    # Mean Corpuscular Hemoglobin (MCH) - pg
    df['mch'] = np.round(np.random.normal(29, 4, N), 1)
    df['mch'] = np.clip(df['mch'], 15, 40)
    
    # Mean Corpuscular Hemoglobin Concentration (MCHC) - g/dL
    df['mchc'] = np.round(np.random.normal(33, 2.5, N), 1)
    df['mchc'] = np.clip(df['mchc'], 25, 38)
    
    # Hematocrit (%)
    df['hematocrit'] = np.round(df['hemoglobin'] * 3 + np.random.normal(0, 2, N), 1)
    df['hematocrit'] = np.clip(df['hematocrit'], 15, 55)
    
    # Iron level (mcg/dL)
    df['iron_level'] = np.round(np.random.normal(80, 30, N), 1)
    df['iron_level'] = np.clip(df['iron_level'], 10, 180)
    
    # Ferritin (ng/mL)
    df['ferritin'] = np.round(np.random.normal(100, 60, N), 1)
    df['ferritin'] = np.clip(df['ferritin'], 5, 350)
    
    # Dietary habits (0=Poor, 1=Average, 2=Good)
    df['diet_quality'] = np.random.choice([0, 1, 2], N, p=[0.3, 0.4, 0.3])
    
    # Medical history flags
    df['chronic_disease'] = np.random.choice([0, 1], N, p=[0.75, 0.25])
    df['pregnancy'] = np.where(
        df['gender'] == 0,
        np.random.choice([0, 1], N, p=[0.85, 0.15]),
        0
    )
    df['family_history_anemia'] = np.random.choice([0, 1], N, p=[0.7, 0.3])
    
    # Symptoms
    df['fatigue'] = np.random.choice([0, 1], N, p=[0.5, 0.5])
    df['pale_skin'] = np.random.choice([0, 1], N, p=[0.6, 0.4])
    df['shortness_of_breath'] = np.random.choice([0, 1], N, p=[0.65, 0.35])
    df['dizziness'] = np.random.choice([0, 1], N, p=[0.7, 0.3])
    df['cold_hands_feet'] = np.random.choice([0, 1], N, p=[0.7, 0.3])
    
    # BMI
    df['bmi'] = np.round(np.random.normal(24, 5, N), 1)
    df['bmi'] = np.clip(df['bmi'], 14, 45)
    
    # Classify anemia based on hemoglobin levels (WHO criteria)
    conditions = [
        (df['gender'] == 1) & (df['hemoglobin'] >= 13.0),  # Normal Male
        (df['gender'] == 0) & (df['hemoglobin'] >= 12.0),  # Normal Female
        (df['hemoglobin'] >= 11.0),  # Mild
        (df['hemoglobin'] >= 8.0),   # Moderate
        (df['hemoglobin'] < 8.0),    # Severe
    ]
    choices = [0, 0, 1, 2, 3]  # 0=Normal, 1=Mild, 2=Moderate, 3=Severe
    
    df['anemia_severity'] = np.select(conditions, choices, default=0)
    
    # Add some noise - some mild cases based on other factors
    mask_borderline = (df['anemia_severity'] == 0) & (df['iron_level'] < 50) & (df['fatigue'] == 1)
    df.loc[mask_borderline, 'anemia_severity'] = 1
    
    # Adjust symptoms to correlate with severity
    severe_mask = df['anemia_severity'] >= 2
    df.loc[severe_mask, 'fatigue'] = np.random.choice([0, 1], severe_mask.sum(), p=[0.1, 0.9])
    df.loc[severe_mask, 'pale_skin'] = np.random.choice([0, 1], severe_mask.sum(), p=[0.15, 0.85])
    df.loc[severe_mask, 'dizziness'] = np.random.choice([0, 1], severe_mask.sum(), p=[0.2, 0.8])
    
    # Save
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, 'anemia_dataset.csv')
    df.to_csv(output_path, index=False)
    
    print(f"Dataset generated: {output_path}")
    print(f"Shape: {df.shape}")
    print(f"\nSeverity Distribution:")
    severity_labels = {0: 'Normal', 1: 'Mild', 2: 'Moderate', 3: 'Severe'}
    for val, label in severity_labels.items():
        count = (df['anemia_severity'] == val).sum()
        print(f"  {label}: {count} ({count/N*100:.1f}%)")
    
    print(f"\nFeature Statistics:")
    print(df.describe().round(2))
    
    return df

if __name__ == '__main__':
    generate_dataset()
