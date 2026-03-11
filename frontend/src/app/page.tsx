import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Lattefy</h1>
      <p className="text-muted-foreground">Multi-tenant ecommerce + loyalty</p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/login">Iniciar sesión</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/register">Registrarse</Link>
        </Button>
      </div>
    </main>
  );
}