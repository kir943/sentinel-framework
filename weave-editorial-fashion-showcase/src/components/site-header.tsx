import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { SentinelToggle } from "@/components/sentinel-toggle";

export function SiteHeader() {
  const { count, sentinel, setSentinel } = useCart();


  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" search={{ tab: "women" }} className="group flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-tight text-foreground transition-colors group-hover:text-primary">
            Weave
          </span>
          <span className="hidden text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground sm:inline">
            Studio
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/" search={{ tab: "women" }} className="link-underline hover:text-foreground">
            Women
          </Link>
          <Link to="/" search={{ tab: "men" }} className="link-underline hover:text-foreground">
            Men
          </Link>
          <Link to="/" search={{ tab: "women" }} hash="atelier" className="link-underline hover:text-foreground">
            Atelier
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <SentinelToggle on={sentinel} onChange={setSentinel} />

          <Link
            to="/cart"
            className="relative inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-all hover:border-primary hover:text-primary"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Bag</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.7rem] font-medium text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

