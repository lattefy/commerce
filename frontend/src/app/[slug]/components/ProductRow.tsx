"use client";

import { CldImage } from "next-cloudinary";

export default function ProductRow({
  product,
  onClick,
}: {
  product: any;
  onClick: () => void;
}) {
  const minPrice = product.portions?.length
    ? Math.min(...product.portions.map((p: any) => p.price))
    : 0;
  const hasMultiple = product.portions?.length > 1;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 py-4 text-left w-full group hover:bg-stone-50 -mx-2 px-2 rounded-xl transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-900 text-sm">
          {product.name}
        </p>
        {product.description && (
          <p className="text-xs text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <p className="text-sm font-bold text-stone-800 mt-1.5">
          {hasMultiple && (
            <span className="text-xs font-normal text-stone-400 mr-1">desde</span>
          )}
          ${(minPrice / 100).toFixed(0)}
        </p>
      </div>

      <div className="shrink-0 relative">
        {product.images?.[0] ? (
          <CldImage
            src={product.images[0].url}
            alt={product.name}
            width={88}
            height={88}
            className="w-20 h-20 rounded-xl object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-stone-100 flex items-center justify-center text-2xl">
            🍽️
          </div>
        )}
        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-stone-900 rounded-full flex items-center justify-center text-white text-lg font-light shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
          +
        </div>
      </div>
    </button>
  );
}