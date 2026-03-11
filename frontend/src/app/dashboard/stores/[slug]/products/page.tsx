import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import ProductActions from "./ProductsActions";

async function getProducts(slug: string, token: string) {
  try {
    return await apiClient(`/stores/${slug}/products`, { token });
  } catch {
    return [];
  }
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const products = await getProducts(slug, session?.access_token ?? "");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Button asChild>
          <Link href={`/dashboard/stores/${slug}/products/new`}>
            Nuevo producto
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">No hay productos todavía</p>
            <Button asChild>
              <Link href={`/dashboard/stores/${slug}/products/new`}>
                Crear primer producto
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {products.map((product: any) => (
            <Card key={product.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.category?.name ?? "Sin categoría"}
                  </p>
                  {product.portions?.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Desde ${(Math.min(...product.portions.map((p: any) => p.price)) / 100).toFixed(2)}
                    </p>
                  )}
                </div>
                <ProductActions product={product} slug={slug} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}