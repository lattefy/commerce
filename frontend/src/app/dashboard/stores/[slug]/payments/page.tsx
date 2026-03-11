import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ConnectMercadoPago from "./ConnectMercadoPago";

async function getPaymentSettings(slug: string, token: string) {
  try {
    return await apiClient(`/stores/${slug}/payment/status`, { token });
  } catch {
    return null;
  }
}

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const paymentSettings = await getPaymentSettings(slug, session?.access_token ?? "");

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Pagos</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mercado Pago</CardTitle>
            <Badge variant={paymentSettings?.isConnected ? "default" : "secondary"}>
              {paymentSettings?.isConnected ? "Conectado" : "No conectado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {paymentSettings?.isConnected ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Tu cuenta de Mercado Pago está conectada. Los pagos se procesarán automáticamente.
              </p>
              {paymentSettings.mpUserId && (
                <p className="text-xs text-muted-foreground">
                  ID de cuenta: {paymentSettings.mpUserId}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Conectá tu cuenta de Mercado Pago para recibir pagos online directamente en tu cuenta.
            </p>
          )}
          <ConnectMercadoPago slug={slug} isConnected={paymentSettings?.isConnected ?? false} />
        </CardContent>
      </Card>
    </div>
  );
}