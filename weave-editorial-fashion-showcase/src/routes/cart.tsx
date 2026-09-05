import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { formatPrice } from "@/data/products";
import { FREE_SHIPPING_THRESHOLD, SENTINEL_FEE, useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — Weave" },
      {
        name: "description",
        content: "Review the pieces in your Weave bag, adjust sizes and add Sentinel Protection.",
      },
      { property: "og:title", content: "Your Bag — Weave" },
      { property: "og:description", content: "Review the pieces in your Weave bag." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const {
    lines,
    subtotal,
    shipping,
    sentinel,
    setSentinel,
    sentinelCost,
    total,
    updateQuantity,
    removeItem,
  } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-24 text-center sm:px-8">
        <h1 className="font-display text-4xl text-foreground">Your bag is empty</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing here yet. The autumn edit is twelve pieces deep.
        </p>
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

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <h1 className="font-display text-4xl text-foreground sm:text-5xl">Your bag</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {remaining > 0
          ? `${formatPrice(remaining)} away from free shipping.`
          : "You have unlocked free shipping."}
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <ul className="divide-y divide-border border-y border-border">
          {lines.map((line) => (
            <li
              key={`${line.productId}-${line.size}-${line.color}`}
              className="flex gap-4 py-6 animate-rise"
            >
              <Link
                to="/product/$productId"
                params={{ productId: line.productId }}
                className="shrink-0 overflow-hidden rounded-xl bg-secondary"
              >
                <img
                  src={line.product.image}
                  alt={line.product.name}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="h-32 w-24 object-cover transition-transform duration-500 hover:scale-105 sm:h-40 sm:w-32"
                />
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to="/product/$productId"
                      params={{ productId: line.productId }}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      {line.product.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {line.color} · Size {line.size}
                    </p>
                  </div>
                  <p className="text-sm text-foreground">{formatPrice(line.lineTotal)}</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        updateQuantity(line.productId, line.size, line.color, line.quantity - 1)
                      }
                      className="p-2.5 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() =>
                        updateQuantity(line.productId, line.size, line.color, line.quantity + 1)
                      }
                      className="p-2.5 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(line.productId, line.size, line.color)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl bg-secondary p-6 lg:sticky lg:top-24">
          <button
            type="button"
            onClick={() => setSentinel(!sentinel)}
            aria-pressed={sentinel}
            className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
              sentinel
                ? "border-[var(--sentinel)]/50 bg-[var(--sentinel)]/5 shadow-[0_10px_30px_-18px_var(--sentinel)]"
                : "border-border bg-background hover:border-primary/50"
            }`}
          >
            <span
              className={`mt-0.5 rounded-xl p-2 transition-colors ${
                sentinel ? "bg-[var(--sentinel)] text-white" : "bg-secondary text-muted-foreground"
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">Sentinel Protection</span>
                <span className="text-xs font-medium text-[var(--sentinel)]">
                  Included
                </span>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                Continuous UI integrity seals, session attestation &amp; real-time behavioral verification.
              </span>
              <span
                className={`mt-3 inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                  sentinel ? "bg-[var(--sentinel)]" : "bg-border"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-300 ${
                    sentinel ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </span>
            </span>
          </button>

          <dl className="mt-6 space-y-3 text-sm">
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
            <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
              <dt className="text-foreground">Total</dt>
              <dd className="text-foreground">{formatPrice(total)}</dd>
            </div>
          </dl>

          {sentinel && (
            <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-background/80 py-2 text-xs font-medium text-[var(--sentinel)]">
              <ShieldCheck className="h-4 w-4" /> ✓ Sentinel Protection included
            </p>
          )}

          <Link
            to="/checkout"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.18em] text-primary-foreground transition-all hover:bg-primary/90"
          >
            Checkout
          </Link>
          <Link
            to="/"
            search={{ tab: "women" }}
            className="mt-3 block text-center text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
