"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { Trash2, ShoppingBag } from "lucide-react";

export default function Cart({
  slug,
  store,
  onClose,
  storeOpen,
}: {
  slug: string;
  store: any;
  onClose: () => void;
  storeOpen: boolean;
}) {
  const { items, removeItem, updateQuantity, clearCart, total, orderType, setOrderType } = useCart();
  const router = useRouter();

  // Inicializar orderType según lo que permite la tienda
  useEffect(() => {
    if (!store.allowsPickup && store.allowsDelivery) {
      setOrderType("DELIVERY");
    } else {
      setOrderType("PICKUP");
    }
  }, [store]);

  function handleGoToCheckout() {
    onClose();
    router.push(`/${slug}/checkout`);
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 text-stone-400" />
        </div>
        <p className="text-sm text-stone-400 font-medium">Tu carrito está vacío</p>
        <p className="text-xs text-stone-300">Agregá productos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Items */}
      <div className="flex flex-col gap-1">
        {items.map((item, index) => {
          const itemTotal =
            (item.unitPrice +
              item.extras.reduce((s, e) => s + e.unitPrice * e.quantity, 0)) *
            item.quantity;
          return (
            <div
              key={index}
              className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900">{item.productName}</p>
                <p className="text-xs text-stone-400">{item.portionName}</p>
                {item.extras.length > 0 && (
                  <p className="text-xs text-stone-400">
                    + {item.extras.map((e) => e.extraName).join(", ")}
                  </p>
                )}
                <p className="text-sm font-bold text-stone-800 mt-1">
                  ${(itemTotal / 100).toFixed(0)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl px-1 py-1">
                  <button
                    onClick={() => updateQuantity(index, item.quantity - 1)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-600 hover:bg-white transition-colors text-sm font-medium"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-stone-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-600 hover:bg-white transition-colors text-sm font-medium"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(index)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order type */}
      {store.allowsPickup && store.allowsDelivery && (
        <div className="flex gap-2 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setOrderType("PICKUP")}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${
              orderType === "PICKUP"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500"
            }`}
          >
            🏃 Retiro
          </button>
          <button
            onClick={() => setOrderType("DELIVERY")}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${
              orderType === "DELIVERY"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500"
            }`}
          >
            🛵 Delivery
          </button>
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-100">
        <span className="font-semibold text-stone-600 text-sm">Total</span>
        <span className="text-xl font-bold text-stone-900">${(total / 100).toFixed(0)}</span>
      </div>

      {!storeOpen && (
        <p className="text-xs text-center text-red-500 font-medium -mb-2">
          La tienda está cerrada
        </p>
      )}
      <button
        onClick={storeOpen ? handleGoToCheckout : undefined}
        disabled={!storeOpen}
        className={`w-full py-4 rounded-2xl text-sm font-bold transition-all ${
          storeOpen
            ? "bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98]"
            : "bg-stone-200 text-stone-400 cursor-not-allowed"
        }`}
      >
        Ir al checkout · ${(total / 100).toFixed(0)}
      </button>

      <button
        onClick={clearCart}
        className="text-xs text-stone-400 hover:text-red-400 transition-colors text-center"
      >
        Cancelar y vaciar carrito
      </button>
    </div>
  );
}