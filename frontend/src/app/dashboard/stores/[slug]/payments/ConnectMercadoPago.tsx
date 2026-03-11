"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function ConnectMercadoPago({
  slug,
  isConnected,
}: {
  slug: string;
  isConnected: boolean;
}) {
  const searchParams = useSearchParams();
  const mpStatus = searchParams.get("mp");

  useEffect(() => {
    if (mpStatus === "connected") {
      window.history.replaceState({}, "", `/dashboard/stores/${slug}/payments`);
    }
  }, [mpStatus, slug]);

  async function handleConnect() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/login";
      return;
    }

    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/stores/${slug}/payment/connect?token=${session.access_token}`;
  }

  return (
    <div className="flex flex-col gap-2">
      {mpStatus === "connected" && (
        <p className="text-sm text-green-600">¡Cuenta conectada exitosamente!</p>
      )}
      <Button
        variant={isConnected ? "outline" : "default"}
        onClick={handleConnect}
      >
        {isConnected ? "Reconectar cuenta" : "Conectar Mercado Pago"}
      </Button>
    </div>
  );
}