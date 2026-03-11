import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OrderActions from "./OrderActions";

async function getOrders(slug: string, token: string) {
  try {
    return await apiClient(`/stores/${slug}/orders`, { token });
  } catch {
    return [];
  }
}

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente pago",
  PAID: "Pagado",
  PREPARING: "Preparando",
  READY: "Listo",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  PREPARING: "default",
  READY: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const orders = await getOrders(slug, session?.access_token ?? "");

  const activeOrders = orders.filter((o: any) =>
    ["PAID", "PREPARING", "READY"].includes(o.status)
  );
  const otherOrders = orders.filter((o: any) =>
    !["PAID", "PREPARING", "READY"].includes(o.status)
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Órdenes</h1>

      {activeOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Activas
          </h2>
          <div className="grid gap-3">
            {activeOrders.map((order: any) => (
              <Card key={order.id} className="border-l-4 border-l-primary">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">#{order.id.slice(-8)}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(order.createdAt).toLocaleString("es-UY")}
                      </p>
                      <div className="flex flex-col gap-1">
                        {order.items?.map((item: any) => (
                          <p key={item.id} className="text-sm">
                            {item.quantity}x {item.productName} — {item.portionName}
                            {item.extras?.length > 0 && (
                              <span className="text-muted-foreground">
                                {" "}(+{item.extras.map((e: any) => e.extraName).join(", ")})
                              </span>
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={statusVariant[order.status]}>
                        {statusLabel[order.status]}
                      </Badge>
                      <p className="font-semibold">${(order.total / 100).toFixed(2)}</p>
                      <OrderActions order={order} slug={slug} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Historial
        </h2>
        {otherOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay órdenes todavía</p>
        ) : (
          <div className="grid gap-2">
            {otherOrders.map((order: any) => (
              <Card key={order.id} className="opacity-70">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">#{order.id.slice(-8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("es-UY")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[order.status]}>
                      {statusLabel[order.status]}
                    </Badge>
                    <p className="text-sm font-medium">${(order.total / 100).toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}