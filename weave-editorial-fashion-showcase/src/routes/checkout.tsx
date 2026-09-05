import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { formatPrice } from "@/data/products";
import { useCart } from "@/lib/cart";
import { PaymentMethods, UpiQrPaymentView, type PaymentMethodId } from "@/components/payment-methods";
import { SentinelShield, type SentinelVariant } from "@/components/sentinel-shield";
import { useSessionIntegrity } from "@/hooks/use-session-integrity";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Weave" },
      {
        name: "description",
        content: "Complete your Weave order in three steps: details, delivery and payment.",
      },
      { property: "og:title", content: "Checkout — Weave" },
      { property: "og:description", content: "Complete your Weave order in three steps." },
    ],
  }),
  component: Checkout,
});

const steps = ["Details", "Delivery", "Payment"] as const;
type Decision = "ALLOW" | "VERIFY" | "BLOCK";
type Status = "idle" | "processing" | "awaiting_upi" | "done";

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  websealAttr,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  websealAttr?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        data-webseal={websealAttr}
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function Checkout() {
  const { lines, subtotal, shipping, sentinel, sentinelCost, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [paidAmount, setPaidAmount] = useState(0);
  const [paidItems, setPaidItems] = useState(0);
  const [payMethod] = useState<PaymentMethodId>("upi");
  const [form, setForm] = useState({
    email: "",
    name: "Kiran Jadhav",
    address: "12 Rua da Boavista",
    city: "Lisbon",
    postcode: "1200-067",
    method: "standard",
  });

  // Layer 3: Session integrity signal from React hook
  const realSessionIntegrityOk = useSessionIntegrity();
  const [simulatedSessionDrop, setSimulatedSessionDrop] = useState(false);
  const sessionIntegrityOk = simulatedSessionDrop ? false : realSessionIntegrityOk;

  // Layer 2: WebSeal UI integrity signal from Chrome Extension
  const [websealIntegrityOk, setWebsealIntegrityOk] = useState(true);
  const [websealExtensionDetected, setWebsealExtensionDetected] = useState(false);
  const [websealReason, setWebsealReason] = useState("");
  const baselineHashRef = useRef<string>("");

  // Scripted demo triggers
  const [demoMode, setDemoMode] = useState<"normal" | "tamper" | "highrisk" | "verify">("normal");
  const [tamperSwapped, setTamperSwapped] = useState(false);
  const [underlyingRecipient, setUnderlyingRecipient] = useState("Kiran Jadhav");
  const [showDevPanel, setShowDevPanel] = useState(false);

  // Sentinel ML / Trust Engine API response state
  const [decision, setDecision] = useState<Decision | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [shieldVariant, setShieldVariant] = useState<SentinelVariant>("default");

  // Helper for real SHA-256 cryptographic digest
  const computeSha256 = async (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // Check for extension on mount and establish baseline
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (document.documentElement.getAttribute("data-webseal-extension") === "active") {
        setWebsealExtensionDetected(true);
      }
    }
  }, []);

  // Detect URL query parameters on mount (?demo=tamper, ?demo=highrisk, ?dev=true)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const demoParam = params.get("demo");
      if (demoParam === "tamper") {
        setDemoMode("tamper");
        setShowDevPanel(true);
      } else if (demoParam === "highrisk") {
        setDemoMode("highrisk");
        setShowDevPanel(true);
      } else if (demoParam === "verify") {
        setDemoMode("verify");
        setShowDevPanel(true);
      }
      if (params.get("dev") === "true") {
        setShowDevPanel(true);
      }
    }
  }, []);

  // Listen for WebSeal Chrome Extension messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "WEBSEAL_HANDSHAKE" || event.data?.type === "WEBSEAL_READY") {
        setWebsealExtensionDetected(true);
        console.log("%c[Checkout]%c WebSeal Extension Handshake Confirmed", "color:#c86244;", "color:#2e7d32;");
      } else if (event.data?.type === "WEBSEAL_RESULT") {
        setWebsealExtensionDetected(true);
        setWebsealIntegrityOk(event.data.integrity_ok);
        if (event.data.reason) setWebsealReason(event.data.reason);
        console.log("%c[Checkout]%c WebSeal Real Hash Result:", "color:#c86244;", "color:#5c4a40;", event.data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Establish cryptographic baseline at Step 0
  useEffect(() => {
    if (step === 0) {
      computeSha256(`${form.name}:${total}`).then((hash) => {
        baselineHashRef.current = hash;
      });
    }
  }, [step, form.name, total]);

  // Programmatic Tamper Simulation:
  // Only fires when user reaches Step 2 with tamper mode armed.
  // Performs a real silent DOM mutation on the underlying security boundary.
  useEffect(() => {
    if (demoMode === "tamper" && step === 2 && !tamperSwapped) {
      console.log("%c[Attack Simulation]%c Executing silent DOM payee rewrite...", "background:#d9534f;color:white;font-weight:bold;", "color:#d9534f;");
      
      const timer = setTimeout(async () => {
        setTamperSwapped(true);
        const maliciousPayee = "ATTACKER-PAYEE-0x98F4";
        setUnderlyingRecipient(maliciousPayee);

        // Mutate actual DOM elements
        const boundaryEl = document.getElementById("webseal-security-boundary");
        if (boundaryEl) {
          boundaryEl.dataset.websealRecipient = maliciousPayee;
        }
        const confirmedEl = document.getElementById("webseal-confirmed-recipient");
        if (confirmedEl) {
          confirmedEl.dataset.tampered = maliciousPayee;
        }

        // Notify WebSeal extension to evaluate the real mutated DOM
        window.postMessage({ type: "WEBSEAL_VERIFY_NOW" }, "*");

        // Parallel standalone cryptographic verification:
        const currentHash = await computeSha256(`${maliciousPayee}:${total}`);
        if (currentHash !== baselineHashRef.current) {
          setWebsealIntegrityOk(false);
          setWebsealReason(`Cryptographic hash mismatch: Initial ${baselineHashRef.current.substring(0, 10)}... vs Current ${currentHash.substring(0, 10)}...`);
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [demoMode, step, tamperSwapped, total]);

  const set = (key: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
    if (key === "name") {
      setUnderlyingRecipient(v);
    }
  };

  if (lines.length === 0 && status !== "done") {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-24 text-center sm:px-8">
        <h1 className="font-display text-4xl text-foreground">Nothing to check out</h1>
        <Link
          to="/"
          search={{ tab: "women" }}
          className="mt-8 inline-flex rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-[0.18em] text-primary-foreground transition-all hover:bg-primary/90"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  // Execute payment call to Sentinel Trust Engine (ml-service)
  const pay = async () => {
    setPaidAmount(total);
    setPaidItems(lines.reduce((n, l) => n + l.quantity, 0));
    setStatus("processing");

    const isTamper = demoMode === "tamper" || tamperSwapped;
    const isHighRisk = demoMode === "highrisk";
    const isVerify = demoMode === "verify";

    // Pin exact deterministic values according to specification:
    // - Normal: cartTotal, real hour, established history -> risk_score < 30 -> ALLOW
    // - High Risk: 250000.0, hour 3, amount_vs_avg 12.5 -> risk_score 99.1 -> BLOCK
    // - Moderate Risk: 75000.0, hour 14, amount_vs_avg 37.5 -> risk_score 61.4 -> VERIFY
    // - Tamper: dest_txn_count: 0, is_new_recipient: 1, webseal_integrity_ok: false -> BLOCK
    // - Session Drop: session_integrity_ok: false -> VERIFY
    const effectiveWebsealOk = isTamper ? false : websealIntegrityOk;
    const effectiveSessionOk = sessionIntegrityOk;

    const payload = {
      amount: isHighRisk ? 250000.0 : isVerify ? 75000.0 : Number(total),
      hour_of_day: isHighRisk ? 3 : new Date().getHours(),
      sender_txn_count: isHighRisk ? 5 : 12,
      dest_txn_count: isTamper ? 0 : isVerify ? 5 : 50,
      is_new_recipient: isTamper || isHighRisk ? 1 : 0,
      amount_vs_sender_avg: isHighRisk ? 12.5 : isVerify ? 37.5 : Number(total) / 2000,
      type_cash_out: 0,
      webseal_integrity_ok: effectiveWebsealOk,
      session_integrity_ok: effectiveSessionOk,
    };

    console.log("[Checkout] Submitting transaction to Sentinel ml-service:", payload);

    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}`);
      }

      const result = await res.json();
      console.log("[Checkout] Received Sentinel decision:", result);

      setDecision(result.decision);
      setDecisionReason(result.decision_reason);
      setReasons(result.reasons || []);
      setRiskScore(result.risk_score);

      // Trigger alert shield animation if tampered or blocked
      if (result.decision === "BLOCK" && !effectiveWebsealOk) {
        setShieldVariant("alert");
      } else if (result.decision === "BLOCK") {
        setShieldVariant("alert");
      } else if (result.decision === "VERIFY") {
        setShieldVariant("warning");
      } else {
        setShieldVariant("default");
      }

      // Brief realistic delay for polish
      setTimeout(() => {
        if (result.decision === "ALLOW") {
          // Authenticated QR code generated ONLY after Sentinel verifies all signals!
          setStatus("awaiting_upi");
        } else {
          // Tampered (BLOCK) or flagged (VERIFY): QR code is NEVER generated or shown
          setStatus("done");
        }
      }, 900);
    } catch (err) {
      console.error("[Checkout] Error calling ml-service:", err);
      // Local fallback with real decision logic if ml-service is briefly unreachable
      let fallbackDecision: Decision = "ALLOW";
      let fallbackReason = "Transaction looks normal";
      const fallbackReasons = ["Transaction verified locally"];

      if (!effectiveWebsealOk) {
        fallbackDecision = "BLOCK";
        fallbackReason = "Payment interface integrity check failed";
        fallbackReasons.unshift("Payment interface cryptographic hash mismatch detected");
        fallbackReasons.push("Recipient identity altered in DOM after Step 0 confirmation");
        setShieldVariant("alert");
      } else if (!effectiveSessionOk) {
        fallbackDecision = "VERIFY";
        fallbackReason = "Unusual session activity detected";
        fallbackReasons.unshift("Browser session focus lost during checkout step transition");
        setShieldVariant("warning");
      }

      setDecision(fallbackDecision);
      setDecisionReason(fallbackReason);
      setReasons(fallbackReasons);

      setTimeout(() => {
        if (fallbackDecision === "ALLOW") {
          setStatus("awaiting_upi");
        } else {
          setStatus("done");
        }
      }, 900);
    }
  };

  const methodLabel = "UPI";

  // Processing state
  if (status === "processing") {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-5 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h1 className="mt-6 font-display text-3xl text-foreground">Evaluating transaction</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sentinel is validating behavioral patterns, UI seals, and session integrity before generating payment QR...
        </p>
        <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/3 animate-slide rounded-full bg-primary" />
        </div>
      </div>
    );
  }

  // Dynamic Authenticated QR Code view (Generated ONLY AFTER Confirm & Pay on ALLOW)
  if (status === "awaiting_upi") {
    return (
      <div className="mx-auto w-full max-w-xl px-5 py-16 sm:px-8">
        <UpiQrPaymentView
          total={total}
          orderNote="Weave Studio order"
          onPaymentSuccess={() => {
            setPaidAmount(total);
            setPaidItems(lines.reduce((n, l) => n + l.quantity, 0));
            setStatus("done");
            clearCart();
          }}
        />
      </div>
    );
  }

  // Result screens (ALLOW / VERIFY / BLOCK)
  if (status === "done" && decision) {
    if (decision === "ALLOW") {
      return (
        <div className="mx-auto w-full max-w-xl px-5 py-20 sm:px-8">
          <div className="animate-rise rounded-3xl border border-primary/40 bg-primary/5 p-8 text-center">
            <span className="inline-flex rounded-2xl bg-primary p-3 text-primary-foreground">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl text-foreground">Order confirmed</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Thank you{form.name ? `, ${form.name.split(" ")[0]}` : ""}. Order WV-48210 is
              confirmed via {methodLabel} and ships within two working days. A receipt is on its
              way to {form.email || "your inbox"}.
            </p>

            <dl className="mx-auto mt-6 max-w-xs space-y-2 rounded-2xl bg-background p-5 text-left text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Items</dt>
                <dd className="text-foreground">{paidItems}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Paid with</dt>
                <dd className="text-foreground">{methodLabel}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base">
                <dt className="text-foreground">Total paid</dt>
                <dd className="text-foreground">{formatPrice(paidAmount)}</dd>
              </div>
            </dl>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-xs text-[var(--sentinel)]">
              <ShieldCheck className="h-4 w-4" /> Sentinel Protection verified: 3/3 signals intact
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/"
                search={{ tab: "women" }}
                className="rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.18em] text-primary-foreground transition-all hover:bg-primary/90"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (decision === "VERIFY") {
      return (
        <div className="mx-auto w-full max-w-xl px-5 py-20 sm:px-8">
          <div className="animate-rise rounded-3xl border border-amber-500/40 bg-amber-500/5 p-8 text-center">
            <div className="flex justify-center">
              <SentinelShield active={true} variant="warning" size={76} />
            </div>
            <h1 className="mt-5 font-display text-3xl text-foreground">
              Verification Required
            </h1>
            <p className="mt-2 text-sm font-medium text-amber-700">
              {decisionReason || "We need to double check this payment"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Sentinel identified signals that warrant a quick second look. No funds have been
              withdrawn yet.
            </p>

            {reasons.length > 0 && (
              <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-background p-5 text-left text-xs">
                <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                  Security Assessment
                </p>
                <ul className="mt-3 space-y-2 text-foreground">
                  {reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStatus("awaiting_upi");
                }}
                className="rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.18em] text-primary-foreground transition-all hover:bg-primary/90"
              >
                Confirm &amp; Generate QR
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setStep(2);
                }}
                className="rounded-full border border-border px-6 py-3 text-sm uppercase tracking-[0.18em] text-foreground transition-all hover:border-primary hover:text-primary"
              >
                Cancel payment
              </button>
            </div>
          </div>
        </div>
      );
    }

    // BLOCK outcome
    return (
      <div className="mx-auto w-full max-w-xl px-5 py-20 sm:px-8">
        <div className="animate-rise rounded-3xl border border-destructive/40 bg-destructive/5 p-8 text-center">
          <div className="flex justify-center">
            <SentinelShield active={true} variant="alert" size={82} />
          </div>
          <h1 className="mt-5 font-display text-3xl text-foreground">
            Payment Paused — Something Changed
          </h1>
          <p className="mt-2 text-sm font-medium text-destructive">
            {decisionReason || "Payment interface integrity check failed"}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Your bank and Sentinel flagged an unexpected anomaly. Nothing has been charged and your
            bag is untouched.
          </p>

          <div className="mx-auto mt-4 max-w-sm rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive text-center">
            <strong>Payment QR Withheld:</strong> Because interface tampering was detected, the single-use payment QR was withheld to protect your funds.
          </div>

          {reasons.length > 0 && (
            <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-background p-5 text-left text-xs">
              <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                Integrity Reasons
              </p>
              <ul className="mt-3 space-y-2 text-foreground">
                {reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setStep(0);
                setDemoMode("normal");
                setTamperSwapped(false);
                setWebsealIntegrityOk(true);
                const recipientInput = document.querySelector(
                  '[data-webseal="recipient"]'
                ) as HTMLInputElement;
                if (recipientInput) delete recipientInput.dataset.tamperedValue;
              }}
              className="rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.18em] text-primary-foreground transition-all hover:bg-primary/90"
            >
              Review &amp; Retry
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/cart" })}
              className="rounded-full border border-border px-6 py-3 text-sm uppercase tracking-[0.18em] text-foreground transition-all hover:border-primary hover:text-primary"
            >
              Back to bag
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-foreground sm:text-5xl">Checkout</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Protected by Sentinel Payment Integrity Framework
          </p>
        </div>

        {/* Sentinel Live Status Indicator */}
        <div className="flex items-center gap-3 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              websealIntegrityOk && sessionIntegrityOk
                ? "bg-[var(--sentinel)] shadow-[0_0_8px_var(--sentinel)]"
                : "bg-[var(--sentinel-alert)] shadow-[0_0_8px_var(--sentinel-alert)]"
            }`}
          />
          <span className="font-medium">
            Sentinel:{" "}
            {websealIntegrityOk && sessionIntegrityOk ? "All Systems Sealed" : "Anomaly Detected"}
          </span>
          <button
            type="button"
            onClick={() => setShowDevPanel((v) => !v)}
            className="ml-2 inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <Terminal className="h-3 w-3" />
            <span>Demo Bar</span>
            {showDevPanel ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Scripted Demo Bar */}
      {showDevPanel && (
        <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
            <span className="font-semibold uppercase tracking-wider text-foreground">
              Security Evaluation Demo Scenarios
            </span>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
              <span className={websealIntegrityOk ? "text-[var(--sentinel)] font-medium" : "text-destructive font-semibold"}>
                WebSeal: {websealIntegrityOk ? "SHA-256 Sealed" : "Hash Mismatch Caught"}
              </span>
              <span>&bull;</span>
              <span className={sessionIntegrityOk ? "text-[var(--sentinel)] font-medium" : "text-amber-600 font-semibold"}>
                Session: {sessionIntegrityOk ? "Secure" : "Interrupted"}
              </span>
              <span>&bull;</span>
              <span>
                Extension:{" "}
                {websealExtensionDetected ? (
                  <strong className="text-[var(--sentinel)]">Live (Manifest V3)</strong>
                ) : (
                  <span>Browser Engine (Load unpacked to test in Chrome)</span>
                )}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setDemoMode("normal");
                setTamperSwapped(false);
                setWebsealIntegrityOk(true);
                setUnderlyingRecipient(form.name);
                setSimulatedSessionDrop(false);
              }}
              className={`rounded-full px-4 py-1.5 transition-all ${
                demoMode === "normal" && !simulatedSessionDrop
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background hover:border-primary/50"
              }`}
            >
              1. Normal Flow (ALLOW)
            </button>

            <button
              type="button"
              onClick={() => {
                setDemoMode("tamper");
                setTamperSwapped(false); // Arms the tamper - executes dynamically on Step 2!
                setWebsealIntegrityOk(true);
                setSimulatedSessionDrop(false);
              }}
              className={`rounded-full px-4 py-1.5 transition-all ${
                demoMode === "tamper"
                  ? "bg-destructive text-destructive-foreground"
                  : "border border-border bg-background hover:border-destructive/50"
              }`}
            >
              2. Arm Silent Tamper (Catches on Step 2)
            </button>

            <button
              type="button"
              onClick={() => {
                setDemoMode("highrisk");
                setTamperSwapped(false);
                setWebsealIntegrityOk(true);
                setSimulatedSessionDrop(false);
              }}
              className={`rounded-full px-4 py-1.5 transition-all ${
                demoMode === "highrisk"
                  ? "bg-destructive text-destructive-foreground"
                  : "border border-border bg-background hover:border-destructive/50"
              }`}
            >
              3. Simulate High Risk (ML BLOCK)
            </button>

            <button
              type="button"
              onClick={() => {
                setDemoMode("verify");
                setTamperSwapped(false);
                setWebsealIntegrityOk(true);
                setSimulatedSessionDrop(false);
              }}
              className={`rounded-full px-4 py-1.5 transition-all ${
                demoMode === "verify"
                  ? "bg-amber-600 text-white"
                  : "border border-border bg-background hover:border-amber-500"
              }`}
            >
              4. Moderate Risk (ML VERIFY)
            </button>

            <button
              type="button"
              onClick={() => setSimulatedSessionDrop((v) => !v)}
              className={`rounded-full px-4 py-1.5 transition-all ${
                simulatedSessionDrop
                  ? "bg-amber-600 text-white"
                  : "border border-border bg-background hover:border-amber-500"
              }`}
            >
              {simulatedSessionDrop ? "Session Blur Active" : "5. Simulate Tab Blur (VERIFY)"}
            </button>
          </div>
        </div>
      )}

      {/* Steps Indicator */}
      <ol className="mt-8 flex items-center gap-3">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 text-xs uppercase tracking-[0.2em] transition-colors ${
                i <= step ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[0.7rem] transition-all ${
                  i < step
                    ? "border-primary bg-primary text-primary-foreground"
                    : i === step
                      ? "border-primary text-primary"
                      : "border-border"
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < steps.length - 1 && (
              <span
                className={`h-px flex-1 transition-colors ${i < step ? "bg-primary" : "bg-border"}`}
              />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="animate-rise">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl text-foreground">Your details</h2>
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
              />
              <Field
                label="Full name"
                value={form.name}
                onChange={set("name")}
                placeholder="Kiran Jadhav"
                websealAttr="recipient"
              />
              <Field
                label="Address"
                value={form.address}
                onChange={set("address")}
                placeholder="12 Rua da Boavista"
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="City" value={form.city} onChange={set("city")} placeholder="Lisbon" />
                <Field
                  label="Postcode"
                  value={form.postcode}
                  onChange={set("postcode")}
                  placeholder="1200-067"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl text-foreground">Delivery</h2>
              {[
                { id: "standard", title: "Standard", note: "2–4 working days", cost: shipping },
                { id: "express", title: "Express", note: "Next working day", cost: 0 },
                { id: "pickup", title: "Atelier pickup", note: "Lisbon, ready today", cost: 0 },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => set("method")(option.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-all ${
                    form.method === option.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      {option.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">{option.note}</span>
                  </span>
                  <span className="text-sm text-foreground">
                    {option.cost === 0 ? "Free" : formatPrice(option.cost)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl text-foreground">Payment</h2>
              <p className="-mt-2 text-sm text-muted-foreground">
                Choose how you would like to pay. The full amount below is protected by Sentinel.
              </p>

      {/* WebSeal Cryptographic Security Boundary (Watched across all checkout steps) */}
      <div
        id="webseal-security-boundary"
        data-webseal-recipient={underlyingRecipient}
        data-webseal-amount={total}
        className="sr-only"
        aria-hidden="true"
      />

              {/* Confirmed Recipient Review Card */}
              <div className="rounded-2xl border border-border/80 bg-background/80 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Confirmed Recipient &amp; Delivery</span>
                  <span
                    id="webseal-confirmed-recipient"
                    data-webseal="recipient-confirmed"
                    className="font-medium text-foreground"
                  >
                    {form.name}
                  </span>
                </div>
              </div>

              {tamperSwapped && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive animate-pulse">
                  <strong>Attack Observed:</strong> Underlying recipient silently rewritten to{" "}
                  <code>{underlyingRecipient}</code> in DOM. WebSeal SHA-256 hash mismatch caught the alteration.
                </div>
              )}

              <PaymentMethods
                total={total}
                orderNote="Weave Studio order"
              />
            </div>
          )}

          <div className="mt-8 flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-full border border-border px-6 py-3 text-sm uppercase tracking-[0.18em] text-foreground transition-all hover:border-primary hover:text-primary"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (step === 2 ? pay() : setStep((s) => s + 1))}
              className="flex-1 rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.18em] text-primary-foreground transition-all hover:bg-primary/90 sm:flex-none sm:px-10"
            >
              {step === 2 ? `Confirm & Pay · ${formatPrice(total)}` : "Continue"}
            </button>
          </div>
        </div>

        <aside className="h-fit rounded-3xl bg-secondary p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl text-foreground">Order summary</h2>
          <ul className="mt-5 space-y-4">
            {lines.map((line) => (
              <li key={`${line.productId}-${line.size}-${line.color}`} className="flex gap-3">
                <img
                  src={line.product.image}
                  alt={line.product.name}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="h-20 w-16 rounded-lg object-cover"
                />
                <div className="flex-1 text-xs">
                  <p className="text-sm text-foreground">{line.product.name}</p>
                  <p className="mt-1 text-muted-foreground">
                    {line.color} · {line.size} · x{line.quantity}
                  </p>
                </div>
                <p className="text-sm text-foreground">{formatPrice(line.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="text-foreground">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="text-foreground">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt className="text-foreground font-medium">Total</dt>
              <dd className="text-foreground font-medium" data-webseal="total-amount">
                {formatPrice(total)}
              </dd>
            </div>
          </dl>

          {sentinel && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-background/80 py-2.5 px-3 text-xs font-medium text-[var(--sentinel)] border border-[var(--sentinel)]/20 shadow-sm">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>✓ Sentinel Protection included</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
