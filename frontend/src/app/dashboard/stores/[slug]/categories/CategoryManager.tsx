"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export default function CategoryManager({
  slug,
  initialCategories,
}: {
  slug: string;
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);

  async function getToken() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const token = await getToken();
      const created = await apiClient(`/stores/${slug}/categories`, {
        method: "POST",
        token,
        body: JSON.stringify({ name: newName.trim(), sortOrder: categories.length }),
      });
      setCategories([...categories, created]);
      setNewName("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(id: string) {
    if (!editingName.trim()) return;
    setLoading(true);
    try {
      const token = await getToken();
      const updated = await apiClient(`/stores/${slug}/categories/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ name: editingName.trim() }),
      });
      setCategories(categories.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    setLoading(true);
    try {
      const token = await getToken();
      const updated = await apiClient(`/stores/${slug}/categories/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ isActive: !isActive }),
      });
      setCategories(categories.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return;
    const updated = [...categories];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setCategories(updated);
    await saveOrder(updated);
  }

  async function handleMoveDown(index: number) {
    if (index === categories.length - 1) return;
    const updated = [...categories];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setCategories(updated);
    await saveOrder(updated);
  }

  async function saveOrder(ordered: Category[]) {
    try {
      const token = await getToken();
      await Promise.all(
        ordered.map((cat, index) =>
          apiClient(`/stores/${slug}/categories/${cat.id}`, {
            method: "PATCH",
            token,
            body: JSON.stringify({ sortOrder: index }),
          })
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          placeholder="Nueva categoría..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          Crear
        </Button>
      </form>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay categorías todavía</p>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((cat, index) => (
            <Card key={cat.id} className={!cat.isActive ? "opacity-50" : ""}>
              <CardContent className="flex items-center gap-2 py-3">
                <div className="flex flex-col gap-0.5 mr-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || loading}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === categories.length - 1 || loading}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                {editingId === cat.id ? (
                  <Input
                    className="flex-1 h-8"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit(cat.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                )}

                <div className="flex gap-1">
                  {editingId === cat.id ? (
                    <>
                      <Button size="sm" variant="default" onClick={() => handleEdit(cat.id)} disabled={loading}>
                        Guardar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(cat.id, cat.isActive)}
                        disabled={loading}
                      >
                        {cat.isActive ? "Ocultar" : "Mostrar"}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}