from pathlib import Path
import shap
import joblib
import pandas as pd
import numpy as np
from prepare_data import NON_LEAKY_FEATURES

MODEL_PATH = Path(__file__).resolve().parent.parent / 'models' / 'model_nonleaky.pkl'
model = joblib.load(MODEL_PATH)
explainer = shap.TreeExplainer(model)

FEATURE_LABELS = {
    'amount_log': 'Transaction amount',
    'hour_of_day': 'Unusual time of day',
    'sender_txn_count': "Sender's transaction history",
    'dest_txn_count': "Recipient's transaction history",
    'is_new_recipient': 'First-time recipient',
    'amount_vs_sender_avg': "Amount vs sender's typical amount",
    'type_cash_out': 'Cash-out transaction type',
}

def get_reasons(row_dict, top_n=3):
    """Given a transaction's feature dict, return top N human-readable reasons + risk score."""
    X = pd.DataFrame([row_dict])[NON_LEAKY_FEATURES]
    risk_score = float(model.predict_proba(X)[0, 1])
    shap_values = explainer.shap_values(X)[0]

    contributions = list(zip(NON_LEAKY_FEATURES, shap_values))
    contributions.sort(key=lambda x: abs(x[1]), reverse=True)

    reasons = []
    for feat, val in contributions[:top_n]:
        if val > 0:
            reasons.append(f"{FEATURE_LABELS.get(feat, feat)} increased risk")
        else:
            reasons.append(f"{FEATURE_LABELS.get(feat, feat)} looked normal")

    return {
        'risk_score': round(risk_score * 100, 1),
        'reasons': reasons
    }

if __name__ == '__main__':
    # quick sanity test on a couple of rows
    from prepare_data import load_and_engineer
    df = load_and_engineer('../data/PS_20174392719_1491204439457_log.csv')
    fraud_example = df[df['isFraud']==1].iloc[0][NON_LEAKY_FEATURES].to_dict()
    normal_example = df[df['isFraud']==0].iloc[0][NON_LEAKY_FEATURES].to_dict()

    print("FRAUD EXAMPLE:", get_reasons(fraud_example))
    print("NORMAL EXAMPLE:", get_reasons(normal_example))
