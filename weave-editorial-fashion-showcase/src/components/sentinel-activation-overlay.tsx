import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useCart } from "@/lib/cart";

/**
 * Full-screen cinematic Sentinel activation overlay.
 *
 * Sequence (~2.4s):
 * 0.0s - 0.2s: Fade in warm cream overlay with subtle radar rings.
 * 0.2s - 0.7s: Geometric shield/hexagon renders with pulse glow; "SENTINEL" + "Initializing payment protection..."
 * 0.7s - 1.0s: Step 1: ✓ Payment integrity
 * 1.0s - 1.4s: Step 2: ✓ Transaction verification
 * 1.4s - 1.8s: Step 3: ✓ Session protection
 * 1.8s - 2.2s: Shield lock transition -> "SENTINEL ACTIVE" in emerald tracking font.
 * 2.2s - 2.5s: Smooth fade out back to checkout with Sentinel visibly ON.
 */
export function SentinelActivationOverlay() {
  const { isActivating } = useCart();
  const [stage, setStage] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!isActivating) {
      setStage(0);
      setClosing(false);
      return;
    }

    setStage(1);
    setClosing(false);

    const t1 = setTimeout(() => setStage(2), 700);   // Step 1: Payment integrity
    const t2 = setTimeout(() => setStage(3), 1050);  // Step 2: Transaction verification
    const t3 = setTimeout(() => setStage(4), 1400);  // Step 3: Session protection
    const t4 = setTimeout(() => setStage(5), 1800);  // Locked: SENTINEL ACTIVE
    const t5 = setTimeout(() => setClosing(true), 2200); // Start fade-out

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isActivating]);

  if (!isActivating) return null;

  return (
    <div
      role="dialog"
      aria-label="Sentinel Activation"
      aria-modal="true"
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#faf8f5]/97 backdrop-blur-md px-6 text-center transition-opacity duration-300 ${
        closing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Editorial Hairline Frame */}
      <div className="pointer-events-none absolute inset-4 sm:inset-8 border border-border/40 rounded-3xl" />
      <div className="pointer-events-none absolute top-8 left-8 hidden sm:block text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground/70">
        Weave Studio &bull; Security Infrastructure
      </div>
      <div className="pointer-events-none absolute bottom-8 right-8 hidden sm:block text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground/70">
        Framework v2.4
      </div>

      <div className="relative flex flex-col items-center max-w-sm sm:max-w-md w-full animate-rise">
        {/* Radar concentric pulse rings */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-48 w-48 sm:h-56 sm:w-56 rounded-full border border-[var(--sentinel)]/20 animate-ping" />
          <div className="absolute h-64 w-64 sm:h-72 sm:w-72 rounded-full border border-dashed border-[var(--sentinel)]/15" />
          <div className="absolute h-36 w-36 sm:h-44 sm:w-44 rounded-full bg-[var(--sentinel)]/5 blur-xl" />

          {/* Geometric Shield / Hexagon Motif */}
          <div
            className={`relative transition-transform duration-500 ${
              stage >= 5 ? "scale-105" : "scale-100"
            }`}
          >
            <svg
              viewBox="0 0 160 180"
              className="h-28 w-28 sm:h-36 sm:w-36 drop-shadow-sm transition-all duration-500"
            >
              {/* Outer Hex-Shield */}
              <path
                d="M80 14 L142 42 V96 C142 136 112 160 80 172 C48 160 18 136 18 96 V42 Z"
                fill={stage >= 5 ? "oklch(0.58 0.14 142 / 0.14)" : "oklch(0.58 0.14 142 / 0.06)"}
                stroke="var(--sentinel)"
                strokeWidth={stage >= 5 ? 3.5 : 2}
                className="transition-all duration-400"
              />

              {/* Inner geometric facet lines */}
              <polygon
                points="80,36 124,56 124,96 80,146 36,96 36,56"
                fill="none"
                stroke="var(--sentinel)"
                strokeWidth="1"
                strokeOpacity={stage >= 5 ? "0.6" : "0.3"}
                strokeDasharray="4 4"
                className="transition-all duration-300"
              />

              {/* Central Seal Checkmark / Lock */}
              {stage < 5 ? (
                <path
                  d="M58 88 L72 102 L104 68"
                  fill="none"
                  stroke="var(--sentinel)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="sentinel-check"
                />
              ) : (
                <g className="animate-rise">
                  <path
                    d="M56 88 L72 104 L106 66"
                    fill="none"
                    stroke="var(--sentinel)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="80"
                    cy="95"
                    r="52"
                    fill="none"
                    stroke="var(--sentinel)"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Prominent Title */}
        <h2 className="mt-8 font-display text-3xl sm:text-4xl tracking-[0.2em] uppercase text-foreground">
          Sentinel
        </h2>

        {/* Status indicator subtitle */}
        <p
          className={`mt-2 text-xs uppercase tracking-[0.25em] font-medium transition-colors duration-400 ${
            stage >= 5 ? "text-[var(--sentinel)]" : "text-primary"
          }`}
        >
          {stage >= 5 ? "SENTINEL ACTIVE" : "Initializing payment protection…"}
        </p>

        {/* Sequential Step Checklist */}
        <div className="mt-8 w-full max-w-xs space-y-3 rounded-2xl border border-border/80 bg-background/80 p-5 shadow-sm">
          {/* Step 1: Payment integrity */}
          <div
            className={`flex items-center justify-between text-xs transition-all duration-400 ${
              stage >= 2 ? "opacity-100 text-foreground" : "opacity-40 text-muted-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                  stage >= 2
                    ? "bg-[var(--sentinel)] text-white"
                    : "border border-border text-transparent"
                }`}
              >
                <Check className="h-2.5 w-2.5" />
              </span>
              <span>Payment integrity</span>
            </span>
            <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {stage >= 2 ? "Sealed" : "Pending"}
            </span>
          </div>

          {/* Step 2: Transaction verification */}
          <div
            className={`flex items-center justify-between text-xs transition-all duration-400 ${
              stage >= 3 ? "opacity-100 text-foreground" : "opacity-40 text-muted-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                  stage >= 3
                    ? "bg-[var(--sentinel)] text-white"
                    : "border border-border text-transparent"
                }`}
              >
                <Check className="h-2.5 w-2.5" />
              </span>
              <span>Transaction verification</span>
            </span>
            <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {stage >= 3 ? "Verified" : "Pending"}
            </span>
          </div>

          {/* Step 3: Session protection */}
          <div
            className={`flex items-center justify-between text-xs transition-all duration-400 ${
              stage >= 4 ? "opacity-100 text-foreground" : "opacity-40 text-muted-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                  stage >= 4
                    ? "bg-[var(--sentinel)] text-white"
                    : "border border-border text-transparent"
                }`}
              >
                <Check className="h-2.5 w-2.5" />
              </span>
              <span>Session protection</span>
            </span>
            <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {stage >= 4 ? "Armored" : "Pending"}
            </span>
          </div>
        </div>

        {/* Bottom confirmation status */}
        <div className="mt-6 flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span
            className={`h-2 w-2 rounded-full transition-colors ${
              stage >= 5
                ? "bg-[var(--sentinel)] shadow-[0_0_10px_var(--sentinel)]"
                : "bg-primary animate-pulse"
            }`}
          />
          <span>{stage >= 5 ? "All Systems Sealed" : "Securing checkout session..."}</span>
        </div>
      </div>
    </div>
  );
}
