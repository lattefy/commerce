"use client";

import { X } from "lucide-react";
import Cart from "../Cart";

export default function CartSheet({
  slug,
  store,
  open,
  onClose,
  storeOpen,
}: {
  slug: string;
  store: any;
  open: boolean;
  onClose: () => void;
  storeOpen: boolean;
}) {
  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <h2 className="font-bold text-stone-900">Mi Carrito</h2>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-stone-400 hover:text-stone-600 font-medium transition-colors"
          >
            Seguir comprando
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <Cart slug={slug} store={store} onClose={onClose} storeOpen={storeOpen} />
        </div>
      </div>
    </div>
  );
}