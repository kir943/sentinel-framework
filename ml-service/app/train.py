import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score, average_precision_score
import joblib
import json
from prepare_data import load_and_engineer, NON_LEAKY_FEATURES, LEAKY_FEATURES

df = load_and_engineer('../data/PS_20174392719_1491204439457_log.csv')

# Time-aware split using 'step' (real time index in the simulation) - avoid random-split leakage across time
df = df.sort_values('step').reset_index(drop=True)
n = len(df)
train_end = int(n * 0.70)
val_end = int(n * 0.85)

train_df = df.iloc[:train_end]
val_df = df.iloc[train_end:val_end]
test_df = df.iloc[val_end:]  # held-out, never touched until final eval

print(f"Train: {len(train_df)} | Val: {len(val_df)} | Held-out Test: {len(test_df)}")
print(f"Fraud rate - train: {train_df['isFraud'].mean():.5f}, val: {val_df['isFraud'].mean():.5f}, test: {test_df['isFraud'].mean():.5f}")

def train_and_eval(features, label, model_path):
    X_train, y_train = train_df[features], train_df['isFraud']
    X_val, y_val = val_df[features], val_df['isFraud']
    X_test, y_test = test_df[features], test_df['isFraud']

    scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

    model = XGBClassifier(
        n_estimators=200, max_depth=6, learning_rate=0.1,
        scale_pos_weight=scale_pos_weight, eval_metric='aucpr',
        random_state=42
    )
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    results = {
        'label': label,
        'features': features,
        'precision': precision_score(y_test, y_pred),
        'recall': recall_score(y_test, y_pred),
        'f1': f1_score(y_test, y_pred),
        'roc_auc': roc_auc_score(y_test, y_prob),
        'avg_precision': average_precision_score(y_test, y_prob),
        'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
        'feature_importance': dict(zip(features, model.feature_importances_.tolist()))
    }
    joblib.dump(model, model_path)
    return results, model

print("\n=== Training NON-LEAKY model (behavioral features only) ===")
results_nonleaky, model_nonleaky = train_and_eval(NON_LEAKY_FEATURES, 'non_leaky_behavioral', '../models/model_nonleaky.pkl')
print(json.dumps({k:v for k,v in results_nonleaky.items() if k!='feature_importance'}, indent=2))
print("Feature importance:", results_nonleaky['feature_importance'])

print("\n=== Training LEAKY model (includes raw balance / errorBalance features) ===")
results_leaky, model_leaky = train_and_eval(LEAKY_FEATURES, 'leaky_with_balance_features', '../models/model_leaky.pkl')
print(json.dumps({k:v for k,v in results_leaky.items() if k!='feature_importance'}, indent=2))
print("Feature importance:", results_leaky['feature_importance'])

with open('../models/eval_results.json', 'w') as f:
    json.dump({'non_leaky': results_nonleaky, 'leaky': results_leaky}, f, indent=2)
