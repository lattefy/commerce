"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";

export default function PerfilClient({ user }: { user: any }) {
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      await apiClient("/me", {
        method: "PATCH",
        token: session?.access_token,
        body: JSON.stringify({ name, phone: phone || undefined }),
      });

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "lattefy-role=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <div className="max-w-md flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-stone-900">Mi perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="bg-stone-50" />
              <p className="text-xs text-stone-400">El email no se puede cambiar</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Teléfono (opcional)</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+598 99 123 456"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600">Cambios guardados</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-destructive hover:opacity-80 transition-opacity"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </CardContent>
      </Card>
    </div>
  );
}