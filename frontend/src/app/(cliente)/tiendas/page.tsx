import { apiClient } from "@/lib/api";
import TiendasClient from "./TiendasClient";

async function getStores() {
  try {
    return await apiClient("/stores");
  } catch {
    return [];
  }
}

export default async function TiendasPage() {
  const stores = await getStores();
  return <TiendasClient stores={stores} />;
}
