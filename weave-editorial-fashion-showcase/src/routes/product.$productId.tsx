import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { formatPrice, getProduct, products } from "@/data/products";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$productId")({
  loader: ({ params }) => {
    const product = getProduct(params.productId);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Piece unavailable — Weave" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    const title = `${product.name} — Weave`;
    return {
      meta: [
        { title },
        { name: "description", content: product.description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: product.tagline },
      ],
    };
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0] ?? "One size");
  const [color, setColor] = useState(product.colors[0] ?? "Natural");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleAdd = (goToCart: boolean) => {
    addItem({ productId: product.id, size, color, quantity });
    if (goToCart) {
      navigate({ to: "/cart" });
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <Link
        to="/"
        search={{ tab: product.category }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to collection
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-secondary">
          <img
            src={product.image}
            alt={product.name}
            width={800}
            height={1000}
            className="aspect-[4/5] w-full object-cover"
          />
        </div>

        <div className="animate-rise">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">{product.category}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{product.tagline}</p>
          <p className="mt-5 text-2xl text-foreground">{formatPrice(product.price)}</p>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Colour</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`rounded-full border px-4 py-2 text-xs transition-all ${
                    color === c
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`min-w-12 rounded-lg border px-3 py-2 text-sm transition-all ${
                    size === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary/60"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center rounded-full border border-border">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-3 text-muted-foreground transition-colors hover:text-primary"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(9, q + 1))}
                className="p-3 text-muted-foreground transition-colors hover:text-primary"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleAdd(false)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.18em] text-primary-foreground transition-all hover:bg-primary/90"
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added
                </>
              ) : (
                "Add to bag"
              )}
            </button>
            <button
              type="button"
              onClick={() => handleAdd(true)}
              className="rounded-full border border-border px-6 py-3 text-sm uppercase tracking-[0.18em] text-foreground transition-all hover:border-primary hover:text-primary"
            >
              Buy now
            </button>
          </div>

          <dl className="mt-10 space-y-3 border-t border-border pt-6 text-sm">
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted-foreground">Material</dt>
              <dd className="text-foreground">{product.material}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted-foreground">Care</dt>
              <dd className="text-foreground">{product.care}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-secondary p-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-6">
            <span className="inline-flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Ships in 2–4 days
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> 3-year free repairs
            </span>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-2xl text-foreground">Wears well with</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
