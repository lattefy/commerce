"use client";

import React from "react";
import { useState, useCallback } from "react";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import StoreNavbar from "./components/StoreNavbar";
import StoreHero from "./components/StoreHero";
import CategoryPills from "./components/CategoryPills";
import ProductList from "./components/ProductList";
import ProductModal from "./components/ProductModal";
import CartSheet from "./components/CartSheet";
import CartButton from "./components/CartButton";
import Cart from "./Cart";

function isOpenNow(schedule: any): boolean {
  if (!schedule) return false;
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const now = new Date();
  const dayKey = days[now.getDay()];
  const day = schedule[dayKey];
  if (!day || day.closed) return false;
  const [openH, openM] = day.open.split(":").map(Number);
  const [closeH, closeM] = day.close.split(":").map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  const open = openH * 60 + openM;
  const close = closeH * 60 + closeM;
  return current >= open && current < close;
}

export default function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const router = useRouter();

  const [store, setStore] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=/${slug}`);
        return;
      }

      try {
        const [storeData, catsData, prodsData] = await Promise.all([
          apiClient(`/stores/${slug}`),
          apiClient(`/stores/${slug}/categories`),
          apiClient(`/stores/${slug}/products`),
        ]);
        setStore(storeData);
        setCategories(catsData);
        setProducts(prodsData.filter((p: any) => p.status === "AVAILABLE"));
        setActiveCategory(catsData[0]?.id ?? null);
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, router]);

  const handleActiveCategoryChange = useCallback((id: string) => {
    setActiveCategory(id);
  }, []);

  function scrollToCategory(id: string) {
    const el = document.getElementById(id);
    if (el) {
      const offset = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
    setActiveCategory(id);
  }

  if (loading || !store) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  const open = isOpenNow(store.schedule);

  const allCategories = [
    ...categories,
    ...(products.some((p) => !p.categoryId)
      ? [{ id: "uncategorized", name: "Otros" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <StoreNavbar
        storeName={store.name}
        slug={slug}
        onCartClick={() => setCartOpen(true)}
      />

      <div className="bg-white">
        <StoreHero store={store} open={open} />
        <CategoryPills
          categories={allCategories}
          activeCategory={activeCategory}
          onSelect={scrollToCategory}
        />
      </div>

      <div className="bg-stone-50">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pb-32">
          <div className="flex gap-8">
            {/* Products */}
            <div className="flex-1 min-w-0">
              <ProductList
                categories={categories}
                products={products}
                onProductClick={setSelectedProduct}
                onActiveCategoryChange={handleActiveCategoryChange}
              />
            </div>

            {/* Cart sidebar desktop */}
            <div className="hidden lg:block w-80 shrink-0">
              <div className="sticky top-28 pt-8">
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
                    <span className="text-lg">🛒</span>
                    <h2 className="font-bold text-stone-900">Mi Carrito</h2>
                  </div>
                  <div className="px-5 py-4">
                    <Cart slug={slug} store={store} onClose={() => {}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-xs text-stone-300 font-medium tracking-wide bg-stone-50">
        POWERED BY <span className="font-bold text-stone-400">LATTEFY</span>
      </div>

      <CartButton onClick={() => setCartOpen(true)} />

      <CartSheet
        slug={slug}
        store={store}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}