export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-display text-xl text-foreground">Weave</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Small-run garments in natural fibres, made in limited quantities and shipped from our
          Lisbon atelier.
        </p>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          &copy; {new Date().getFullYear()} Weave
        </p>
      </div>
    </footer>
  );
}
