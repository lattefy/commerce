"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PERMISSION_LABELS: Record<string, string> = {
  canManageOrders: "Órdenes",
  canManageProducts: "Productos",
  canManageOperations: "Tiempos de entrega",
  canManageLoyalty: "Loyalty",
  canManageEmployees: "Empleados",
  canViewAnalytics: "Analytics",
};

const PERMISSIONS = Object.keys(PERMISSION_LABELS) as (keyof typeof PERMISSION_LABELS)[];

type Member = {
  id: string;
  user: { id: string; name: string | null; email: string };
  canManageOrders: boolean;
  canManageProducts: boolean;
  canManageOperations: boolean;
  canManageLoyalty: boolean;
  canManageEmployees: boolean;
  canViewAnalytics: boolean;
};

export default function MembersClient({
  slug,
  initialMembers,
}: {
  slug: string;
  initialMembers: Member[];
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function getToken() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setAdding(true);
    try {
      const token = await getToken();
      const newMember = await apiClient(`/stores/${slug}/members`, {
        method: "POST",
        token,
        body: JSON.stringify({ email }),
      });
      setMembers((prev) => [...prev, newMember]);
      setEmail("");
      setSuccess("Empleado agregado correctamente");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleTogglePermission(member: Member, permission: string, value: boolean) {
    try {
      const token = await getToken();
      const updated = await apiClient(`/stores/${slug}/members/${member.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ [permission]: value }),
      });
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleRemove(memberId: string) {
    try {
      const token = await getToken();
      await apiClient(`/stores/${slug}/members/${memberId}`, {
        method: "DELETE",
        token,
      });
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader><CardTitle>Agregar empleado</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              type="email"
              placeholder="email@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={adding}>
              {adding ? "Agregando..." : "Agregar"}
            </Button>
          </form>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
        </CardContent>
      </Card>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay empleados todavía.</p>
      ) : (
        members.map((member) => (
          <Card key={member.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <p className="font-medium text-sm">{member.user.name ?? "Sin nombre"}</p>
                <p className="text-xs text-muted-foreground">{member.user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleRemove(member.id)}
              >
                Eliminar
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {PERMISSIONS.map((permission) => (
                <label key={permission} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={member[permission as keyof Member] as boolean}
                    onChange={(e) => handleTogglePermission(member, permission, e.target.checked)}
                  />
                  <span className="text-sm">{PERMISSION_LABELS[permission]}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}