import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminStoreActions from "./AdminStoreActions";

async function getPendingStores(token: string) {
  try {
    return await apiClient("/admin/stores/pending", { token });
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: { session } } = await supabase.auth.getSession();
  const stores = await getPendingStores(session?.access_token ?? "");

  if (stores === null) redirect("/dashboard");

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <p className="text-muted-foreground">Tiendas pendientes de aprobación</p>
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No hay tiendas pendientes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {stores.map((store: any) => (
            <Card key={store.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{store.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{store.slug}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Solicitado por: {store.requestedBy?.name ?? store.requestedBy?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Pendiente</Badge>
                    <AdminStoreActions storeId={store.id} />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}