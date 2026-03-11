"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star } from "lucide-react";

export default function MisPuntosPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      try {
        const [balanceData, rewardsData] = await Promise.all([
          apiClient(`/stores/${slug}/loyalty/balance`, { token: session?.access_token }),
          apiClient(`/stores/${slug}/loyalty/rewards`),
        ]);
        setBalance(balanceData.balance);
        setRewards(rewardsData.filter((r: any) => r.isActive));
      } catch {
        setBalance(0);
        setRewards([]);
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
          <h1 className="text-xl font-extrabold text-stone-900">Mis puntos</h1>
        </div>

        {/* Balance */}
        <div className="bg-stone-900 text-white rounded-2xl px-6 py-8 flex items-center justify-between mb-6">
          <div>
            <p className="text-stone-400 text-sm mb-1">Puntos disponibles</p>
            <p className="text-4xl font-extrabold">{balance}</p>
          </div>
          <Star className="w-10 h-10 text-stone-600 fill-stone-600" />
        </div>

        {/* Rewards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rewards disponibles</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {rewards.length === 0 ? (
              <p className="text-sm text-stone-400">No hay rewards disponibles todavía</p>
            ) : (
              rewards.map((reward: any) => {
                const canRedeem = (balance ?? 0) >= reward.pointsCost;
                return (
                  <div
                    key={reward.id}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${
                      canRedeem
                        ? "border-stone-200 bg-white"
                        : "border-stone-100 bg-stone-50 opacity-50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-900">{reward.name}</p>
                      {reward.description && (
                        <p className="text-xs text-stone-400">{reward.description}</p>
                      )}
                    </div>
                    <Badge variant={canRedeem ? "default" : "secondary"}>
                      {reward.pointsCost} pts
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}