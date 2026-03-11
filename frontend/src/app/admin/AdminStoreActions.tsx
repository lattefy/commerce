"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function AdminStoreActions({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleAction(action: "approve" | "reject") {
    setLoading(action);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      await apiClient(`/admin/stores/${storeId}/${action}`, {
        method: "POST",
        token: session?.access_token,
      });

      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
      >
        {loading === "approve" ? "Aprobando..." : "Aprobar"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
      >
        {loading === "reject" ? "Rechazando..." : "Rechazar"}
      </Button>
    </div>
  );
}