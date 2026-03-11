import { apiClient } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TiendasClient from "./TiendasClient";

async function getStores() {
  try {
    return await apiClient("/stores");
  } catch {
    return [];
  }
}

export default async function TiendasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const stores = await getStores();

  return <TiendasClient stores={stores} />;
}