# RukJaAI Risk Engine (ml-service)

The behavioral risk layer of Sentinel — one of three independent signals (behavior, UI integrity via WebSeal, session integrity) combined by the trust engine into an ALLOW / VERIFY / BLOCK decision.

## Dataset

We use **PaySim** — a mobile-money transaction simulator built from real, anonymized transaction logs and a published fraud-injection methodology (Lopez-Rojas et al.). This is not real UPI transaction data — no public dataset of real UPI fraud exists, for the same regulatory/privacy reasons true of any financial fraud data. PaySim is a credible, citable research dataset rather than an arbitrary Kaggle CSV, and its `TRANSFER`/`CASH_OUT` transaction types map conceptually to P2P/cash-out UPI-style transfers.

- 6,362,620 transactions total; fraud only occurs in `TRANSFER` and `CASH_OUT` types (2,770,409 rows after filtering to these)
- Fraud rate: 0.30% — realistic, heavy class imbalance

## A leakage issue we found and controlled for

An initial pass training directly on this dataset's raw balance columns (`oldbalanceOrg`, `newbalanceOrig`, `oldbalanceDest`, `newbalanceDest`) produces a model with **99.98% F1 and near-perfect precision/recall.** This is not a good result — it's a known artifact of the simulation: fraudulent transactions in PaySim almost always leave the origin account's ledger perfectly self-consistent (`oldbalance - amount = newbalance`, off by ~10.7k on average), while legitimate transactions show far more ledger inconsistency (~201k average discrepancy) due to concurrent-transaction aggregation in the simulator. A model given these columns learns to detect the simulator's own bookkeeping fingerprint, not fraud behavior.

We trained and evaluated **two versions** to make this explicit:

| Model | Precision | Recall | F1 | ROC-AUC | Notes |
|---|---|---|---|---|---|
| **Leaky** (raw balance + error features) | 1.00 | 0.9995 | 0.9998 | 0.99999 | 94.6% of decision weight sits in 2 engineered leakage features (`errorBalanceOrig`, `orig_drained_to_zero`) — not real fraud signal |
| **Non-leaky** (behavioral features only) | 0.051 | 0.825 | 0.096 | 0.899 | Used in production — genuine behavioral fraud detection |

**The non-leaky model is what's deployed.** It uses only behaviorally meaningful features and makes no use of ledger-consistency shortcuts.

## Features (non-leaky model)

- `amount_log` — log-transformed transaction amount
- `hour_of_day` — derived from simulation time step
- `sender_txn_count` / `dest_txn_count` — account activity history
- `is_new_recipient` — first-time recipient flag (key UPI-relevant signal)
- `amount_vs_sender_avg` — amount relative to sender's own typical transaction size
- `type_cash_out` — transaction type

## Evaluation methodology

- **Time-aware split** (not random) using the simulation's `step` field as a real time index — 70% train / 15% validation / 15% held-out test, split chronologically to avoid look-ahead leakage
- Model: XGBoost with `scale_pos_weight` tuned for class imbalance
- Full metrics and feature importances: `models/eval_results.json`

## Honest result interpretation

0.90 ROC-AUC with 82.5% recall on a 0.3%-imbalanced, purely-behavioral fraud task is a genuinely reasonable result — not a weak one — but it is deliberately imperfect. Precision is low (many false positives) when tuned to prioritize catching fraud. **This is the argument for the layered architecture, not a weakness of the demo**: no single signal — including this one — is treated as sufficient on its own. WebSeal (UI integrity) and session integrity checks catch attack patterns this behavioral model isn't designed to see (e.g., a transaction that looks completely normal behaviorally, but where the payment interface itself was tampered with mid-flow).

## API

`POST /predict` — accepts transaction features plus `webseal_integrity_ok` and `session_integrity_ok` flags from the other two layers, returns:
```json
{
  "risk_score": 0-100,
  "reasons": ["human-readable SHAP-derived reasons"],
  "decision": "ALLOW | VERIFY | BLOCK",
  "decision_reason": "..."
}
```

Decision logic (server-side, final authority — never trusts a client-reported flag as sufficient on its own):
- `webseal_integrity_ok = false` → BLOCK, regardless of risk score
- `session_integrity_ok = false` → VERIFY, regardless of risk score
- `risk_score >= 70` → BLOCK
- `risk_score >= 30` → VERIFY
- else → ALLOW

## Running locally

```bash
pip install -r requirements.txt
cd app
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Limitations (stated upfront, not discovered by a judge)

- Trained on a simulated dataset, not real UPI transaction logs — no such public dataset exists
- Precision is low by design at current thresholds; a production system would tune thresholds against real business cost of false positives vs. missed fraud
- Session integrity signal (browser focus/devtools checks) is session-level, not full device/OS attestation
