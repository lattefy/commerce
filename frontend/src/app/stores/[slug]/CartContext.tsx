"use client";

import { createContext, useContext, useState, useCallback } from "react";

export interface CartItem {
  productId: string;
  productName: string;
  portionId: string;
  portionName: string;
  unitPrice: number;
  quantity: number;
  extras: {
    extraId: string;
    extraName: string;
    unitPrice: number;
    quantity: number;
  }[];
}

type OrderType = "PICKUP" | "DELIVERY";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("PICKUP");

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.portionId === newItem.portionId &&
          JSON.stringify(item.extras.map((e) => e.extraId).sort()) ===
            JSON.stringify(newItem.extras.map((e) => e.extraId).sort())
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      }
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    } else {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], quantity };
        return updated;
      });
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce(
    (sum, item) =>
      sum +
      (item.unitPrice + item.extras.reduce((s, e) => s + e.unitPrice * e.quantity, 0)) *
        item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount,
      orderType,
      setOrderType,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}