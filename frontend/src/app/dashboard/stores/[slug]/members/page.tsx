import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import { redirect } from "next/navigation";
import MembersClient from "./MembersClient";

async function getStore(slug: string, token: string) {
  try {
    return await apiClient(`/stores/my/${slug}`, { token });
  } catch {
    return null;
  }
}

async function getMembers(slug: string, token: string) {
  try {
    return await apiClient(`/stores/${slug}/members`, { token });
  } catch {
    return [];
  }
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const store = await getStore(slug, session?.access_token ?? "");
  if (!store) redirect("/dashboard");
  if (store.role !== "OWNER") redirect(`/dashboard/stores/${slug}`);

  const members = await getMembers(slug, session?.access_token ?? "");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Empleados</h1>
      <MembersClient slug={slug} initialMembers={members} />
    </div>
  );
}