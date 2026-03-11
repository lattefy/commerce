"use client";

import ProductForm from "../../ProductForm";

export default function EditProductClient({
  slug,
  product,
}: {
  slug: string;
  product: any;
}) {
  return (
    <ProductForm
      slug={slug}
      mode="edit"
      initialData={{
        id: product.id,
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        portions: product.portions,
        extras: product.extras,
        images: product.images,
      }}
    />
  );
}