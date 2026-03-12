import CartProviderWrapper from "./CartProviderWrapper";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="min-h-screen bg-white">
      <CartProviderWrapper slug={slug}>
        {children}
      </CartProviderWrapper>
    </div>
  );
}
