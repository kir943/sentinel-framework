import { Link } from "@tanstack/react-router";
import { formatPrice, type Product } from "@/data/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$productId"
      params={{ productId: product.id }}
      className="group block animate-rise"
    >
      <div className="relative overflow-hidden rounded-2xl bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={800}
          height={1000}
          className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-primary">
            {product.badge}
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 rounded-full bg-primary px-4 py-2 text-center text-xs uppercase tracking-[0.2em] text-primary-foreground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          View piece
        </span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{product.tagline}</p>
        </div>
        <p className="shrink-0 text-sm text-foreground">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
