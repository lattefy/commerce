"use client";

import { CldImage } from "next-cloudinary";

export default function ProductRow({
  product,
  onClick,
  storeOpen,
}: {
  product: any;
  onClick: () => void;
  storeOpen: boolean;
}) {
  const disabled = !storeOpen;
  const minPrice = product.portions?.length
    ? Math.min(...product.portions.map((p: any) => p.price))
    : 0;
  const hasMultiple = product.portions?.length > 1;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex items-stretch gap-3 w-full text-left rounded-2xl p-3 transition-all ${
        disabled
          ? "bg-stone-50 opacity-60 cursor-not-allowed"
          : "bg-stone-100 hover:bg-stone-200 active:scale-[0.99]"
      }`}
    >
      {/* Image */}
      <div className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-white flex items-center justify-center">
        {product.images?.[0] ? (
          <CldImage
            src={product.images[0].url}
            alt={product.name}
            width={96}
            height={96}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white rounded-xl" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <p className="font-semibold text-stone-900 text-base leading-tight">
            {product.name}
          </p>
          {product.description && (
            <p className="text-xs text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between mt-2">
          <p className="text-base font-bold text-stone-900">
            $ {(minPrice / 100).toFixed(0)}
          </p>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-light shrink-0 ${
            disabled ? "bg-stone-300 text-stone-400" : "bg-stone-900 text-white"
          }`}>
            +
          </div>
        </div>
      </div>
    </button>
  );
}
