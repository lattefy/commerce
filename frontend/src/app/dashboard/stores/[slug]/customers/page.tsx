import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import CustomersClient from "./CustomersClient";

async function getCustomers(slug: string, token: string) {
  try {
    return await apiClient(`/stores/my/${slug}/customers`, { token });
  } catch {
    return [];
  }
}

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const customers = await getCustomers(slug, session?.access_token ?? "");

  return <CustomersClient slug={slug} initialCustomers={customers} />;
}