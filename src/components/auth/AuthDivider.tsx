export function AuthDivider() {
  return (
    <div className="flex items-center gap-3.5 py-5">
      <div className="h-px flex-1 bg-[linear-gradient(90deg,transparent,var(--border))]" />
      <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        or
      </span>
      <div className="h-px flex-1 bg-[linear-gradient(90deg,var(--border),transparent)]" />
    </div>
  );
}
