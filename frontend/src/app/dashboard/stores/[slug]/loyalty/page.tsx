import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import LoyaltyManager from "./LoyaltyManager";

async function getLoyaltySettings(slug: string, token: string) {
  try {
    return await apiClient(`/stores/${slug}/loyalty/settings`, { token });
  } catch {
    return { pesosPerPoint: 20, maxPointsPerOrder: null, pointsExpiryDays: null };
  }
}

async function getAllRewards(slug: string, token: string) {
  try {
    return await apiClient(`/stores/${slug}/loyalty/rewards/all`, { token });
  } catch {
    return [];
  }
}

export default async function LoyaltyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const [settings, rewards] = await Promise.all([
    getLoyaltySettings(slug, session?.access_token ?? ""),
    getAllRewards(slug, session?.access_token ?? ""),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Loyalty</h1>
      <LoyaltyManager slug={slug} initialSettings={settings} initialRewards={rewards} />
    </div>
  );
}