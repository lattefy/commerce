"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CustomersClient({
  slug,
  initialCustomers,
}: {
  slug: string;
  initialCustomers: any[];
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("totalSpent");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  const filtered = useMemo(() => {
    let result = [...customers];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "totalSpent": return b.totalSpent - a.totalSpent;
        case "totalOrders": return b.totalOrders - a.totalOrders;
        case "loyaltyPoints": return b.loyaltyPoints - a.loyaltyPoints;
        case "lastOrderAt": return new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
        case "name": return (a.name ?? "").localeCompare(b.name ?? "");
        default: return 0;
      }
    });

    return result;
  }, [customers, search, sortBy]);

  async function getToken() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    setAdjustError("");
    const points = parseInt(adjustPoints);
    if (isNaN(points) || points === 0) {
      setAdjustError("Ingresá un número distinto de cero");
      return;
    }
    setAdjustLoading(true);
    try {
      const token = await getToken();
      await apiClient(`/stores/${slug}/loyalty/adjust/${selectedCustomer.id}`, {
        method: "POST",
        token,
        body: JSON.stringify({ points, reason: adjustReason || undefined }),
      });
      // Actualizar puntos localmente
      setCustomers(customers.map((c) =>
        c.id === selectedCustomer.id
          ? { ...c, loyaltyPoints: c.loyaltyPoints + points }
          : c
      ));
      setSelectedCustomer((prev: any) => ({ ...prev, loyaltyPoints: prev.loyaltyPoints + points }));
      setAdjustPoints("");
      setAdjustReason("");
      router.refresh();
    } catch (err: any) {
      setAdjustError(err.message);
    } finally {
      setAdjustLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} de {customers.length}</p>
      </div>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="totalSpent">Mayor gasto</SelectItem>
            <SelectItem value="totalOrders">Más órdenes</SelectItem>
            <SelectItem value="loyaltyPoints">Más puntos</SelectItem>
            <SelectItem value="lastOrderAt">Última orden</SelectItem>
            <SelectItem value="name">Nombre A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No se encontraron clientes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((customer: any) => (
            <Card key={customer.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setSelectedCustomer(customer)}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{customer.name ?? "Sin nombre"}</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                  {customer.phone && (
                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-sm font-medium">{customer.totalOrders} órdenes</p>
                    <p className="text-xs text-muted-foreground">
                      ${(customer.totalSpent / 100).toFixed(2)} gastados
                    </p>
                  </div>
                  <div>
                    <Badge variant="secondary">
                      {customer.loyaltyPoints} pts
                    </Badge>
                    {customer.lastOrderAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(customer.lastOrderAt).toLocaleDateString("es-UY")}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        {selectedCustomer && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCustomer.name ?? "Sin nombre"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                {selectedCustomer.phone && (
                  <div>
                    <p className="text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{selectedCustomer.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Órdenes</p>
                  <p className="font-medium">{selectedCustomer.totalOrders}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total gastado</p>
                  <p className="font-medium">${(selectedCustomer.totalSpent / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Puntos actuales</p>
                  <p className="font-medium text-lg">{selectedCustomer.loyaltyPoints} pts</p>
                </div>
                {selectedCustomer.lastOrderAt && (
                  <div>
                    <p className="text-muted-foreground">Última orden</p>
                    <p className="font-medium">{new Date(selectedCustomer.lastOrderAt).toLocaleDateString("es-UY")}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="font-medium text-sm mb-3">Ajustar puntos</p>
                <form onSubmit={handleAdjust} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Puntos (positivo para agregar, negativo para quitar)</Label>
                    <Input
                      type="number"
                      placeholder="Ej: 50 o -20"
                      value={adjustPoints}
                      onChange={(e) => setAdjustPoints(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Motivo (opcional)</Label>
                    <Input
                      placeholder="Ej: Regalo por cumpleaños"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                    />
                  </div>
                  {adjustError && <p className="text-sm text-destructive">{adjustError}</p>}
                  <Button type="submit" disabled={adjustLoading}>
                    {adjustLoading ? "Ajustando..." : "Ajustar puntos"}
                  </Button>
                </form>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}