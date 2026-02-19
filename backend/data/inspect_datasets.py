import pandas as pd, os, glob

folder = os.path.join(os.path.dirname(__file__), 'kaggle_raw')
files = glob.glob(os.path.join(folder, '*.csv'))

for f in files:
    print('\n' + '='*70)
    print('FILE:', os.path.basename(f))
    try:
        df = pd.read_csv(f)
        print('Shape:', df.shape)
        print('Columns:', list(df.columns))
        print(df.head(3).to_string())
        print('\nNull counts:')
        print(df.isnull().sum())
    except Exception as e:
        print('Error:', e)
