"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { useCart } from "../CartContext";
import { ArrowLeft, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CheckoutPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const { items, total, clearCart, orderType } = useCart();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [error, setError] = useState("");

  const isDelivery = orderType === "DELIVERY";

  useEffect(() => {
    if (items.length === 0) {
      router.replace(`/${slug}`);
      return;
    }
    if (isDelivery) loadAddresses();
  }, []);

  async function getToken() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  async function loadAddresses() {
    try {
      const token = await getToken();
      const data = await apiClient("/addresses", { token });
      setAddresses(data);
      if (data.length > 0) setSelectedAddressId(data[0].id);
    } catch {
      setAddresses([]);
    }
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddressLoading(true);
    try {
      const token = await getToken();
      const created = await apiClient("/addresses", {
        method: "POST",
        token,
        body: JSON.stringify({
          label: newLabel,
          street: newStreet,
          details: newDetails || undefined,
        }),
      });
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
      setShowNewAddress(false);
      setNewLabel("");
      setNewStreet("");
      setNewDetails("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddressLoading(false);
    }
  }

  async function handleConfirm() {
    if (isDelivery && !selectedAddressId && !showNewAddress) {
      setError("Seleccioná una dirección de entrega");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const token = await getToken();

      const order = await apiClient(`/stores/${slug}/orders`, {
        method: "POST",
        token,
        body: JSON.stringify({
          orderType,
          notes: notes || undefined,
          addressId: isDelivery ? selectedAddressId : undefined,
          items: items.map((item) => ({
            productId: item.productId,
            portionId: item.portionId,
            quantity: item.quantity,
            extras: item.extras.map((e) => ({
              extraId: e.extraId,
              quantity: e.quantity,
            })),
          })),
        }),
      });

      const preference = await apiClient(
        `/stores/${slug}/payment/preference?orderId=${order.id}`,
        { method: "POST", token }
      );

      clearCart();
      window.location.href = preference.sandboxInitPoint ?? preference.initPoint;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-10">
      <div className="max-w-lg mx-auto px-4 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-stone-100 hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-stone-900">Checkout</h1>
            <p className="text-xs text-stone-400">{slug}</p>
          </div>
        </div>

        {/* Resumen del pedido */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="font-bold text-stone-900">Pedido</p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            {items.map((item, index) => {
              const itemTotal =
                (item.unitPrice + item.extras.reduce((s, e) => s + e.unitPrice * e.quantity, 0)) *
                item.quantity;
              return (
                <div key={index} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      x{item.quantity} {item.productName}
                    </p>
                    <p className="text-xs text-stone-400">{item.portionName}</p>
                    {item.extras.length > 0 && (
                      <p className="text-xs text-stone-400">
                        +{item.extras.map((e) => e.extraName).join(", ")}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-stone-900 shrink-0">
                    ${(itemTotal / 100).toFixed(0)}
                  </p>
                </div>
              );
            })}
            <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
              <p className="font-bold text-stone-900">Total</p>
              <p className="text-xl font-extrabold text-stone-900">${(total / 100).toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Dirección — solo si delivery */}
        {isDelivery && (
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <p className="font-bold text-stone-900">Dirección de entrega</p>
              <button
                onClick={() => setShowNewAddress(!showNewAddress)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                <Plus className="w-4 h-4 text-stone-600" />
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              {showNewAddress && (
                <form onSubmit={handleAddAddress} className="flex flex-col gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-sm font-semibold text-stone-700">Nueva dirección</p>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Nombre (ej: Casa, Trabajo)</Label>
                    <Input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Casa"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Dirección</Label>
                    <Input
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      placeholder="Luis Alberto de Herrera 1234"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Detalles (opcional)</Label>
                    <Input
                      value={newDetails}
                      onChange={(e) => setNewDetails(e.target.value)}
                      placeholder="Apto 3B, timbre roto"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={addressLoading}>
                      {addressLoading ? "Guardando..." : "Guardar"}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewAddress(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

              {addresses.length === 0 && !showNewAddress ? (
                <p className="text-sm text-stone-400">No tenés direcciones guardadas</p>
              ) : (
                addresses.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                      selectedAddressId === address.id
                        ? "border-stone-900 bg-stone-50"
                        : "border-stone-100 hover:border-stone-200"
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{address.label}</p>
                      <p className="text-xs text-stone-500">{address.street}</p>
                      {address.details && (
                        <p className="text-xs text-stone-400">{address.details}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Notas */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="font-bold text-stone-900">Notas</p>
          </div>
          <div className="px-5 py-4">
            <textarea
              placeholder="Ej: sin cebolla, apto 3B, no funciona el timbre..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm text-stone-700 placeholder:text-stone-300 border border-stone-200 rounded-xl px-4 py-3 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-stone-900 text-white py-4 rounded-2xl text-sm font-bold hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Procesando...
            </span>
          ) : (
            `Ir a Pagar · $${(total / 100).toFixed(0)}`
          )}
        </button>

      </div>
    </div>
  );
}