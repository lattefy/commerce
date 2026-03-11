"use client";

import { useEffect, useRef } from "react";

export default function CategoryPills({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: { id: string; name: string }[];
  activeCategory: string | null;
  onSelect: (id: string) => void;
}) {
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeCategory || !pillsRef.current) return;
    const pill = pillsRef.current.querySelector(
      `[data-cat="${activeCategory}"]`
    ) as HTMLElement;
    if (pill) {
      pill.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-14 z-30 bg-white border-b border-stone-100">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div
          ref={pillsRef}
          className="flex gap-2 overflow-x-auto py-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              data-cat={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-all duration-200 ${
                activeCategory === cat.id
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}