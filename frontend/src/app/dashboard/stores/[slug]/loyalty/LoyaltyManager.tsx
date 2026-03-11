"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function LoyaltyManager({
  slug,
  initialSettings,
  initialRewards,
}: {
  slug: string;
  initialSettings: any;
  initialRewards: any[];
}) {
  const router = useRouter();

  const [pesosPerPoint, setPesosPerPoint] = useState(String(initialSettings.pesosPerPoint ?? 20));
  const [maxPointsPerOrder, setMaxPointsPerOrder] = useState(String(initialSettings.maxPointsPerOrder ?? ""));
  const [pointsExpiryDays, setPointsExpiryDays] = useState(String(initialSettings.pointsExpiryDays ?? ""));
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const [rewards, setRewards] = useState(initialRewards);
  const [products, setProducts] = useState<any[]>([]);
  const [showNewReward, setShowNewReward] = useState(false);
  const [newReward, setNewReward] = useState({
    name: "",
    description: "",
    type: "FIXED_POINTS",
    pointsCost: "",
    discountValue: "",
    productId: "",
  });
  const [rewardLoading, setRewardLoading] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      try {
        const data = await apiClient(`/stores/${slug}/products`, { token: session?.access_token });
        setProducts(data.filter((p: any) => p.status === "AVAILABLE"));
      } catch {}
    }
    loadProducts();
  }, [slug]);

  async function getToken() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(false);
    try {
      const token = await getToken();
      await apiClient(`/stores/${slug}/loyalty/settings`, {
        method: "POST",
        token,
        body: JSON.stringify({
          pesosPerPoint: parseInt(pesosPerPoint),
          maxPointsPerOrder: maxPointsPerOrder ? parseInt(maxPointsPerOrder) : undefined,
          pointsExpiryDays: pointsExpiryDays ? parseInt(pointsExpiryDays) : undefined,
        }),
      });
      setSettingsSuccess(true);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handleCreateReward(e: React.FormEvent) {
    e.preventDefault();
    setRewardLoading(true);
    try {
      const token = await getToken();
      const body: any = {
        name: newReward.name,
        description: newReward.description || undefined,
        type: newReward.type,
        pointsCost: parseInt(newReward.pointsCost),
      };

      if (newReward.type === "FREE_PRODUCT") {
        body.productId = newReward.productId || undefined;
        body.discountValue = 0;
      } else {
        body.discountValue = Math.round(parseFloat(newReward.discountValue) * 100);
      }

      const created = await apiClient(`/stores/${slug}/loyalty/rewards`, {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      setRewards([...rewards, created]);
      setNewReward({ name: "", description: "", type: "FIXED_POINTS", pointsCost: "", discountValue: "", productId: "" });
      setShowNewReward(false);
    } catch (err) {
      console.error(err);
    } finally {
      setRewardLoading(false);
    }
  }

  async function handleToggleReward(rewardId: string, isActive: boolean) {
    try {
      const token = await getToken();
      const updated = await apiClient(`/stores/${slug}/loyalty/rewards/${rewardId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ isActive: !isActive }),
      });
      setRewards(rewards.map((r) => r.id === rewardId ? updated : r));
    } catch (err) {
      console.error(err);
    }
  }

  function getRewardLabel(reward: any) {
    if (reward.type === "FREE_PRODUCT") {
      return reward.product ? `${reward.product.name} gratis` : "Producto gratis";
    }
    if (reward.type === "FIXED_POINTS") {
      return `$${(reward.discountValue / 100).toFixed(2)} de descuento`;
    }
    return `${reward.discountValue}% de descuento`;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader><CardTitle>Configuración</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Pesos por punto</Label>
              <Input
                type="number"
                min="1"
                value={pesosPerPoint}
                onChange={(e) => setPesosPerPoint(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Cada ${pesosPerPoint} gastados = 1 punto
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Máximo de puntos por orden (opcional)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Sin límite"
                value={maxPointsPerOrder}
                onChange={(e) => setMaxPointsPerOrder(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Vencimiento de puntos en días (opcional)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Sin vencimiento"
                value={pointsExpiryDays}
                onChange={(e) => setPointsExpiryDays(e.target.value)}
              />
            </div>
            {settingsSuccess && <p className="text-sm text-green-600">Configuración guardada</p>}
            <Button type="submit" disabled={settingsLoading}>
              {settingsLoading ? "Guardando..." : "Guardar configuración"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rewards</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowNewReward(!showNewReward)}>
              {showNewReward ? "Cancelar" : "+ Nuevo reward"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {showNewReward && (
            <form onSubmit={handleCreateReward} className="flex flex-col gap-3 p-4 border rounded-lg">
              <div className="flex flex-col gap-1.5">
                <Label>Nombre</Label>
                <Input
                  value={newReward.name}
                  onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                  placeholder="Ej: Café gratis"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Descripción (opcional)</Label>
                <Textarea
                  value={newReward.description}
                  onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tipo</Label>
                <Select
                  value={newReward.type}
                  onValueChange={(v) => setNewReward({ ...newReward, type: v, discountValue: "", productId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED_POINTS">Descuento fijo ($)</SelectItem>
                    <SelectItem value="PERCENTAGE_DISCOUNT">Descuento porcentual (%)</SelectItem>
                    <SelectItem value="FREE_PRODUCT">Producto gratis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Costo en puntos</Label>
                <Input
                  type="number"
                  min="1"
                  value={newReward.pointsCost}
                  onChange={(e) => setNewReward({ ...newReward, pointsCost: e.target.value })}
                  required
                />
              </div>

              {newReward.type === "FREE_PRODUCT" ? (
                <div className="flex flex-col gap-1.5">
                  <Label>Producto (opcional)</Label>
                  <Select
                    value={newReward.productId}
                    onValueChange={(v) => setNewReward({ ...newReward, productId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Si no seleccionás producto, el staff decide cuál aplica</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Label>{newReward.type === "FIXED_POINTS" ? "Descuento ($)" : "Descuento (%)"}</Label>
                  <Input
                    type="number"
                    min="1"
                    step={newReward.type === "FIXED_POINTS" ? "0.01" : "1"}
                    value={newReward.discountValue}
                    onChange={(e) => setNewReward({ ...newReward, discountValue: e.target.value })}
                    required
                  />
                </div>
              )}

              <Button type="submit" disabled={rewardLoading}>
                {rewardLoading ? "Creando..." : "Crear reward"}
              </Button>
            </form>
          )}

          {rewards.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay rewards todavía</p>
          ) : (
            <div className="flex flex-col gap-2">
              {rewards.map((reward: any) => (
                <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{reward.name}</p>
                      <Badge variant={reward.isActive ? "default" : "secondary"}>
                        {reward.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {reward.pointsCost} puntos → {getRewardLabel(reward)}
                    </p>
                    {reward.description && (
                      <p className="text-xs text-muted-foreground">{reward.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleReward(reward.id, reward.isActive)}
                  >
                    {reward.isActive ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}