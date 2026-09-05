import urllib.request
import json

def test_endpoint(name, payload):
    req = urllib.request.Request(
        'http://127.0.0.1:8000/predict',
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        print(f"[{name}]")
        print(f"  Decision: {res['decision']}")
        print(f"  Score:    {res['risk_score']}")
        print(f"  Reason:   {res['decision_reason']}")
        print(f"  Reasons:  {res['reasons']}")
        print()

print("Testing Sentinel Trust Engine on :8000...\n")

# 1. Normal checkout (ALLOW)
test_endpoint("1. NORMAL FLOW", {
    "amount": 2400.0,
    "hour_of_day": 14,
    "sender_txn_count": 12,
    "dest_txn_count": 50,
    "is_new_recipient": 0,
    "amount_vs_sender_avg": 1.2,
    "type_cash_out": 0,
    "webseal_integrity_ok": True,
    "session_integrity_ok": True
})

# 2. Tamper scenario (WebSeal false -> BLOCK)
test_endpoint("2. TAMPER SCENARIO (WebSeal flagged)", {
    "amount": 2400.0,
    "hour_of_day": 14,
    "sender_txn_count": 12,
    "dest_txn_count": 0,
    "is_new_recipient": 1,
    "amount_vs_sender_avg": 1.2,
    "type_cash_out": 0,
    "webseal_integrity_ok": False,
    "session_integrity_ok": True
})

# 3. Session integrity failure (session false -> VERIFY)
test_endpoint("3. SESSION DROP (Tab blurred / DevTools open)", {
    "amount": 2400.0,
    "hour_of_day": 14,
    "sender_txn_count": 12,
    "dest_txn_count": 50,
    "is_new_recipient": 0,
    "amount_vs_sender_avg": 1.2,
    "type_cash_out": 0,
    "webseal_integrity_ok": True,
    "session_integrity_ok": False
})

# 4. High behavioral risk (score >= 70 -> BLOCK)
test_endpoint("4. HIGH BEHAVIORAL RISK (Inflated amount, new recipient)", {
    "amount": 250000.0,
    "hour_of_day": 3,
    "sender_txn_count": 5,
    "dest_txn_count": 1,
    "is_new_recipient": 1,
    "amount_vs_sender_avg": 12.5,
    "type_cash_out": 0,
    "webseal_integrity_ok": True,
    "session_integrity_ok": True
})

# 5. Moderate behavioral risk (30 <= score < 70 -> VERIFY)
test_endpoint("5. MODERATE BEHAVIORAL RISK (Requires additional confirmation)", {
    "amount": 75000.0,
    "hour_of_day": 14,
    "sender_txn_count": 12,
    "dest_txn_count": 5,
    "is_new_recipient": 0,
    "amount_vs_sender_avg": 37.5,
    "type_cash_out": 0,
    "webseal_integrity_ok": True,
    "session_integrity_ok": True
})
