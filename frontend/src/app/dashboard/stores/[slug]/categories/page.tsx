import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import CategoryManager from "./CategoryManager";

async function getCategories(slug: string, token: string) {
  try {
    return await apiClient(`/stores/${slug}/categories`, { token });
  } catch {
    return [];
  }
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const categories = await getCategories(slug, session?.access_token ?? "");

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categorías</h1>
      </div>
      <CategoryManager slug={slug} initialCategories={categories} />
    </div>
  );
}