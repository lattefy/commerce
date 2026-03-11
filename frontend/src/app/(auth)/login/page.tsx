"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
  
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
  
    const { data: { session } } = await supabase.auth.getSession();
  
    try {
      const me = await apiClient("/me", { token: session?.access_token });
  
      if (me.user?.globalRole === "PLATFORM_ADMIN") {
        router.push("/admin");
      } else if (me.memberships?.length > 0) {
        router.push("/dashboard");
      } else {
        router.push("/tiendas");
      }
    } catch {
      router.push("/");
    } finally {
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Ingresá tu email y contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              ¿No tenés cuenta?{" "}
              <Link href="/register" className="underline">
                Registrarse
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}