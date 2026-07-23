import { redirect } from 'next/navigation';

/** Корень админки ведёт на список работ; неавторизованных развернёт AdminShell. */
export default function AdminRoot() {
  redirect('/products');
}
