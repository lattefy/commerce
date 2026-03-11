import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";

async function getStore(slug: string, token: string) {
  try {
    return await apiClient(`/stores/my/${slug}`, { token });
  } catch {
    return null;
  }
}

export default async function StoreDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: { session } } = await supabase.auth.getSession();
  const store = await getStore(slug, session?.access_token ?? "");

  if (!store) redirect("/dashboard");

  const role = store.role;
  const permissions = store.permissions;

  const navItems = [
    {
      label: "Resumen",
      href: `/dashboard/stores/${slug}`,
      show: true,
    },
    {
      label: "Órdenes",
      href: `/dashboard/stores/${slug}/orders`,
      show: role === "OWNER" || permissions.canManageOrders,
    },
    {
      label: "Productos",
      href: `/dashboard/stores/${slug}/products`,
      show: role === "OWNER" || permissions.canManageProducts,
    },
    {
      label: "Categorías",
      href: `/dashboard/stores/${slug}/categories`,
      show: role === "OWNER" || permissions.canManageProducts,
    },
    {
      label: "Clientes",
      href: `/dashboard/stores/${slug}/customers`,
      show: role === "OWNER",
    },
    {
      label: "Loyalty",
      href: `/dashboard/stores/${slug}/loyalty`,
      show: role === "OWNER" || permissions.canManageLoyalty,
    },
    {
      label: "Pagos",
      href: `/dashboard/stores/${slug}/payments`,
      show: role === "OWNER",
    },
    {
      label: "Empleados",
      href: `/dashboard/stores/${slug}/members`,
      show: role === "OWNER",
    },
    {
      label: "Configuración",
      href: `/dashboard/stores/${slug}/settings`,
      show: role === "OWNER" || permissions.canManageOperations,
    },
  ].filter((item) => item.show);

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r px-4 py-8 flex flex-col gap-1">
        <p className="font-semibold text-sm mb-4 truncate">{store.name}</p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm px-3 py-2 rounded-md hover:bg-accent transition-colors"
          >
            {item.label}
          </Link>
        ))}
        <div className="mt-auto">
          <Link
            href="/dashboard"
            className="text-sm px-3 py-2 rounded-md hover:bg-accent transition-colors text-muted-foreground block"
          >
            ← Mis tiendas
          </Link>
        </div>
      </aside>
      <main className="flex-1 px-8 py-8">
        {children}
      </main>
    </div>
  );
}