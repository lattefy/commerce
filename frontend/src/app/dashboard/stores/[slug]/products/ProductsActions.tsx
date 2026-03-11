"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ProductActions({
  product,
  slug,
}: {
  product: any;
  slug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const newStatus = product.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";

      await apiClient(`/stores/${slug}/products/${product.id}`, {
        method: "PATCH",
        token: session?.access_token,
        body: JSON.stringify({ status: newStatus }),
      });

      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={product.status === "AVAILABLE" ? "default" : "secondary"}>
        {product.status === "AVAILABLE" ? "Disponible" : product.status === "DRAFT" ? "Borrador" : "No disponible"}
      </Badge>
      <Button size="sm" variant="outline" onClick={toggleStatus} disabled={loading}>
        {product.status === "AVAILABLE" ? "Pausar" : "Activar"}
      </Button>
      <Button size="sm" variant="outline" asChild>
        <Link href={`/dashboard/stores/${slug}/products/${product.id}/edit`}>
          Editar
        </Link>
      </Button>
    </div>
  );
}