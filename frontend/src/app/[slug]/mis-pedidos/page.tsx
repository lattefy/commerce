"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

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

export default function MisPedidosPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      try {
        const data = await apiClient(`/stores/${slug}/orders/my`, {
          token: session?.access_token,
        });
        setOrders(data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-stone-100 hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600" />
          </button>
          <h1 className="text-xl font-extrabold text-stone-900">Mis pedidos</h1>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-stone-400 text-sm">No tenés pedidos en esta tienda todavía</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order: any) => (
              <Card key={order.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-stone-400">
                          {new Date(order.createdAt).toLocaleString("es-UY")}
                        </p>
                        <Badge variant={statusVariant[order.status]}>
                          {statusLabel[order.status]}
                        </Badge>
                      </div>
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
                    <p className="font-bold text-stone-900 shrink-0">
                      ${(order.total / 100).toFixed(2)}
                    </p>
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