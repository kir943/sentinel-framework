import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { products, type Category } from "@/data/products";
import { ProductCard } from "@/components/product-card";
import heroImage from "@/assets/hero.jpg";

type IndexSearch = { tab: Category };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    tab: search['tab'] === "men" ? "men" : "women",
  }),
  head: () => ({
    meta: [
      { title: "Weave — Small-Run Clothing in Natural Fibres" },
      {
        name: "description",
        content:
          "Weave makes limited-run linen, wool and cotton pieces for men and women. Shop the current collection from our Lisbon atelier.",
      },
      { property: "og:title", content: "Weave — Small-Run Clothing in Natural Fibres" },
      {
        property: "og:description",
        content: "Limited-run linen, wool and cotton pieces for men and women.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const list = products.filter((p) => p.category === tab);

  return (
    <div>
      <section className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8 sm:pt-16">
        <div className="grid items-center gap-8 md:grid-cols-[1.05fr_1fr]">
          <div className="animate-rise">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">Autumn Edit 2026</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Clothes that
              <span className="block italic text-primary">soften with time</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Linen, wool and long-staple cotton, cut in small runs and finished by hand. No season
              chasing — just twelve pieces we would wear every day.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#collection"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.18em] text-primary-foreground transition-all hover:gap-3 hover:bg-primary/90"
              >
                Shop the edit <ArrowRight className="h-4 w-4" />
              </a>
              <span className="text-sm text-muted-foreground">Free shipping over $250</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-secondary">
            <img
              src={heroImage}
              alt="Model in an oversized linen shirt and wide trousers on a cream backdrop"
              width={1600}
              height={1100}
              className="aspect-[4/3] w-full object-cover md:aspect-[5/6]"
            />
          </div>
        </div>
      </section>

      <section id="collection" className="mx-auto w-full max-w-6xl px-5 pt-20 sm:px-8">
        <div className="flex flex-col gap-5 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl text-foreground sm:text-4xl">The Collection</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {list.length} pieces · restocked monthly
            </p>
          </div>
          <div className="inline-flex self-start rounded-full border border-border bg-secondary p-1">
            {(["women", "men"] as Category[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => navigate({ search: { tab: c } })}
                className={`rounded-full px-6 py-2 text-xs uppercase tracking-[0.2em] transition-all ${
                  tab === c
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
          {list.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section id="atelier" className="mx-auto mt-24 w-full max-w-6xl px-5 sm:px-8">
        <div className="rounded-3xl bg-secondary px-6 py-12 sm:px-12">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Made in small runs",
                body: "Between 80 and 200 units per style. When a piece sells out, it rests until the next run.",
              },
              {
                title: "Natural fibres only",
                body: "European flax, merino, organic cotton. Nothing blended with plastic for cost.",
              },
              {
                title: "Repaired, not replaced",
                body: "Send anything back within three years and our atelier will mend it, free.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="font-display text-xl text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link
              to="/cart"
              className="link-underline text-sm uppercase tracking-[0.2em] text-primary"
            >
              Review your bag
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
