"use client";

import { useRef, useEffect } from "react";
import ProductRow from "./ProductRow";

export default function ProductList({
  categories,
  products,
  onProductClick,
  onActiveCategoryChange,
}: {
  categories: any[];
  products: any[];
  onProductClick: (product: any) => void;
  onActiveCategoryChange: (id: string) => void;
}) {
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const uncategorized = products.filter((p) => !p.categoryId);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onActiveCategoryChange(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    for (const ref of Object.values(categoryRefs.current)) {
      if (ref) observer.observe(ref);
    }

    return () => observer.disconnect();
  }, [categories, onActiveCategoryChange]);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-32">
      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          {categories.map((cat) => {
            const catProducts = products.filter((p) => p.categoryId === cat.id);
            if (catProducts.length === 0) return null;
            return (
              <div
                key={cat.id}
                id={cat.id}
                ref={(el) => { categoryRefs.current[cat.id] = el; }}
                className="pt-8"
              >
                <h2 className="text-lg font-bold text-stone-900 mb-1">{cat.name}</h2>
                <div className="flex flex-col divide-y divide-stone-100">
                  {catProducts.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onClick={() => onProductClick(product)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {uncategorized.length > 0 && (
            <div
              id="uncategorized"
              ref={(el) => { categoryRefs.current["uncategorized"] = el; }}
              className="pt-8"
            >
              <h2 className="text-lg font-bold text-stone-900 mb-1">Otros</h2>
              <div className="flex flex-col divide-y divide-stone-100">
                {uncategorized.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onClick={() => onProductClick(product)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart sidebar desktop */}
        <div id="cart-sidebar" className="hidden lg:block w-80 shrink-0" />
      </div>
    </div>
  );
}