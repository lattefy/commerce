import CartProviderWrapper from "./CartProviderWrapper";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="min-h-screen bg-white">
      <CartProviderWrapper>
        {children}
      </CartProviderWrapper>
    </div>
  );
}