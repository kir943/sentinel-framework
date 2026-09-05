/**
 * Sentinel WebSeal Chrome Extension (Manifest V3)
 * Content Script for Real-Time DOM Integrity & Cryptographic Attestation
 *
 * Mechanism:
 * 1. Establishes cryptographic baseline hash (SHA-256) of critical checkout fields
 *    (recipient identity and total amount) at Step 0.
 * 2. Monitors DOM transitions across checkout lifecycle using MutationObserver.
 * 3. At confirmation (Step 2 / Confirm & Pay), re-reads DOM values, recomputes SHA-256 hash,
 *    and verifies it against the immutable baseline.
 * 4. Catches silent in-memory or DOM tampering (e.g., hidden payee swap) as it occurs.
 */

(function () {
  console.log("%c[Sentinel WebSeal]%c Manifest V3 Active on Checkout", "color:#c86244;font-weight:bold;", "color:#2e7d32;");

  // Signal live presence to page
  document.documentElement.setAttribute("data-webseal-extension", "active");
  window.postMessage(
    {
      type: "WEBSEAL_HANDSHAKE",
      status: "ACTIVE",
      version: "1.0.0",
      source: "CHROME_EXTENSION_MANIFEST_V3",
    },
    "*"
  );

  let baselineHash = null;
  let baselineRecipient = "";
  let baselineTotal = "";
  let lastCheckedIntegrity = true;
  let currentStep = 0;

  async function computeSha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function extractDomCriticalValues() {
    // 1. Check persistent boundary element
    const boundaryEl = document.getElementById("webseal-security-boundary");
    
    // 2. Check input field or confirmed display element
    const recipientInput = document.querySelector('input[data-webseal="recipient-input"]');
    const recipientConfirmed = document.getElementById("webseal-confirmed-recipient");

    let recipient = "";
    if (boundaryEl && boundaryEl.dataset.websealRecipient) {
      recipient = boundaryEl.dataset.websealRecipient.trim();
    } else if (recipientConfirmed) {
      // Check if tampered attribute or altered content exists
      recipient = (recipientConfirmed.dataset.tampered || recipientConfirmed.textContent || "").trim();
    } else if (recipientInput) {
      recipient = (recipientInput.dataset.tampered || recipientInput.value || "").trim();
    }

    // 3. Extract total amount
    const totalEl = document.querySelector('[data-webseal="total-amount"]');
    let total = totalEl ? (totalEl.textContent || "").replace(/[^\d.]/g, "") : "";

    return { recipient, total };
  }

  async function establishBaseline(stepIdx) {
    const { recipient, total } = extractDomCriticalValues();
    if (!recipient) return;

    baselineRecipient = recipient;
    baselineTotal = total;
    baselineHash = await computeSha256(`${recipient}:${total}`);

    console.log(
      `%c[Sentinel WebSeal]%c Baseline established at Step ${stepIdx}:`,
      "color:#c86244;font-weight:bold;",
      "color:#5c4a40;",
      { recipient, total, hash: baselineHash.substring(0, 16) + "..." }
    );

    window.postMessage(
      {
        type: "WEBSEAL_BASELINE_RECORDED",
        step: stepIdx,
        recipient,
        hash: baselineHash,
      },
      "*"
    );
  }

  async function evaluateDomIntegrity() {
    if (!baselineHash) {
      // If baseline was not established yet, record it now
      await establishBaseline(0);
      return true;
    }

    const current = extractDomCriticalValues();
    const currentHash = await computeSha256(`${current.recipient}:${current.total}`);

    const isMatch = currentHash === baselineHash;
    lastCheckedIntegrity = isMatch;

    if (!isMatch) {
      console.warn(
        "%c[Sentinel WebSeal]%c CRYPTOGRAPHIC MISMATCH DETECTED!",
        "background:#d9534f;color:white;font-weight:bold;padding:2px 4px;border-radius:3px;",
        "color:#d9534f;font-weight:bold;",
        {
          expectedRecipient: baselineRecipient,
          currentRecipient: current.recipient,
          expectedHash: baselineHash.substring(0, 16) + "...",
          currentHash: currentHash.substring(0, 16) + "...",
        }
      );

      window.postMessage(
        {
          type: "WEBSEAL_RESULT",
          integrity_ok: false,
          source: "CHROME_EXTENSION_MANIFEST_V3",
          reason: `Cryptographic hash mismatch: Recipient '${baselineRecipient}' was silently altered to '${current.recipient}'`,
          expected_hash: baselineHash,
          current_hash: currentHash,
          timestamp: Date.now(),
        },
        "*"
      );
    } else {
      console.log(
        "%c[Sentinel WebSeal]%c DOM Cryptographic Seal Verified OK",
        "background:#2e7d32;color:white;font-weight:bold;padding:2px 4px;border-radius:3px;",
        "color:#2e7d32;",
        { recipient: current.recipient, hash: currentHash.substring(0, 16) + "..." }
      );

      window.postMessage(
        {
          type: "WEBSEAL_RESULT",
          integrity_ok: true,
          source: "CHROME_EXTENSION_MANIFEST_V3",
          reason: "DOM fields cryptographically verified intact against Step 0 baseline.",
          hash: currentHash,
          timestamp: Date.now(),
        },
        "*"
      );
    }

    return isMatch;
  }

  // Observe step transitions & DOM mutations
  const observer = new MutationObserver(() => {
    // Check current active step
    const stepButtons = document.querySelectorAll("ol li button");
    stepButtons.forEach((btn, idx) => {
      if (btn.querySelector(".border-primary.text-primary, .border-primary.bg-primary")) {
        if (currentStep !== idx) {
          currentStep = idx;
          if (idx === 0) {
            establishBaseline(0);
          } else if (idx === 2) {
            // Reached Payment / Review step: run integrity check
            evaluateDomIntegrity();
          }
        }
      }
    });

    // If on payment step and tamper occurred on boundary
    if (currentStep === 2) {
      const boundaryEl = document.getElementById("webseal-security-boundary");
      if (boundaryEl && baselineRecipient && boundaryEl.dataset.websealRecipient !== baselineRecipient) {
        if (lastCheckedIntegrity) {
          evaluateDomIntegrity();
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-webseal-recipient", "data-tampered", "value"],
  });

  // Initial establishment after DOM mount
  setTimeout(() => {
    establishBaseline(0);
  }, 400);

  // Listen for explicit check requests from checkout (e.g. at Confirm & Pay click)
  window.addEventListener("message", (event) => {
    if (event.data?.type === "WEBSEAL_VERIFY_NOW") {
      evaluateDomIntegrity();
    }
  });
})();
