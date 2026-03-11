"use client";

import { ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "../CartContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function StoreNavbar({
  storeName,
  slug,
  onCartClick,
}: {
  storeName: string;
  slug: string;
  onCartClick: () => void;
}) {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const navItems = [
    { label: "Inicio", href: `/stores/${slug}` },
    { label: "Mis Pedidos", href: `/stores/${slug}/mis-pedidos` },
    { label: "Mis Puntos", href: `/stores/${slug}/mis-puntos` },
    { label: "Mi Cuenta", href: `/perfil` },
  ];

  return (
    <>
      <header className="fixed top-3 left-3 right-3 z-40">
        <div className="bg-white rounded-2xl shadow-lg px-5 h-16 flex items-center justify-between">
          <button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-stone-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-stone-700" />
          </button>

          <span className="text-base font-bold text-stone-900 truncate max-w-[200px]">
            {storeName}
          </span>

          <button
            onClick={onCartClick}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-stone-100 transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-stone-700" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-stone-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="px-6 pt-12 pb-6 border-b border-stone-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-1">Menú</p>
                <p className="text-lg font-bold text-stone-900">{storeName}</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-left px-4 py-3 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="px-6 py-6 border-t border-stone-100 flex flex-col gap-3">
              <p className="text-xs text-stone-300 font-semibold tracking-widest text-center">
                POWERED BY LATTEFY
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}