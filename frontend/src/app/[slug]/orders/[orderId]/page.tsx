"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";

export default function OrderConfirmationPage() {
  const { slug, orderId } = useParams() as { slug: string; orderId: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  const status = searchParams.get("status");
  const paymentId = searchParams.get("payment_id");

  const [state, setState] = useState<"loading" | "success" | "failure" | "pending">("loading");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "success" && paymentId) {
      confirmPayment();
    } else if (status === "failure") {
      setState("failure");
    } else if (status === "pending") {
      setState("pending");
    } else {
      loadOrder();
    }
  }, []);

  async function getToken() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  async function confirmPayment() {
    try {
      const token = await getToken();
      await apiClient(`/stores/${slug}/orders/${orderId}/confirm-payment`, {
        method: "POST",
        token,
        body: JSON.stringify({ paymentId }),
      });
      await loadOrder();
      setState("success");
    } catch (err: any) {
      setError(err.message);
      setState("failure");
    }
  }

  async function loadOrder() {
    try {
      const token = await getToken();
      const data = await apiClient(`/stores/${slug}/orders/${orderId}`, { token });
      setOrder(data);
    } catch {
      // silenciar
    }
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
          <p className="text-sm text-stone-500">Confirmando pago...</p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="min-h-screen bg-emerald-500 flex flex-col items-center justify-center px-4 gap-6">
        <div className="w-24 h-24 rounded-full border-4 border-white/40 flex items-center justify-center">
          <CheckCircle className="w-14 h-14 text-white" strokeWidth={1.5} />
        </div>
        <p className="text-white text-2xl font-extrabold">Pago realizado con éxito</p>
        {order && (
          <p className="text-white/80 text-sm">Pedido #{order.id.slice(-6).toUpperCase()}</p>
        )}
        <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
          <button
            onClick={() => router.push(`/${slug}/mis-pedidos`)}
            className="w-full bg-white text-emerald-600 py-3 rounded-2xl text-sm font-bold hover:bg-emerald-50 transition-colors"
          >
            Ver mis pedidos
          </button>
          <button
            onClick={() => router.push(`/${slug}`)}
            className="w-full text-white/80 py-3 rounded-2xl text-sm font-medium hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="min-h-screen bg-amber-400 flex flex-col items-center justify-center px-4 gap-6">
        <div className="w-24 h-24 rounded-full border-4 border-white/40 flex items-center justify-center">
          <Clock className="w-14 h-14 text-white" strokeWidth={1.5} />
        </div>
        <p className="text-white text-2xl font-extrabold">Pago pendiente</p>
        <p className="text-white/80 text-sm text-center">
          Tu pago está siendo procesado. Te notificaremos cuando se confirme.
        </p>
        <button
          onClick={() => router.push(`/${slug}`)}
          className="w-full max-w-xs bg-white text-amber-600 py-3 rounded-2xl text-sm font-bold hover:bg-amber-50 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center px-4 gap-6">
      <div className="w-24 h-24 rounded-full border-4 border-stone-300 flex items-center justify-center">
        <XCircle className="w-14 h-14 text-stone-400" strokeWidth={1.5} />
      </div>
      <p className="text-stone-900 text-2xl font-extrabold">Pago fallido</p>
      <p className="text-stone-500 text-sm text-center">
        {error || "Hubo un problema con tu pago. Podés intentarlo de nuevo."}
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => router.push(`/${slug}`)}
          className="w-full bg-stone-900 text-white py-3 rounded-2xl text-sm font-bold hover:bg-stone-800 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}