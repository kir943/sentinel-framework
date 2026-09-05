export function SentinelToggle({
  on,
  onChange,
  className = "",
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  className?: string;
}) {
  const handleToggle = () => {
    onChange(!on);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Sentinel Protection"
      title={on ? "Sentinel: All Systems Sealed (Click to turn off)" : "Sentinel Protection (Click to activate)"}
      onClick={handleToggle}
      className={`group relative inline-flex items-center gap-2 border-b py-1 text-[0.65rem] uppercase tracking-[0.2em] transition-all ${
        on
          ? "border-[var(--sentinel)]/40 text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      } ${className}`}
    >
      {on ? (
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <span className="h-2 w-2 rounded-full bg-[var(--sentinel)] shadow-[0_0_8px_var(--sentinel)] animate-pulse" />
          <span className="hidden sm:inline tracking-[0.22em]">SENTINEL: ALL SYSTEMS SEALED</span>
          <span className="sm:hidden tracking-[0.18em]">SEALED</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          <span>Sentinel</span>
        </span>
      )}

      {/* Switch Track */}
      <span
        className={`inline-flex h-4 w-8 items-center rounded-full p-0.5 transition-colors duration-300 ${
          on ? "bg-[var(--sentinel)]" : "bg-border"
        }`}
      >
        <span
          className={`h-3 w-3 rounded-full bg-background shadow-sm transition-transform duration-300 ${
            on ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
