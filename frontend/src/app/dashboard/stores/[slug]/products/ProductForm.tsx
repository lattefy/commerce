"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CldUploadWidget, CldImage } from "next-cloudinary";

interface Portion {
  id?: string;
  name: string;
  price: string;
  stock: string;
  _deleted?: boolean;
}

interface Extra {
  id?: string;
  name: string;
  price: string;
  _deleted?: boolean;
}

interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

interface Props {
  slug: string;
  mode: "create" | "edit";
  initialData?: {
    id: string;
    name: string;
    description?: string;
    categoryId?: string;
    portions: { id: string; name: string; price: number; stock: number | null }[];
    extras: { id: string; name: string; price: number }[];
    images: ProductImage[];
  };
}

export default function ProductForm({ slug, mode, initialData }: Props) {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [portions, setPortions] = useState<Portion[]>(
    initialData?.portions.map((p) => ({
      id: p.id,
      name: p.name,
      price: (p.price / 100).toFixed(2),
      stock: p.stock != null ? p.stock.toString() : "",
    })) ?? [{ name: "", price: "", stock: "" }]
  );
  const [extras, setExtras] = useState<Extra[]>(
    initialData?.extras.map((e) => ({
      id: e.id,
      name: e.name,
      price: (e.price / 100).toFixed(2),
    })) ?? []
  );
  const [images, setImages] = useState<ProductImage[]>(initialData?.images ?? []);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      try {
        const data = await apiClient(`/stores/${slug}/categories`, { token: session?.access_token });
        setCategories(data);
      } catch {}
    }
    loadCategories();
  }, [slug]);

  function addPortion() {
    setPortions([...portions, { name: "", price: "", stock: "" }]);
  }

  function updatePortion(index: number, field: "name" | "price" | "stock", value: string) {
    const updated = [...portions];
    updated[index] = { ...updated[index], [field]: value };
    setPortions(updated);
  }

  function removePortion(index: number) {
    const portion = portions[index];
    if (portion.id) {
      const updated = [...portions];
      updated[index] = { ...updated[index], _deleted: true };
      setPortions(updated);
    } else {
      setPortions(portions.filter((_, i) => i !== index));
    }
  }

  function addExtra() {
    setExtras([...extras, { name: "", price: "" }]);
  }

  function updateExtra(index: number, field: "name" | "price", value: string) {
    const updated = [...extras];
    updated[index] = { ...updated[index], [field]: value };
    setExtras(updated);
  }

  function removeExtra(index: number) {
    const extra = extras[index];
    if (extra.id) {
      const updated = [...extras];
      updated[index] = { ...updated[index], _deleted: true };
      setExtras(updated);
    } else {
      setExtras(extras.filter((_, i) => i !== index));
    }
  }

  async function handleImageUpload(publicId: string) {
    if (mode === "edit" && initialData?.id) {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      try {
        const newImage = await apiClient(`/stores/${slug}/products/${initialData.id}/images`, {
          method: "POST",
          token: session?.access_token,
          body: JSON.stringify({ url: publicId, sortOrder: images.length }),
        });
        setImages([...images, newImage]);
      } catch (err) {
        console.error(err);
      }
    } else {
      setImages([...images, { id: `temp-${Date.now()}`, url: publicId, sortOrder: images.length }]);
    }
  }

  async function handleImageDelete(image: ProductImage) {
    if (mode === "edit" && initialData?.id && !image.id.startsWith("temp-")) {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      try {
        await apiClient(`/stores/${slug}/products/${initialData.id}/images/${image.id}`, {
          method: "DELETE",
          token: session?.access_token,
        });
      } catch (err) {
        console.error(err);
      }
    }
    setImages(images.filter((i) => i.id !== image.id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let productId = initialData?.id;

      if (mode === "create") {
        const product = await apiClient(`/stores/${slug}/products`, {
          method: "POST",
          token,
          body: JSON.stringify({
            name,
            description: description || undefined,
            categoryId: categoryId || undefined,
            portions: portions.map((p) => ({
              name: p.name,
              price: Math.round(parseFloat(p.price) * 100),
              stock: p.stock ? parseInt(p.stock) : undefined,
            })),
            extras: extras.map((e) => ({
              name: e.name,
              price: Math.round(parseFloat(e.price) * 100),
            })),
          }),
        });
        productId = product.id;

        for (const img of images) {
          await apiClient(`/stores/${slug}/products/${productId}/images`, {
            method: "POST",
            token,
            body: JSON.stringify({ url: img.url, sortOrder: img.sortOrder }),
          });
        }
      } else {
        await apiClient(`/stores/${slug}/products/${productId}`, {
          method: "PATCH",
          token,
          body: JSON.stringify({
            name,
            description: description || undefined,
            categoryId: categoryId || undefined,
          }),
        });

        for (const portion of portions) {
          if (portion._deleted && portion.id) {
            await apiClient(`/stores/${slug}/products/${productId}/portions/${portion.id}`, {
              method: "DELETE",
              token,
            });
          } else if (portion.id) {
            await apiClient(`/stores/${slug}/products/${productId}/portions/${portion.id}`, {
              method: "PATCH",
              token,
              body: JSON.stringify({
                name: portion.name,
                price: Math.round(parseFloat(portion.price) * 100),
                stock: portion.stock ? parseInt(portion.stock) : undefined,
              }),
            });
          } else if (!portion._deleted) {
            await apiClient(`/stores/${slug}/products/${productId}/portions`, {
              method: "POST",
              token,
              body: JSON.stringify({
                name: portion.name,
                price: Math.round(parseFloat(portion.price) * 100),
                stock: portion.stock ? parseInt(portion.stock) : undefined,
              }),
            });
          }
        }

        for (const extra of extras) {
          if (extra._deleted && extra.id) {
            await apiClient(`/stores/${slug}/products/${productId}/extras/${extra.id}`, {
              method: "DELETE",
              token,
            });
          } else if (extra.id) {
            await apiClient(`/stores/${slug}/products/${productId}/extras/${extra.id}`, {
              method: "PATCH",
              token,
              body: JSON.stringify({
                name: extra.name,
                price: Math.round(parseFloat(extra.price) * 100),
              }),
            });
          } else if (!extra._deleted) {
            await apiClient(`/stores/${slug}/products/${productId}/extras`, {
              method: "POST",
              token,
              body: JSON.stringify({
                name: extra.name,
                price: Math.round(parseFloat(extra.price) * 100),
              }),
            });
          }
        }
      }

      router.push(`/dashboard/stores/${slug}/products`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  const visiblePortions = portions.filter((p) => !p._deleted);
  const visibleExtras = extras.filter((e) => !e._deleted);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader><CardTitle>Información básica</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Descripción (opcional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Categoría (opcional)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Imágenes</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <CldImage
                  src={img.url}
                  alt="Producto"
                  width={120}
                  height={120}
                  className="rounded-lg object-cover w-28 h-28 border"
                />
                <button
                  type="button"
                  onClick={() => handleImageDelete(img)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
            <CldUploadWidget
              uploadPreset="lattefy_uploads"
              options={{ maxFiles: 5, multiple: true, folder: "lattefy/products" }}
              onSuccess={(result: any) => handleImageUpload(result.info.public_id)}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="w-28 h-28 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm"
                >
                  + Imagen
                </button>
              )}
            </CldUploadWidget>
          </div>
          <p className="text-xs text-muted-foreground">Podés subir hasta 5 imágenes por producto</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Porciones / Tamaños</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addPortion}>
              + Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {visiblePortions.map((portion) => {
            const realIndex = portions.indexOf(portion);
            return (
              <div key={realIndex} className="flex gap-2 items-end">
                <div className="flex-1 flex flex-col gap-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    placeholder="Ej: Mediano"
                    value={portion.name}
                    onChange={(e) => updatePortion(realIndex, "name", e.target.value)}
                    required
                  />
                </div>
                <div className="w-28 flex flex-col gap-1">
                  <Label className="text-xs">Precio ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={portion.price}
                    onChange={(e) => updatePortion(realIndex, "price", e.target.value)}
                    required
                  />
                </div>
                <div className="w-24 flex flex-col gap-1">
                  <Label className="text-xs">Stock</Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={portion.stock}
                    onChange={(e) => updatePortion(realIndex, "stock", e.target.value)}
                  />
                </div>
                {visiblePortions.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePortion(realIndex)}>
                    ✕
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Extras (opcional)</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addExtra}>
              + Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {visibleExtras.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay extras agregados</p>
          )}
          {visibleExtras.map((extra) => {
            const realIndex = extras.indexOf(extra);
            return (
              <div key={realIndex} className="flex gap-2 items-end">
                <div className="flex-1 flex flex-col gap-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    placeholder="Ej: Queso extra"
                    value={extra.name}
                    onChange={(e) => updateExtra(realIndex, "name", e.target.value)}
                    required
                  />
                </div>
                <div className="w-28 flex flex-col gap-1">
                  <Label className="text-xs">Precio ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={extra.price}
                    onChange={(e) => updateExtra(realIndex, "price", e.target.value)}
                    required
                  />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeExtra(realIndex)}>
                  ✕
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? mode === "create" ? "Creando..." : "Guardando..."
            : mode === "create" ? "Crear producto" : "Guardar cambios"
          }
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}