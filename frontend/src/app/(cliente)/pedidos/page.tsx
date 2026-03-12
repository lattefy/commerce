import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente pago",
  PAID: "Pagado",
  PREPARING: "Preparando",
  READY: "Listo",
  OUT_FOR_DELIVERY: "En camino",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  PREPARING: "default",
  READY: "default",
  OUT_FOR_DELIVERY: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

async function getMyOrders(token: string) {
  try {
    return await apiClient("/me/orders", { token });
  } catch {
    return [];
  }
}

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const orders = await getMyOrders(session?.access_token ?? "");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-stone-900 mb-6">Mis pedidos</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-stone-400">No tenés pedidos todavía</p>
          <Link
            href="/tiendas"
            className="text-sm font-medium text-stone-900 underline underline-offset-2"
          >
            Ver tiendas
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order: any) => (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-stone-900 text-sm">
                        {order.store?.name}
                      </p>
                      <Badge variant={statusVariant[order.status]}>
                        {statusLabel[order.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-400">
                      {new Date(order.createdAt).toLocaleString("es-UY")}
                    </p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      {order.items?.map((item: any) => (
                        <p key={item.id} className="text-sm text-stone-600">
                          {item.quantity}x {item.productName} — {item.portionName}
                          {item.extras?.length > 0 && (
                            <span className="text-stone-400">
                              {" "}(+{item.extras.map((e: any) => e.extraName).join(", ")})
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-stone-900">
                      ${(order.total / 100).toFixed(2)}
                    </p>
                    <Link
                      href={`/${order.store?.slug}`}
                      className="text-xs text-stone-400 hover:text-stone-600 transition-colors mt-1 block"
                    >
                      Ver tienda →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}