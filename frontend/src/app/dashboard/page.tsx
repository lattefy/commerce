import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function getMyStores(token: string) {
  try {
    return await apiClient("/stores/my", { token });
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: { session } } = await supabase.auth.getSession();
  const stores = await getMyStores(session?.access_token ?? "");

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Mis tiendas</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/stores/new">Nueva tienda</Link>
        </Button>
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">No tenés tiendas todavía</p>
            <Button asChild>
              <Link href="/dashboard/stores/new">Crear tu primera tienda</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {stores.map((store: any) => (
            <div key={store.id}>
              {store.status === "APPROVED" ? (
                <Link href={`/dashboard/stores/${store.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{store.name}</CardTitle>
                        <Badge>Activa</Badge>
                      </div>
                      <CardDescription>{store.slug}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ) : (
                <Card className="opacity-70">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{store.name}</CardTitle>
                      <Badge variant={store.status === "PENDING" ? "secondary" : "destructive"}>
                        {store.status === "PENDING" ? "Pendiente aprobación" : "Rechazada"}
                      </Badge>
                    </div>
                    <CardDescription>{store.slug}</CardDescription>
                    {store.status === "PENDING" && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Tu tienda está siendo revisada. Te notificaremos cuando sea aprobada.
                      </p>
                    )}
                    {store.status === "REJECTED" && (
                      <p className="text-sm text-destructive mt-1">
                        Tu tienda fue rechazada. Contactá a soporte para más información.
                      </p>
                    )}
                  </CardHeader>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}