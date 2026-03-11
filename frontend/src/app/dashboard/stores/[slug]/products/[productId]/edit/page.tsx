import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import { redirect } from "next/navigation";
import EditProductClient from "./EditProductClient";

async function getProduct(slug: string, productId: string, token: string) {
  try {
    return await apiClient(`/stores/${slug}/products/${productId}`, { token });
  } catch {
    return null;
  }
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const product = await getProduct(slug, productId, session?.access_token ?? "");
  if (!product) redirect(`/dashboard/stores/${slug}/products`);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Editar producto</h1>
      <EditProductClient slug={slug} product={product} />
    </div>
  );
}