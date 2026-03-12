import ClientNavbar from "./ClientNavbar";

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      <ClientNavbar />
      <main className="max-w-5xl mx-auto px-4 pb-8">
        {children}
      </main>
    </div>
  );
}
