"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

function getNextStatus(order: any): string | null {
  switch (order.status) {
    case "PAID": return "PREPARING";
    case "PREPARING": return "READY";
    case "READY": return order.orderType === "DELIVERY" ? "OUT_FOR_DELIVERY" : "COMPLETED";
    case "OUT_FOR_DELIVERY": return "COMPLETED";
    default: return null;
  }
}

function getNextLabel(order: any): string {
  switch (order.status) {
    case "PAID": return "Iniciar preparación";
    case "PREPARING": return "Marcar listo";
    case "READY": return order.orderType === "DELIVERY" ? "Enviar a delivery" : "Completar";
    case "OUT_FOR_DELIVERY": return "Completar entrega";
    default: return "";
  }
}

export default function OrderActions({
  order,
  slug,
}: {
  order: any;
  slug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const nextStatus = getNextStatus(order);
  if (!nextStatus) return null;

  async function handleAdvance() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      await apiClient(`/stores/${slug}/orders/${order.id}/status`, {
        method: "PATCH",
        token: session?.access_token,
        body: JSON.stringify({ status: nextStatus }),
      });

      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleAdvance} disabled={loading}>
      {loading ? "..." : getNextLabel(order)}
    </Button>
  );
}