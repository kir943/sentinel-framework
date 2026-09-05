import { useEffect, useState } from "react";

/**
 * Hook to evaluate browser session integrity during the Checkout lifecycle.
 *
 * Tracks:
 * 1. Window blur events (switching focus to another application or window).
 * 2. Document visibility changes (backgrounding or switching browser tabs).
 * 3. DevTools opening heuristic via window outer vs inner dimension delta.
 *
 * NOTE / LIMITATION:
 * This is an approximate heuristic and session-level check, not a full
 * hardware/OS-level attestation boundary (consistent with the ml-service
 * stated architecture and limitations).
 */
export function useSessionIntegrity() {
  const [integrityOk, setIntegrityOk] = useState(true);

  useEffect(() => {
    const handleBlur = () => {
      console.warn("[Session Integrity] Window blur detected during checkout");
      setIntegrityOk(false);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        console.warn("[Session Integrity] Tab visibility hidden during checkout");
        setIntegrityOk(false);
      }
    };

    // Approximate devtools open detection
    const devtoolsCheck = setInterval(() => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        console.warn("[Session Integrity] DevTools dimension threshold exceeded");
        setIntegrityOk(false);
      }
    }, 1000);

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(devtoolsCheck);
    };
  }, []);

  return integrityOk;
}
