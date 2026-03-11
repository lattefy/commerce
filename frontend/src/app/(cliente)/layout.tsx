import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClientNavbar from "./ClientNavbar";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-stone-50">
      <ClientNavbar />
      <main className="max-w-5xl mx-auto px-4 pb-8">
        {children}
      </main>
    </div>
  );
}