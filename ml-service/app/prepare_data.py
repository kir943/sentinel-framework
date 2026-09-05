import pandas as pd
import numpy as np

def load_and_engineer(path='data/PS_20174392719_1491204439457_log.csv'):
    df = pd.read_csv(path)

    # Fraud only occurs in TRANSFER / CASH_OUT - restrict to these (matches P2P/cash-out UPI-style flows)
    df = df[df['type'].isin(['TRANSFER', 'CASH_OUT'])].copy()
    df = df.reset_index(drop=True)

    # --- Behavioral / structural features (non-leaky) ---
    df['hour_of_day'] = df['step'] % 24
    df['amount_log'] = np.log1p(df['amount'])

    # Sender activity frequency (how many transactions this origin account has in the dataset)
    orig_counts = df['nameOrig'].value_counts()
    df['sender_txn_count'] = df['nameOrig'].map(orig_counts)

    # Is this destination new / rarely seen? (recipient novelty - key UPI-relevant signal)
    dest_counts = df['nameDest'].value_counts()
    df['dest_txn_count'] = df['nameDest'].map(dest_counts)
    df['is_new_recipient'] = (df['dest_txn_count'] <= 1).astype(int)

    # Amount relative to sender's own typical amount (behavioral baseline)
    sender_avg_amount = df.groupby('nameOrig')['amount'].transform('mean')
    df['amount_vs_sender_avg'] = df['amount'] / (sender_avg_amount + 1)

    # type as binary (only two types remain)
    df['type_cash_out'] = (df['type'] == 'CASH_OUT').astype(int)

    # --- Leakage-prone raw balance features (kept separate, flagged) ---
    df['errorBalanceOrig'] = df['oldbalanceOrg'] - df['amount'] - df['newbalanceOrig']
    df['errorBalanceDest'] = df['oldbalanceDest'] + df['amount'] - df['newbalanceDest']
    df['orig_drained_to_zero'] = (df['newbalanceOrig'] == 0).astype(int)

    return df

NON_LEAKY_FEATURES = [
    'amount_log', 'hour_of_day', 'sender_txn_count', 'dest_txn_count',
    'is_new_recipient', 'amount_vs_sender_avg', 'type_cash_out'
]

LEAKY_FEATURES = NON_LEAKY_FEATURES + [
    'errorBalanceOrig', 'errorBalanceDest', 'orig_drained_to_zero',
    'oldbalanceOrg', 'newbalanceOrig', 'oldbalanceDest', 'newbalanceDest'
]

if __name__ == '__main__':
    df = load_and_engineer()
    print('Shape after filtering to TRANSFER/CASH_OUT:', df.shape)
    print('Fraud rate:', df['isFraud'].mean())
    print(df[NON_LEAKY_FEATURES + ['isFraud']].describe())
