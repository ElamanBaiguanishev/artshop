const swatches = [
  { name: 'фон', var: '--bg-base' },
  { name: 'карточка', var: '--surface-card' },
  { name: 'акцент', var: '--primary' },
  { name: 'в наличии', var: '--status-available' },
  { name: 'продано', var: '--status-sold' },
  { name: 'под заказ', var: '--status-order' },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-24">
      <p className="eyebrow mb-4">каркас проекта</p>

      <h1 className="text-[length:var(--text-4xl)]">Алия</h1>

      <p className="mt-6 max-w-[var(--container-read)] text-[length:var(--text-lg)] text-muted-foreground">
        Токены дизайн-системы подключены. Витрина, каталог и админка появляются на этапе 1 — см.
        docs/roadmap.md.
      </p>

      <div className="mt-16 flex flex-wrap gap-6">
        {swatches.map((s) => (
          <div key={s.var} className="flex flex-col gap-2">
            <div
              className="size-16 rounded-[var(--radius-md)] border border-border"
              style={{ background: `var(${s.var})` }}
            />
            <span className="text-[length:var(--text-xs)] text-muted-foreground">{s.name}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
