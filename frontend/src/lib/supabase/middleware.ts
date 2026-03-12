import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const CUSTOMER_ROUTES = ["/pedidos", "/puntos", "/perfil"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const role = request.cookies.get("lattefy-role")?.value;

  function redirectTo(path: string) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url);
  }

  // /admin — must be authenticated and PLATFORM_ADMIN
  if (pathname.startsWith("/admin")) {
    if (!user) return redirectTo("/login");
    if (role && role !== "PLATFORM_ADMIN") return redirectTo("/tiendas");
  }

  // /dashboard — must be authenticated
  if (pathname.startsWith("/dashboard")) {
    if (!user) return redirectTo("/login");
  }

  // Customer routes — must be authenticated
  if (CUSTOMER_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
