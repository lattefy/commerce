"use client";

import { useParams } from "next/navigation";
import ProductForm from "../ProductForm";

export default function NewProductPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Nuevo producto</h1>
      <ProductForm slug={slug} mode="create" />
    </div>
  );
}