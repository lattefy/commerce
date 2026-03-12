"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import OrderActions from "./OrderActions";

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente pago",
  PAID: "Pagado",
  PREPARING: "Preparando",
  READY: "Listo",
  OUT_FOR_DELIVERY: "En camino",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  PREPARING: "default",
  READY: "default",
  OUT_FOR_DELIVERY: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

const ALL_STATUSES = ["PAID", "PREPARING", "READY", "OUT_FOR_DELIVERY", "PENDING", "COMPLETED", "CANCELLED"];
const ACTIVE_STATUSES = new Set(["PAID", "PREPARING", "READY", "OUT_FOR_DELIVERY"]);

function orderMatchesSearch(order: any, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (order.id.toLowerCase().includes(q)) return true;
  if (order.user?.name?.toLowerCase().includes(q)) return true;
  if (order.user?.email?.toLowerCase().includes(q)) return true;
  if (order.notes?.toLowerCase().includes(q)) return true;
  if (order.items?.some((item: any) => item.productName.toLowerCase().includes(q))) return true;
  return false;
}

function OrderCard({ order, slug, compact = false }: { order: any; slug: string; compact?: boolean }) {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <Card className={ACTIVE_STATUSES.has(order.status) ? "border-l-4 border-l-primary" : "opacity-80"}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm">#{order.id.slice(-8)}</p>
              {order.orderType === "DELIVERY" && (
                <span className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-md">delivery</span>
              )}
              {order.user?.name && (
                <span className="text-xs text-muted-foreground truncate">{order.user.name}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {new Date(order.createdAt).toLocaleString("es-UY")}
            </p>

            {expanded ? (
              <>
                <div className="flex flex-col gap-1 mb-2">
                  {order.items?.map((item: any) => (
                    <p key={item.id} className="text-sm">
                      {item.quantity}x {item.productName}
                      <span className="text-muted-foreground"> — {item.portionName}</span>
                      {item.extras?.length > 0 && (
                        <span className="text-muted-foreground">
                          {" "}(+{item.extras.map((e: any) => e.extraName).join(", ")})
                        </span>
                      )}
                    </p>
                  ))}
                </div>
                {order.notes && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                    📝 {order.notes}
                  </p>
                )}
              </>
            ) : (
              <button
                onClick={() => setExpanded(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {order.items?.length} producto(s) — ver detalle
              </button>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant={statusVariant[order.status]}>
              {statusLabel[order.status]}
            </Badge>
            <p className="font-semibold text-sm">${(order.total / 100).toFixed(0)}</p>
            <OrderActions order={order} slug={slug} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrdersClient({ orders, slug }: { orders: any[]; slug: string }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      if (!orderMatchesSearch(order, search)) return false;
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (dateFilter) {
        const orderDate = new Date(order.createdAt).toISOString().slice(0, 10);
        if (orderDate !== dateFilter) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, dateFilter]);

  const activeOrders = filtered.filter((o) => ACTIVE_STATUSES.has(o.status));
  const historyOrders = filtered.filter((o) => !ACTIVE_STATUSES.has(o.status));

  const isFiltering = search || statusFilter !== "all" || dateFilter;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Órdenes</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder="Buscar por #ID, cliente, producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Todos los estados</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {isFiltering && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); setDateFilter(""); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isFiltering ? "Sin resultados para los filtros aplicados." : "No hay órdenes todavía."}
        </p>
      ) : (
        <>
          {activeOrders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Activas ({activeOrders.length})
              </h2>
              <div className="grid gap-3">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} slug={slug} compact={false} />
                ))}
              </div>
            </div>
          )}

          {historyOrders.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Historial ({historyOrders.length})
              </h2>
              <div className="grid gap-2">
                {historyOrders.map((order) => (
                  <OrderCard key={order.id} order={order} slug={slug} compact={true} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
