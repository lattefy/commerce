import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Star } from "lucide-react";

async function getMyLoyalty(token: string) {
  try {
    return await apiClient("/me/loyalty", { token });
  } catch {
    return [];
  }
}

export default async function PuntosPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const loyalty = await getMyLoyalty(session?.access_token ?? "");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-stone-900 mb-2">Mis puntos</h1>
      <p className="text-stone-400 text-sm mb-6">
        Acumulás puntos en cada tienda por separado
      </p>

      {loyalty.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-stone-400">Todavía no tenés puntos acumulados</p>
          <Link
            href="/tiendas"
            className="text-sm font-medium text-stone-900 underline underline-offset-2"
          >
            Ir a comprar
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {loyalty.map((entry: any) => (
            <Card key={entry.store.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{entry.store.name}</CardTitle>
                  <div className="flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 rounded-full text-sm font-bold">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    {entry.points} pts
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {entry.store.rewards?.length === 0 ? (
                  <p className="text-xs text-stone-400">Esta tienda no tiene rewards disponibles</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                      Rewards disponibles
                    </p>
                    {entry.store.rewards?.map((reward: any) => {
                      const canRedeem = entry.points >= reward.pointsCost;
                      return (
                        <div
                          key={reward.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                            canRedeem
                              ? "border-stone-200 bg-white"
                              : "border-stone-100 bg-stone-50 opacity-50"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-stone-900">
                              {reward.name}
                            </p>
                            {reward.description && (
                              <p className="text-xs text-stone-400">{reward.description}</p>
                            )}
                          </div>
                          <Badge variant={canRedeem ? "default" : "secondary"}>
                            {reward.pointsCost} pts
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
                <Link
                  href={`/stores/${entry.store.slug}`}
                  className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Ir a la tienda →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}