"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CldUploadWidget, CldImage } from "next-cloudinary";

const DAYS = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS.map(({ key }) => [key, { open: "09:00", close: "18:00", closed: false }])
);

type Permissions = {
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageLoyalty: boolean;
  canManageEmployees: boolean;
  canViewAnalytics: boolean;
  canManageOperations: boolean;
};

export default function StoreSettingsForm({
  slug,
  store,
  role,
  permissions,
}: {
  slug: string;
  store: any;
  role: "OWNER" | "EMPLOYEE";
  permissions: Permissions;
}) {
  const router = useRouter();

  const canEditSettings = role === "OWNER";
  const canEditOperations = role === "OWNER" || permissions.canManageOperations;

  const [name, setName] = useState(store.name ?? "");
  const [description, setDescription] = useState(store.description ?? "");
  const [phone, setPhone] = useState(store.phone ?? "");
  const [instagram, setInstagram] = useState(store.instagram ?? "");
  const [website, setWebsite] = useState(store.website ?? "");
  const [address, setAddress] = useState(store.address ?? "");
  const [city, setCity] = useState(store.city ?? "");
  const [deliveryZone, setDeliveryZone] = useState(store.deliveryZone ?? "");
  const [allowsPickup, setAllowsPickup] = useState(store.allowsPickup);
  const [allowsDelivery, setAllowsDelivery] = useState(store.allowsDelivery);
  const [schedule, setSchedule] = useState<any>(store.schedule ?? DEFAULT_SCHEDULE);
  const [logoUrl, setLogoUrl] = useState(store.branding?.logoUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(store.branding?.coverUrl ?? "");
  const [pickupTime, setPickupTime] = useState(store.pickupTime ?? "");
  const [deliveryTime, setDeliveryTime] = useState(store.deliveryTime ?? "");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function updateScheduleDay(day: string, field: string, value: any) {
    setSchedule((prev: any) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (canEditSettings && !allowsPickup && !allowsDelivery) {
      setError("La tienda debe aceptar al menos un tipo de orden.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const body: Record<string, any> = {};

      if (canEditSettings) {
        Object.assign(body, {
          name,
          description: description || undefined,
          phone: phone || undefined,
          instagram: instagram || undefined,
          website: website || undefined,
          address: address || undefined,
          city: city || undefined,
          deliveryZone: deliveryZone || undefined,
          allowsPickup,
          allowsDelivery,
          schedule,
          branding: {
            ...(store.branding ?? {}),
            logoUrl: logoUrl || undefined,
            coverUrl: coverUrl || undefined,
          },
        });
      }

      if (canEditOperations) {
        Object.assign(body, {
          pickupTime: pickupTime || undefined,
          deliveryTime: deliveryTime || undefined,
        });
      }

      await apiClient(`/stores/my/${slug}`, {
        method: "PATCH",
        token: session?.access_token,
        body: JSON.stringify(body),
      });

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {canEditSettings && (
        <>
          <Card>
            <CardHeader><CardTitle>Imágenes</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label>Logo</Label>
                <p className="text-xs text-muted-foreground">Recomendado: 400x400px, fondo transparente</p>
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <CldImage
                      src={logoUrl}
                      alt="Logo"
                      width={80}
                      height={80}
                      className="rounded-full object-cover border"
                    />
                  )}
                  <CldUploadWidget
                    uploadPreset="lattefy_uploads"
                    options={{
                      maxFiles: 1,
                      cropping: true,
                      croppingAspectRatio: 1,
                      folder: "lattefy/logos",
                    }}
                    onSuccess={(result: any) => setLogoUrl(result.info.public_id)}
                  >
                    {({ open }) => (
                      <Button type="button" variant="outline" onClick={() => open()}>
                        {logoUrl ? "Cambiar logo" : "Subir logo"}
                      </Button>
                    )}
                  </CldUploadWidget>
                  {logoUrl && (
                    <Button type="button" variant="ghost" onClick={() => setLogoUrl("")}>
                      Quitar
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Imagen de portada</Label>
                <p className="text-xs text-muted-foreground">Recomendado: 1200x400px</p>
                <div className="flex flex-col gap-2">
                  {coverUrl && (
                    <CldImage
                      src={coverUrl}
                      alt="Portada"
                      width={600}
                      height={200}
                      className="rounded-lg object-cover w-full max-h-40"
                    />
                  )}
                  <div className="flex gap-2">
                    <CldUploadWidget
                      uploadPreset="lattefy_uploads"
                      options={{
                        maxFiles: 1,
                        cropping: true,
                        croppingAspectRatio: 3,
                        folder: "lattefy/covers",
                      }}
                      onSuccess={(result: any) => setCoverUrl(result.info.public_id)}
                    >
                      {({ open }) => (
                        <Button type="button" variant="outline" onClick={() => open()}>
                          {coverUrl ? "Cambiar portada" : "Subir portada"}
                        </Button>
                      )}
                    </CldUploadWidget>
                    {coverUrl && (
                      <Button type="button" variant="ghost" onClick={() => setCoverUrl("")}>
                        Quitar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>General</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Nombre de la tienda</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Descripción</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contá un poco sobre tu tienda..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contacto</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Teléfono</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+598 99 123 456" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Instagram</Label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@mitienda" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Sitio web</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://mitienda.com" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dirección</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Dirección</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. 18 de Julio 1234" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Ciudad</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Montevideo" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Zona de delivery</Label>
                <Textarea
                  value={deliveryZone}
                  onChange={(e) => setDeliveryZone(e.target.value)}
                  placeholder="Ej: Zona Centro, Pocitos, Palermo"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tipos de orden</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowsPickup}
                  onChange={(e) => setAllowsPickup(e.target.checked)}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium text-sm">Retiro en local</p>
                  <p className="text-xs text-muted-foreground">El cliente retira su pedido en el local</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowsDelivery}
                  onChange={(e) => setAllowsDelivery(e.target.checked)}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium text-sm">Delivery</p>
                  <p className="text-xs text-muted-foreground">El local entrega el pedido a domicilio</p>
                </div>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Horarios</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {DAYS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium">{label}</div>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={!schedule[key]?.closed}
                      onChange={(e) => updateScheduleDay(key, "closed", !e.target.checked)}
                      className="w-3.5 h-3.5"
                    />
                    Abierto
                  </label>
                  {!schedule[key]?.closed && (
                    <>
                      <Input
                        type="time"
                        value={schedule[key]?.open ?? "09:00"}
                        onChange={(e) => updateScheduleDay(key, "open", e.target.value)}
                        className="w-32 h-8 text-sm"
                      />
                      <span className="text-sm text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={schedule[key]?.close ?? "18:00"}
                        onChange={(e) => updateScheduleDay(key, "close", e.target.value)}
                        className="w-32 h-8 text-sm"
                      />
                    </>
                  )}
                  {schedule[key]?.closed && (
                    <span className="text-sm text-muted-foreground">Cerrado</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {canEditOperations && (
        <Card>
          <CardHeader><CardTitle>Tiempos de entrega</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            {(canEditSettings ? allowsPickup : store.allowsPickup) && (
              <div className="flex flex-col gap-1.5">
                <Label>Tiempo de preparación (retiro)</Label>
                <Input
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  placeholder="Ej: 15-20 min"
                />
              </div>
            )}
            {(canEditSettings ? allowsDelivery : store.allowsDelivery) && (
              <div className="flex flex-col gap-1.5">
                <Label>Tiempo de entrega (delivery)</Label>
                <Input
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  placeholder="Ej: 30-45 min"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Cambios guardados correctamente</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}