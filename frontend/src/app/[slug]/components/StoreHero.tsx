"use client";

import { CldImage } from "next-cloudinary";
import { MapPin, Phone, Instagram, Bike, ShoppingBag } from "lucide-react";

export default function StoreHero({
  store,
  open,
}: {
  store: any;
  open: boolean;
}) {
  return (
    <div>
      {/* Cover */}
      <div className="relative h-52 w-full overflow-hidden bg-stone-200">
        {store.branding?.coverUrl ? (
          <CldImage
            src={store.branding.coverUrl}
            alt={store.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400" />
        )}
      </div>

      {/* Logo — fuera del overflow-hidden, superpuesto con margin negativo */}
      <div className="relative bg-white px-5">
        <div className="absolute -top-10 left-5">
          {store.branding?.logoUrl ? (
            <CldImage
              src={store.branding.logoUrl}
              alt={store.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border-4 border-white"
            />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl bg-stone-200 flex items-center justify-center text-2xl font-bold text-stone-600">
              {store.name[0]}
            </div>
          )}
        </div>

          {/* Status pill — floats above the info section */}
        <span className={`absolute right-5 -top-4 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
          open
            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
            : "bg-red-50 text-red-500 border border-red-200"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-red-500"}`} />
          {open ? "Abierto" : "Cerrado"}
        </span>

      {/* Info */}
        <div className="pt-12 pb-5">
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight mb-1">
            {store.name}
          </h1>

          {store.description && (
            <p className="text-sm text-stone-500 mb-3">{store.description}</p>
          )}

          {(store.allowsPickup || store.allowsDelivery) && (
            <div className="flex items-center gap-4 mb-3">
              {store.allowsPickup && (
                <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                  Take Away{store.pickupTime ? ` · ${store.pickupTime}` : ""}
                </span>
              )}
              {store.allowsDelivery && (
                <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <Bike className="w-3.5 h-3.5 shrink-0" />
                  Delivery{store.deliveryTime ? ` · ${store.deliveryTime}` : ""}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            {store.address && (
              <span className="flex items-center gap-1.5 text-xs text-stone-400">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {store.address}{store.city ? `, ${store.city}` : ""}
              </span>
            )}
            {store.phone && (
              <span className="flex items-center gap-1.5 text-xs text-stone-400">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                {store.phone}
              </span>
            )}
            {store.instagram && (
              <span className="flex items-center gap-1.5 text-xs text-stone-400">
                <Instagram className="w-3.5 h-3.5 shrink-0" />
                {store.instagram}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}