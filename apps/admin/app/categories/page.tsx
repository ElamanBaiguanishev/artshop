'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/lib/admin-api';
import { cn } from '@/lib/utils';
import type { AdminCategory } from '@artshop/shared';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Shuffle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const SWATCHES = [
  'oklch(0.55 0.09 250)',
  'oklch(0.6 0.11 150)',
  'oklch(0.62 0.1 70)',
  'oklch(0.58 0.2 27)',
  'oklch(0.55 0.13 300)',
  'oklch(0.55 0.02 260)',
];
const DEFAULT_COLOR = 'oklch(0.55 0.09 250)';

const CUSTOMS_LABEL: Record<string, string> = {
  original_art: 'Оригинал искусства',
  souvenir: 'Сувенир',
};

type FormState = {
  name: string;
  slug: string;
  color: string;
  customsCategory: 'original_art' | 'souvenir';
  isFragileDefault: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  color: DEFAULT_COLOR,
  customsCategory: 'souvenir',
  isFragileDefault: false,
};

export default function CategoriesPage() {
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // диалог создания/редактирования
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  // диалог переноса товаров
  const [reassignFrom, setReassignFrom] = useState<AdminCategory | null>(null);
  const [reassignTo, setReassignTo] = useState('');

  async function reload() {
    const list = await adminApi.listCategories();
    setCats(list);
    return list;
  }

  useEffect(() => {
    adminApi
      .listCategories()
      .then(setCats)
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(c: AdminCategory) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      color: c.color ?? DEFAULT_COLOR,
      customsCategory: c.customsCategory,
      isFragileDefault: c.isFragileDefault,
    });
    setFormOpen(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await adminApi.updateCategory(editing.id, {
          name: form.name,
          slug: form.slug || undefined,
          color: form.color,
          customsCategory: form.customsCategory,
          isFragileDefault: form.isFragileDefault,
        });
        toast.success('Тип обновлён');
      } else {
        await adminApi.createCategory({
          name: form.name,
          slug: form.slug || undefined,
          color: form.color,
          customsCategory: form.customsCategory,
          isFragileDefault: form.isFragileDefault,
        });
        toast.success('Тип создан');
      }
      setFormOpen(false);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? cleanErr(err.message) : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(c: AdminCategory) {
    await adminApi.updateCategory(c.id, { isActive: !c.isActive });
    toast.success(c.isActive ? 'Тип скрыт' : 'Тип возвращён');
    await reload();
  }

  async function move(c: AdminCategory, dir: -1 | 1) {
    const ordered = [...cats].sort((a, b) => a.position - b.position);
    const idx = ordered.findIndex((x) => x.id === c.id);
    const neighbour = ordered[idx + dir];
    if (!neighbour) return;
    // меняем позиции местами
    await Promise.all([
      adminApi.updateCategory(c.id, { position: neighbour.position }),
      adminApi.updateCategory(neighbour.id, { position: c.position }),
    ]);
    await reload();
  }

  async function remove(c: AdminCategory) {
    if (c.productsCount > 0) {
      // есть товары — сперва предложим перенос
      setReassignFrom(c);
      setReassignTo('');
      return;
    }
    if (!confirm(`Удалить тип «${c.name}»? Это действие необратимо.`)) return;
    try {
      await adminApi.deleteCategory(c.id);
      toast.success('Тип удалён');
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? cleanErr(err.message) : 'Не удалось удалить');
    }
  }

  async function doReassign() {
    if (!reassignFrom || !reassignTo) return;
    setBusy(true);
    try {
      const { moved } = await adminApi.reassignCategory(reassignFrom.id, reassignTo);
      toast.success(`Перенесено товаров: ${moved}`);
      setReassignFrom(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? cleanErr(err.message) : 'Не удалось перенести');
    } finally {
      setBusy(false);
    }
  }

  const ordered = [...cats].sort((a, b) => a.position - b.position);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-2xl">Типы товаров</h1>
          {!loading && <span className="text-sm text-muted-foreground">{cats.length}</span>}
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Добавить тип
        </Button>
      </div>

      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Типы, по которым раскладываются работы. Скрытый тип не предлагается для новых работ и не
        виден в фильтрах на сайте, но существующие работы его сохраняют. Удалить можно только тип
        без работ — иначе сначала перенесите их.
      </p>

      {loading ? (
        <div className="mt-6 flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border bg-card">
          <div className="flex flex-col divide-y">
            {ordered.map((c, i) => (
              <div
                key={c.id}
                className={cn(
                  'flex items-center gap-3 p-3',
                  !c.isActive && 'bg-muted/40 text-muted-foreground',
                )}
              >
                <span
                  className="size-3 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                  style={{ background: c.color ?? 'var(--muted-foreground)' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{c.name}</span>
                    {!c.isActive && (
                      <Badge variant="outline" className="shrink-0">
                        скрыт
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    /{c.slug} · {CUSTOMS_LABEL[c.customsCategory]}
                    {c.isFragileDefault ? ' · хрупкое' : ''}
                  </p>
                </div>

                <Badge variant="secondary" className="shrink-0">
                  {c.productsCount} работ
                </Badge>

                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Выше"
                    disabled={i === 0}
                    onClick={() => move(c, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Ниже"
                    disabled={i === ordered.length - 1}
                    onClick={() => move(c, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Редактировать"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  {c.productsCount > 0 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Перенести товары"
                      onClick={() => {
                        setReassignFrom(c);
                        setReassignTo('');
                      }}
                    >
                      <Shuffle className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={c.isActive ? 'Скрыть' : 'Вернуть'}
                    onClick={() => toggleActive(c)}
                  >
                    {c.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Удалить"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(c)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* создание / редактирование */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Изменить тип' : 'Новый тип'}</DialogTitle>
            <DialogDescription>
              Название видно в фильтрах и на работах. Дефолты применяются к новым работам этого
              типа.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitForm} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-name">Название</Label>
              <Input
                id="cat-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Открытки"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-slug">Адрес (необязательно)</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="генерируется из названия"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Цвет</Label>
              <div className="flex gap-2">
                {SWATCHES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-label="Выбрать цвет"
                    onClick={() => setForm({ ...form, color: s })}
                    className={cn(
                      'size-7 rounded-full ring-1 ring-inset ring-black/10 transition-transform',
                      form.color === s &&
                        'ring-2 ring-primary ring-offset-2 ring-offset-background',
                    )}
                    style={{ background: s }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Таможня по умолчанию</Label>
              <Select
                value={form.customsCategory}
                onValueChange={(v) =>
                  setForm({ ...form, customsCategory: v as FormState['customsCategory'] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="souvenir">Сувенир</SelectItem>
                  <SelectItem value="original_art">Оригинал искусства</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Label className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={form.isFragileDefault}
                onCheckedChange={(v) => setForm({ ...form, isFragileDefault: v === true })}
              />
              Хрупкое по умолчанию
            </Label>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Сохраняем…' : editing ? 'Сохранить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* перенос товаров перед архивом/удалением */}
      <Dialog open={reassignFrom !== null} onOpenChange={(o) => !o && setReassignFrom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Перенести работы</DialogTitle>
            <DialogDescription>
              У типа «{reassignFrom?.name}» есть {reassignFrom?.productsCount} работ. Выберите тип,
              куда их перенести — после этого тип можно удалить.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label>Перенести в</Label>
            <Select value={reassignTo} onValueChange={setReassignTo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                {cats
                  .filter((c) => c.id !== reassignFrom?.id)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setReassignFrom(null)}>
              Отмена
            </Button>
            <Button onClick={doReassign} disabled={busy || !reassignTo}>
              {busy ? 'Переносим…' : 'Перенести'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Ошибка из API приходит как "409: {json}" — вытащим человекочитаемое. */
function cleanErr(msg: string): string {
  const m = msg.match(/"message":"([^"]+)"/);
  return m?.[1] ?? msg.replace(/^\d+:\s*/, '');
}
