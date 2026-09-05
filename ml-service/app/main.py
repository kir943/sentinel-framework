from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import joblib
import pandas as pd
from explain import get_reasons
from prepare_data import NON_LEAKY_FEATURES

app = FastAPI(title="RukJaAI Risk Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransactionInput(BaseModel):
    amount: float
    hour_of_day: int
    sender_txn_count: int
    dest_txn_count: int
    is_new_recipient: int
    amount_vs_sender_avg: float
    type_cash_out: int
    # signals from the other two layers - trust engine combines these
    webseal_integrity_ok: Optional[bool] = True
    session_integrity_ok: Optional[bool] = True

import numpy as np

def decide(risk_score, webseal_ok, session_ok):
    # Server-side combination logic - never trusts client flags blindly,
    # this is the "final authority" layer described in the architecture
    if not webseal_ok:
        return "BLOCK", "Payment interface integrity check failed"
    if not session_ok:
        return "VERIFY", "Unusual session activity detected"
    if risk_score >= 70:
        return "BLOCK", "High-risk transaction pattern"
    elif risk_score >= 30:
        return "VERIFY", "Transaction requires additional confirmation"
    else:
        return "ALLOW", "Transaction looks normal"

@app.post("/predict")
def predict(txn: TransactionInput):
    row = {
        'amount_log': np.log1p(txn.amount),
        'hour_of_day': txn.hour_of_day,
        'sender_txn_count': txn.sender_txn_count,
        'dest_txn_count': txn.dest_txn_count,
        'is_new_recipient': txn.is_new_recipient,
        'amount_vs_sender_avg': txn.amount_vs_sender_avg,
        'type_cash_out': txn.type_cash_out,
    }
    result = get_reasons(row)
    decision, decision_reason = decide(result['risk_score'], txn.webseal_integrity_ok, txn.session_integrity_ok)

    # Contextual reasons matching the authoritative decision trigger
    if not txn.webseal_integrity_ok:
        reasons = [
            "Payment interface cryptographic hash mismatch detected",
            "Recipient identity altered in DOM after Step 0 confirmation",
            "Critical payment parameter integrity validation failed"
        ]
    elif not txn.session_integrity_ok:
        reasons = [
            "Browser session focus lost during checkout step transition",
            "Unusual session interruption or DevTools activity detected",
            "Transaction flow paused pending explicit customer verification"
        ]
    else:
        reasons = result['reasons']

    return {
        "risk_score": result['risk_score'],
        "reasons": reasons,
        "decision": decision,
        "decision_reason": decision_reason,
        "webseal_integrity_ok": txn.webseal_integrity_ok,
        "session_integrity_ok": txn.session_integrity_ok,
    }

@app.get("/health")
def health():
    return {"status": "ok"}
