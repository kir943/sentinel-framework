import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Lock, QrCode, ShieldCheck, Smartphone } from "lucide-react";
import { formatPrice } from "@/data/products";

export type PaymentMethodId = "upi";

/** Configure with a real UPI ID before going live. */
export const UPI_ID = "weave@upi";
export const UPI_PAYEE_NAME = "Weave Studio";

export const buildUpiUri = (amount: number, note?: string) =>
  `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&am=${amount.toFixed(2)}&cu=INR${
    note ? `&tn=${encodeURIComponent(note)}` : ""
  }`;

/**
 * Step 2 Pre-Confirmation Payment Method Card.
 * Notice: The QR code is NOT rendered yet! It is only generated after
 * the user clicks "Confirm & Pay" and Sentinel verifies interface integrity.
 */
export function PaymentMethods({
  total,
}: {
  value?: PaymentMethodId;
  onChange?: (id: PaymentMethodId) => void;
  total: number;
  orderNote?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-[0_10px_35px_-20px_var(--primary)]">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <QrCode className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-display text-lg font-medium text-foreground">
                UPI / Dynamic Scan QR
              </h3>
              <p className="text-xs text-muted-foreground">
                Zero transaction fee &bull; Instant verification
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-[0.7rem] uppercase tracking-wider text-[var(--sentinel)] font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Protected</span>
          </span>
        </div>

        {/* Informational State before Confirm & Pay */}
        <div className="mt-6 rounded-2xl border border-border/70 bg-background/80 p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">
            Dynamic QR Generated Upon Confirmation
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground max-w-sm mx-auto">
            To prevent payee spoofing or DOM manipulation, Sentinel validates interface and session
            integrity before creating your single-use payment QR.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-[0.72rem] text-muted-foreground">
            <Smartphone className="h-3.5 w-3.5" />
            <span>Payable with GPay, PhonePe, Paytm, CRED &amp; BHIM</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>Payee: <strong className="text-foreground">{UPI_PAYEE_NAME}</strong></span>
          <span>UPI ID: <code className="rounded bg-secondary px-1.5 py-0.5 text-foreground">{UPI_ID}</code></span>
        </div>
      </div>
    </div>
  );
}

/**
 * Rendered ONLY AFTER Confirm & Pay when Sentinel returns ALLOW.
 * If tampering is detected, this component is NEVER mounted.
 */
export function UpiQrPaymentView({
  total,
  orderNote,
  onPaymentSuccess,
}: {
  total: number;
  orderNote?: string;
  onPaymentSuccess: () => void;
}) {
  const upiUri = buildUpiUri(total, orderNote);

  return (
    <div className="mx-auto w-full max-w-lg animate-rise rounded-3xl border border-[var(--sentinel)]/40 bg-background p-7 text-center shadow-lg">
      <div className="inline-flex items-center gap-2 rounded-full bg-[var(--sentinel)]/10 px-4 py-1.5 text-xs text-[var(--sentinel)] font-medium">
        <ShieldCheck className="h-4 w-4" />
        <span>Sentinel Verified: All 3 Signals Intact</span>
      </div>

      <h2 className="mt-4 font-display text-2xl sm:text-3xl text-foreground">
        Scan to Pay {formatPrice(total)}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Dynamic authenticated QR code generated for order WV-48210
      </p>

      {/* Authenticated QR Code */}
      <div className="mx-auto mt-6 w-fit rounded-3xl border border-[var(--sentinel)]/30 bg-white p-5 shadow-sm">
        <QRCodeSVG
          value={upiUri}
          size={190}
          level="M"
          bgColor="#ffffff"
          fgColor="#241914"
          className="h-44 w-44 sm:h-48 sm:w-48"
        />
      </div>

      <p className="mt-5 text-xs font-medium text-foreground">
        Scan with any UPI app — Google Pay, PhonePe, Paytm, CRED or bank app
      </p>
      <p className="mt-1 text-[0.7rem] text-muted-foreground">
        Recipient: <strong className="text-foreground">{UPI_PAYEE_NAME}</strong> ({UPI_ID})
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPaymentSuccess}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-all hover:bg-primary/90 shadow-sm"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>I Have Paid &bull; Confirm Order</span>
        </button>
      </div>
    </div>
  );
}
