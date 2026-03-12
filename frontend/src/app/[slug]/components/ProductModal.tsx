"use client";

import { useState } from "react";
import { useCart } from "../CartContext";
import { CldImage } from "next-cloudinary";
import { X } from "lucide-react";

export default function ProductModal({
  product,
  onClose,
}: {
  product: any;
  onClose: () => void;
}) {
  const { addItem } = useCart();

  const [selectedPortion, setSelectedPortion] = useState(
    product.portions?.[0] ?? null
  );
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);

  function toggleExtra(extra: any) {
    setSelectedExtras((prev) => {
      if (prev[extra.id]) {
        const updated = { ...prev };
        delete updated[extra.id];
        return updated;
      }
      return { ...prev, [extra.id]: 1 };
    });
  }

  function total() {
    if (!selectedPortion) return 0;
    const extrasTotal = Object.entries(selectedExtras).reduce((sum, [extraId]) => {
      const extra = product.extras?.find((e: any) => e.id === extraId);
      return sum + (extra?.price ?? 0);
    }, 0);
    return (selectedPortion.price + extrasTotal) * quantity;
  }

  function handleAdd() {
    if (!selectedPortion) return;
    addItem({
      productId: product.id,
      productName: product.name,
      portionId: selectedPortion.id,
      portionName: selectedPortion.name,
      unitPrice: selectedPortion.price,
      quantity,
      extras: Object.entries(selectedExtras).map(([extraId, qty]) => {
        const extra = product.extras?.find((e: any) => e.id === extraId);
        return {
          extraId,
          extraName: extra?.name ?? "",
          unitPrice: extra?.price ?? 0,
          quantity: qty,
        };
      }),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Image */}
        {product.images?.[0] ? (
          <div className="relative h-52 shrink-0 bg-stone-100">
            <CldImage
              src={product.images[0].url}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-32 shrink-0 bg-stone-100 flex items-center justify-center text-5xl">
            🍽️
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-5">
          <h2 className="text-xl font-bold text-stone-900">{product.name}</h2>
          {product.description && (
            <p className="text-sm text-stone-500 mt-1 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Portions */}
          {product.portions?.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                Tamaño
              </p>
              <div className="flex flex-col gap-2">
                {product.portions.map((portion: any) => (
                  <button
                    key={portion.id}
                    onClick={() => setSelectedPortion(portion)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                      selectedPortion?.id === portion.id
                        ? "border-stone-900 bg-stone-50"
                        : "border-stone-100 hover:border-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedPortion?.id === portion.id
                          ? "border-stone-900"
                          : "border-stone-300"
                      }`}>
                        {selectedPortion?.id === portion.id && (
                          <div className="w-2 h-2 rounded-full bg-stone-900" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-stone-800">
                        {portion.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-stone-900">
                      ${(portion.price / 100).toFixed(0)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extras */}
          {product.extras?.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                Extras <span className="normal-case font-normal">(opcional)</span>
              </p>
              <div className="flex flex-col gap-2">
                {product.extras.map((extra: any) => (
                  <button
                    key={extra.id}
                    onClick={() => toggleExtra(extra)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                      selectedExtras[extra.id]
                        ? "border-stone-900 bg-stone-50"
                        : "border-stone-100 hover:border-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedExtras[extra.id]
                          ? "border-stone-900 bg-stone-900"
                          : "border-stone-300"
                      }`}>
                        {selectedExtras[extra.id] && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-stone-800">
                        {extra.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-stone-500">
                      +${(extra.price / 100).toFixed(0)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-stone-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-stone-100 rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-white transition-colors font-medium"
              >
                −
              </button>
              <span className="w-6 text-center font-bold text-stone-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-white transition-colors font-medium"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={!selectedPortion}
              className="flex-1 bg-stone-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Agregar · ${(total() / 100).toFixed(0)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}