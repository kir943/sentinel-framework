
# 🛡️ Sentinel
Verify the user.
Verify the session.
Verify the transaction.

Because trusting the transaction isn't enough — you need to verify it.

## Application-Integrated Transaction Integrity & AI Risk Framework

> **Don't just trust the transaction. Verify it.**

Sentinel is an application-integrated security framework designed to protect digital payment workflows by combining **AI-driven behavioral risk detection, transaction integrity verification, and session integrity monitoring**.

The system evaluates multiple security signals through a **server-side Trust Engine** and produces a graduated response:

**ALLOW → VERIFY → BLOCK**

Sentinel is demonstrated through an e-commerce payment workflow where security decisions are made before payment initiation.

---

## Overview

Modern fraud detection can determine whether a transaction or user appears suspicious, but payment security has another important dimension: **application integrity**.

A transaction may look legitimate while the payment interface inside the user's browser has been modified.

Sentinel addresses this by asking two questions:

> **Is the transaction behavior suspicious?**

and

> **Can we still trust the transaction being presented to the user?**

By combining behavioral intelligence with transaction and session integrity, Sentinel creates a layered security model for high-value digital actions.

---

## Architecture

<img width="1588" height="1462" alt="image" src="https://github.com/user-attachments/assets/ba72bc50-fc9a-40c7-b525-3a478a980bd5" />


Sentinel consists of three primary security layers that feed into a server-side Trust Engine.

### 1. Behavioral Risk Engine

The behavioral layer uses a pretrained **XGBoost machine learning model** to evaluate transaction and behavioral signals and generate a risk score.

Risk levels are mapped to graduated responses:

| Risk Level | Response |
|---|---|
| Low | ALLOW |
| Moderate | VERIFY |
| High | BLOCK |

The ML service also supports **SHAP-based explanations**, providing insight into the factors contributing to a model decision.

---

### 2. WebSeal — Transaction Integrity

WebSeal protects critical values at the transaction boundary inside the browser.

A cryptographic baseline is generated for important transaction information such as:

```text
Recipient + Amount
````

The baseline is protected using **SHA-256 hashing** and monitored through browser-side integrity checks.

If an unexpected modification occurs:

```text
Trusted Transaction
        ↓
SHA-256 Baseline
        ↓
Unexpected Modification
        ↓
Integrity Mismatch
        ↓
Trust Engine
        ↓
BLOCK
```

This allows Sentinel to detect application-level manipulation even when the transaction initially appeared legitimate.

---

### 3. Session Integrity

The session layer monitors browser-session conditions that may indicate an abnormal payment environment.

Signals include:

* Window or tab blur
* Document visibility changes
* Viewport changes
* Unexpected browser dimension changes

Depending on the situation, a session anomaly can trigger **VERIFY** rather than immediately blocking the transaction.

---

# Trust Engine

The Sentinel Trust Engine acts as the final decision layer.

The browser and ML systems provide signals, but the **server makes the authoritative decision**.

```text
                 SECURITY SIGNALS
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
     Behavioral     Transaction     Session
        Risk         Integrity     Integrity
          |             |             |
          +-------------+-------------+
                        |
                        v
               SENTINEL TRUST ENGINE
                        |
             +----------+----------+
             |          |          |
             v          v          v
           ALLOW      VERIFY      BLOCK
```

This creates a defense-in-depth approach where compromising one layer does not automatically bypass the entire security decision.



# Payment Protection

Sentinel separates **security evaluation** from **payment initiation**.

The payment flow follows:

```text
Checkout
   ↓
Sentinel Activated
   ↓
Security Evaluation
   ↓
Server Trust Decision
   ↓
+---------+---------+---------+
|         |         |         |
ALLOW    VERIFY    BLOCK
|         |         |
↓         ↓         ↓
Payment  Additional  Payment
Flow     Verification Withheld
```

One of the key demonstrations is silent transaction tampering.

If a protected payment value is modified:

```text
Transaction Tampering
        ↓
SHA-256 Mismatch
        ↓
WebSeal Detection
        ↓
Server Decision
        ↓
BLOCK
        ↓
Payment QR Withheld
```

The objective is to prevent a potentially manipulated payment boundary from being exposed to the user.

---

# Demonstration Scenarios

The prototype provides controlled scenarios to demonstrate different security decisions.

| Scenario                     | Expected Decision |
| ---------------------------- | ----------------- |
| Normal transaction           | ALLOW             |
| Silent transaction tampering | BLOCK             |
| High behavioral risk         | BLOCK             |
| Moderate behavioral risk     | VERIFY            |
| Session / tab anomaly        | VERIFY            |

This demonstrates that Sentinel does not treat every anomaly as fraud. Instead, the response is proportional to the detected risk.

---

# Why Sentinel?

Traditional security systems often focus on individual signals.

Sentinel combines multiple dimensions:

```text
Behavioral Intelligence
          +
Transaction Integrity
          +
Session Integrity
          ↓
   Unified Risk Decision
          ↓
   ALLOW / VERIFY / BLOCK
```

This provides a more complete view of transaction trust.

The key principle is:

> **The client can report what it sees. The server decides what it trusts.**

---

# Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Python
* FastAPI

### Machine Learning

* XGBoost
* Scikit-learn
* SHAP

### Browser Security

* Chrome Extension Manifest V3
* JavaScript
* SHA-256
* MutationObserver

---

# Project Structure

```text
sentinel-framework/
│
├── weave-editorial-fashion-showcase/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── routes/
│   └── package.json
│
├── ml-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── train.py
│   │   ├── explain.py
│   │   └── prepare_data.py
│   ├── models/
│   │   ├── model_nonleaky.pkl
│   │   └── eval_results.json
│   ├── requirements.txt
│   └── test_scenarios.py
│
├── webseal-extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content-script.js
│   └── popup/
│
├── architecture.png
└── README.md
```

---

# Getting Started

### Clone the repository

```bash
git clone https://github.com/kir943/sentinel-framework.git
cd sentinel-framework
```

### Start the ML / Trust Service

```bash
cd ml-service
python -m venv venv
```

On Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI service using the configuration in:

```text
ml-service/app/main.py
```

### Start the Demo Application

Open another terminal:

```bash
cd weave-editorial-fashion-showcase
npm install
npm run dev
```

### Load WebSeal

Open Chrome:

```text
chrome://extensions
```

Enable **Developer Mode**, select **Load unpacked**, and choose:

```text
webseal-extension/
```

---

# Future Scope

Sentinel is designed as a framework concept that can evolve beyond the current demonstration.

Potential extensions include:

* Production-ready Sentinel SDK
* Simple application integration APIs
* Real-time risk dashboards
* Adaptive verification policies
* Pluggable ML models
* Advanced anomaly detection
* Security audit trails
* Broader browser and platform support

A future integration could expose a simple interface such as:

```javascript
Sentinel.protectTransaction({
    amount,
    recipient,
    session,
    userContext
});
```

with the security layer returning:

```text
ALLOW
VERIFY
BLOCK
```

---

# Prototype Scope

Sentinel is currently demonstrated through an e-commerce payment workflow.

The payment QR/deep-link flow is implemented for the demonstration, while actual payment settlement is simulated.

Sentinel is intended as an **application-level security and risk layer** and does not replace bank, UPI, payment-gateway, or platform-level security infrastructure.

---

# Razorpay Buildathon

## Track 02 — AI Risk Manager

This project was built for the **Razorpay Buildathon**, specifically for **Track 02: AI Risk Manager**.

The track focuses on building systems that can help prevent financial loss caused by **fraud, returns, and chargebacks**.

Sentinel approaches the fraud-risk problem by combining:

**AI Behavioral Risk + Transaction Integrity + Session Integrity**

into a single server-authoritative decision system:

```text
                SENTINEL
                   ↓
          Risk & Integrity Signals
                   ↓
           Trust Engine
                   ↓
        +----------+----------+
        |          |          |
      ALLOW      VERIFY      BLOCK
```

The goal is to detect suspicious conditions early and prevent unsafe transactions from progressing through the payment workflow.

---
