import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import { redirect } from "next/navigation";
import StoreSettingsForm from "./StoreSettingsForm";

async function getStore(slug: string, token: string) {
  try {
    return await apiClient(`/stores/my/${slug}`, { token });
  } catch {
    return null;
  }
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const store = await getStore(slug, session?.access_token ?? "");
  if (!store) redirect("/dashboard");

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      <StoreSettingsForm
        slug={slug}
        store={store}
        role={store.role}
        permissions={store.permissions}
      />
    </div>
  );
}