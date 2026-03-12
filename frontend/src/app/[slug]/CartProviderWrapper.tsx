"use client";

import { CartProvider } from "./CartContext";

export default function CartProviderWrapper({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <CartProvider slug={slug}>{children}</CartProvider>;
}
