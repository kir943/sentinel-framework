import { useEffect, useRef, useState } from "react";

const SHIELD_PATH =
  "M50 5 L91 20 V56 C91 82 72 99 50 111 C28 99 9 82 9 56 V20 Z";

export type SentinelVariant = "default" | "alert" | "warning";

/**
 * Vector Sentinel shield. Draws itself in when `active` flips on, then settles
 * into a quiet security-status indicator.
 * Supports "alert" variant (sharper, faster warning glow for WebSeal DOM tampering)
 * and "warning" variant (amber for session or verification flags).
 */
export function SentinelShield({
  active,
  size = 96,
  className = "",
  variant = "default",
}: {
  active: boolean;
  size?: number;
  className?: string;
  variant?: SentinelVariant;
}) {
  const [run, setRun] = useState(0);
  const prev = useRef(active);

  useEffect(() => {
    if (active && !prev.current) setRun((n) => n + 1);
    prev.current = active;
  }, [active, variant]);

  const strokeColor =
    variant === "alert"
      ? "stroke-[var(--sentinel-alert)]"
      : variant === "warning"
        ? "stroke-[var(--sentinel-warning)]"
        : "stroke-[var(--sentinel)]";

  const fillColor =
    variant === "alert"
      ? "fill-[var(--sentinel-alert)]/15"
      : variant === "warning"
        ? "fill-[var(--sentinel-warning)]/15"
        : "fill-[var(--sentinel)]/8";

  const glowClass =
    variant === "alert"
      ? "sentinel-alert-glow"
      : "sentinel-glow";

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size * 1.16 }}
      aria-hidden="true"
    >
      <svg
        key={`${run}-${variant}`}
        viewBox="0 0 100 116"
        width={size}
        height={size * 1.16}
        fill="none"
        className={active ? glowClass : ""}
      >
        <path
          d={SHIELD_PATH}
          className={active ? fillColor : "fill-transparent"}
          style={{ transition: "fill 600ms ease" }}
        />
        <path
          d={SHIELD_PATH}
          strokeWidth={active ? (variant === "alert" ? 3.5 : 3) : 1.5}
          strokeLinejoin="round"
          className={active ? `${strokeColor} sentinel-draw` : "stroke-border"}
          style={{ transition: "stroke 500ms ease, stroke-width 500ms ease" }}
        />
        {active && variant === "default" && (
          <path
            d="M34 57 L45 68 L67 45"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${strokeColor} sentinel-check`}
          />
        )}
        {active && (variant === "alert" || variant === "warning") && (
          <g className="sentinel-check">
            <line
              x1={50}
              y1={38}
              x2={50}
              y2={66}
              strokeWidth={5}
              strokeLinecap="round"
              className={strokeColor}
            />
            <circle
              cx={50}
              cy={80}
              r={3.5}
              className={
                variant === "alert"
                  ? "fill-[var(--sentinel-alert)]"
                  : "fill-[var(--sentinel-warning)]"
              }
            />
          </g>
        )}
      </svg>
    </div>
  );
}

export function SentinelStatus({
  active,
  variant = "default",
}: {
  active: boolean;
  variant?: SentinelVariant;
}) {
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <SentinelShield active={active} size={88} variant={variant} />
      <p
        className={`mt-3 text-[0.65rem] uppercase tracking-[0.32em] transition-colors duration-500 ${
          active
            ? variant === "alert"
              ? "text-[var(--sentinel-alert)]"
              : variant === "warning"
                ? "text-[var(--sentinel-warning)]"
                : "text-[var(--sentinel)]"
            : "text-muted-foreground"
        }`}
      >
        {active
          ? variant === "alert"
            ? "Integrity Alert"
            : variant === "warning"
              ? "Verification Required"
              : "Protection Active"
          : "Protection Off"}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {active
          ? variant === "alert"
            ? "Sentinel WebSeal flagged unexpected DOM manipulation."
            : "Your checkout is protected by Sentinel."
          : "Turn on Sentinel for real-time payment protection."}
      </p>
    </div>
  );
}
