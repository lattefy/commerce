"use client";

import { useCart } from "../CartContext";

export default function CartButton({ onClick }: { onClick: () => void }) {
  const { itemCount, total } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 bg-stone-900 text-white px-5 py-4 rounded-2xl shadow-lg hover:bg-stone-800 active:scale-[0.98] transition-all"
      >
        <span className="flex items-center justify-center w-7 h-7 bg-white/20 rounded-lg text-sm font-bold">
          {itemCount}
        </span>
        <span className="flex-1 text-left font-semibold">Ver pedido</span>
        <span className="font-bold">${(total / 100).toFixed(0)}</span>
      </button>
    </div>
  );
}