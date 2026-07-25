import Link from 'next/link';

const NAV = [
  { href: '/works', label: 'Работы' },
  { href: '/about', label: 'Об авторе' },
  { href: '/delivery', label: 'Доставка' },
];

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-[var(--z-header)] border-b border-border backdrop-blur"
      style={{ background: 'oklch(0.967 0.008 74 / 0.88)' }}
    >
      <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--container)] items-center justify-between px-5 md:px-10">
        <Link
          href="/"
          className="text-[length:var(--text-xl)]"
          style={{ fontFamily: 'var(--font-serif)', letterSpacing: 'var(--tracking-tight)' }}
        >
          artshop
        </Link>

        <nav className="flex items-center gap-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[length:var(--text-sm)] text-muted-foreground transition-colors hover:text-[var(--primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
