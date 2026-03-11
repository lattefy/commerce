import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getOrders(slug: string, token: string) {
  try {
    return await apiClient(`/stores/${slug}/orders`, { token });
  } catch {
    return [];
  }
}

export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const orders = await getOrders(slug, session?.access_token ?? "");

  const todayOrders = orders.filter((o: any) => {
    const orderDate = new Date(o.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayOrders
    .filter((o: any) => o.status === "PAID" || o.status === "COMPLETED")
    .reduce((sum: number, o: any) => sum + o.total, 0);

  const pendingOrders = orders.filter((o: any) => o.status === "PAID").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Resumen</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Órdenes hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todayOrders.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${(todayRevenue / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Órdenes pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingOrders}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold mb-4">Órdenes recientes</h2>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">No hay órdenes todavía</p>
      ) : (
        <div className="grid gap-2">
          {orders.slice(0, 5).map((order: any) => (
            <Card key={order.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium text-sm">#{order.id.slice(-8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString("es-UY")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${(order.total / 100).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{order.status}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}