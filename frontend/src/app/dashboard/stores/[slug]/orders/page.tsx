import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import OrdersClient from "./OrdersClient";

async function getOrders(slug: string, token: string) {
  try {
    return await apiClient(`/stores/${slug}/orders`, { token });
  } catch {
    return [];
  }
}

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const orders = await getOrders(slug, session?.access_token ?? "");

  return <OrdersClient orders={orders} slug={slug} />;
}
