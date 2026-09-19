import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const privateRoutes = ['/dashboard', '/schedule', '/groups', '/events', '/birthdays', '/presence', '/meetings'];
  const isPrivateRoute = privateRoutes.some(route => pathname.startsWith(route));

  // 1. Si no hay usuario y la ruta es privada -> Login
  if (!user && isPrivateRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Si hay usuario y la ruta es privada -> Validar Rol
  if (user && isPrivateRoute) {
    const { data: teacher, error } = await supabase
      .from('teachers')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    // Validación robusta contra null, undefined o errores de DB
    if (error || !teacher || !teacher.role) {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    const authorizedRoles = ['líder de ministerio', 'admin de app', 'admin de cronograma', 'líder de grupo', 'maestra', 'apoyo'];
    
    if (!authorizedRoles.includes(teacher.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}