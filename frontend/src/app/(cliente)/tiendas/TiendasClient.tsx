"use client";

import Link from "next/link";
import { CldImage } from "next-cloudinary";
import { ShoppingBag, Bike, MapPin } from "lucide-react";

export default function TiendasClient({ stores }: { stores: any[] }) {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-stone-900">Tiendas</h1>
          <p className="text-stone-400 mt-1">Encontrá tu tienda favorita</p>
        </div>

        {stores.length === 0 ? (
          <p className="text-stone-400">No hay tiendas disponibles por ahora.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store: any) => (
              <Link key={store.id} href={`/stores/${store.slug}`}>
                <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="h-32 bg-stone-200 relative">
                    {store.branding?.coverUrl ? (
                      <CldImage
                        src={store.branding.coverUrl}
                        alt={store.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400" />
                    )}
                    <div className="absolute -bottom-6 left-4">
                      {store.branding?.logoUrl ? (
                        <CldImage
                          src={store.branding.logoUrl}
                          alt={store.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full border-2 border-white object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-white bg-stone-300 flex items-center justify-center text-lg font-bold text-stone-600">
                          {store.name[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 px-4 pb-4 flex flex-col gap-2">
                    <p className="font-bold text-stone-900">{store.name}</p>
                    {store.description && (
                      <p className="text-xs text-stone-400 line-clamp-2">{store.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {store.allowsPickup && (
                        <span className="flex items-center gap-1 text-xs text-stone-400">
                          <ShoppingBag className="w-3 h-3" /> Take Away
                        </span>
                      )}
                      {store.allowsDelivery && (
                        <span className="flex items-center gap-1 text-xs text-stone-400">
                          <Bike className="w-3 h-3" /> Delivery
                        </span>
                      )}
                      {store.city && (
                        <span className="flex items-center gap-1 text-xs text-stone-400 ml-auto">
                          <MapPin className="w-3 h-3" /> {store.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}